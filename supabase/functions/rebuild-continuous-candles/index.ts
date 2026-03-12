import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

/**
 * rebuild-continuous-candles v2
 * 
 * Rebuilds continuous_market_candles using the best contract per day.
 * Selection: most candles > most volume > nearest expiry (symbol ASC).
 * 
 * Optimized: processes one day at a time via resume to avoid timeouts.
 * 
 * Body params:
 *   base_symbol: string (default "WIN")
 *   timeframe: string (default "M1")
 *   day_date: string (YYYY-MM-DD) - specific day to process
 *   mode: "list_days" | "process_day" | "delete_all"
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const baseSymbol: string = body.base_symbol || "WIN";
    const timeframe: string = body.timeframe || "M1";
    const mode: string = body.mode || "process_day";
    const dayDate: string = body.day_date || "";

    // MODE: delete_all - clear existing data
    if (mode === "delete_all") {
      await supabase
        .from("continuous_market_candles")
        .delete()
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe);
      return new Response(JSON.stringify({ success: true, action: "deleted", base_symbol: baseSymbol, timeframe }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get instruments for this base_symbol
    const { data: instruments, error: instErr } = await supabase
      .from("instruments")
      .select("id, symbol")
      .like("base_symbol", `${baseSymbol}%`);

    if (instErr || !instruments?.length) {
      return new Response(JSON.stringify({ error: "No instruments found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const instrumentIds = instruments.map(i => i.id);

    // MODE: list_days - return all distinct days that have data
    if (mode === "list_days") {
      // Get min/max date range
      const { data: minRow } = await supabase
        .from("market_candles").select("ts_open")
        .in("instrument_id", instrumentIds).eq("timeframe", timeframe)
        .order("ts_open", { ascending: true }).limit(1);
      const { data: maxRow } = await supabase
        .from("market_candles").select("ts_open")
        .in("instrument_id", instrumentIds).eq("timeframe", timeframe)
        .order("ts_open", { ascending: false }).limit(1);

      if (!minRow?.length || !maxRow?.length) {
        return new Response(JSON.stringify({ days: [], total: 0 }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const minDate = new Date(minRow[0].ts_open);
      const maxDate = new Date(maxRow[0].ts_open);
      const days: string[] = [];
      const d = new Date(minDate);
      d.setUTCHours(0, 0, 0, 0);
      while (d <= maxDate) {
        days.push(d.toISOString().split('T')[0]);
        d.setUTCDate(d.getUTCDate() + 1);
      }

      return new Response(JSON.stringify({ days, total: days.length, min: minRow[0].ts_open, max: maxRow[0].ts_open }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // MODE: process_day - process a single day
    if (!dayDate) {
      return new Response(JSON.stringify({ error: "day_date required for process_day mode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dayStart = `${dayDate}T00:00:00+00`;
    const dayEnd = `${dayDate}T23:59:59.999+00`;

    // Delete existing for this day
    await supabase
      .from("continuous_market_candles")
      .delete()
      .eq("base_symbol", baseSymbol)
      .eq("timeframe", timeframe)
      .gte("ts_open", dayStart)
      .lte("ts_open", dayEnd);

    // Find best contract: count candles per instrument
    const candidates: { id: string; symbol: string; count: number }[] = [];
    
    for (const inst of instruments) {
      const { count } = await supabase
        .from("market_candles")
        .select("*", { count: "exact", head: true })
        .eq("instrument_id", inst.id)
        .eq("timeframe", timeframe)
        .gte("ts_open", dayStart)
        .lte("ts_open", dayEnd);

      if (count && count > 0) {
        candidates.push({ id: inst.id, symbol: inst.symbol, count });
      }
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ success: true, day: dayDate, skipped: true, reason: "no_data" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sort: most candles, then symbol ASC (nearest expiry)
    candidates.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.symbol.localeCompare(b.symbol);
    });

    const best = candidates[0];

    // Fetch all candles for the winning contract
    let allCandles: any[] = [];
    let offset = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("market_candles")
        .select("*")
        .eq("instrument_id", best.id)
        .eq("timeframe", timeframe)
        .gte("ts_open", dayStart)
        .lte("ts_open", dayEnd)
        .order("ts_open", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (error) throw new Error(error.message);
      if (!data?.length) break;
      allCandles = allCandles.concat(data);
      if (data.length < PAGE) break;
      offset += PAGE;
    }

    // Insert as continuous
    const rows = allCandles.map(c => ({
      base_symbol: baseSymbol,
      source_symbol: best.symbol,
      source_instrument_id: best.id,
      timeframe,
      ts_open: c.ts_open,
      ts_close: c.ts_close,
      open: c.open, high: c.high, low: c.low, close: c.close,
      volume: c.volume, vwap: c.vwap, trade_count: c.trade_count,
      roll_method: "max_liquidity_v2",
    }));

    for (let i = 0; i < rows.length; i += 1000) {
      const { error: insErr } = await supabase.from("continuous_market_candles").insert(rows.slice(i, i + 1000));
      if (insErr) throw new Error(`Insert: ${insErr.message}`);
    }

    return new Response(JSON.stringify({
      success: true, day: dayDate, symbol: best.symbol, count: rows.length,
      candidates: candidates.map(c => ({ symbol: c.symbol, count: c.count })),
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[rebuild-continuous] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
