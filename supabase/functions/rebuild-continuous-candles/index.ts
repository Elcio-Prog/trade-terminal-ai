import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

/**
 * rebuild-continuous-candles v2
 * Processes multiple days per call with timeout awareness.
 * 
 * Body params:
 *   base_symbol: string (default "WIN")
 *   timeframe: string (default "M1")
 *   mode: "delete_all" | "rebuild"
 *   day_offset: number (default 0)
 *   days_per_call: number (default 10)
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
    const mode: string = body.mode || "rebuild";
    const dayOffset: number = body.day_offset || 0;
    const daysPerCall: number = body.days_per_call || 10;

    if (mode === "delete_all") {
      await supabase.from("continuous_market_candles").delete()
        .eq("base_symbol", baseSymbol).eq("timeframe", timeframe);
      return new Response(JSON.stringify({ success: true, action: "deleted" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get instruments
    const { data: instruments } = await supabase.from("instruments")
      .select("id, symbol").like("base_symbol", `${baseSymbol}%`);
    if (!instruments?.length) throw new Error("No instruments");

    // Get date range from market_candles
    const { data: minR } = await supabase.from("market_candles").select("ts_open")
      .in("instrument_id", instruments.map(i => i.id)).eq("timeframe", timeframe)
      .order("ts_open", { ascending: true }).limit(1);
    const { data: maxR } = await supabase.from("market_candles").select("ts_open")
      .in("instrument_id", instruments.map(i => i.id)).eq("timeframe", timeframe)
      .order("ts_open", { ascending: false }).limit(1);

    if (!minR?.length || !maxR?.length) throw new Error("No data");

    // Build day list
    const allDays: string[] = [];
    const d = new Date(minR[0].ts_open); d.setUTCHours(0, 0, 0, 0);
    const maxD = new Date(maxR[0].ts_open);
    while (d <= maxD) {
      allDays.push(d.toISOString().split('T')[0]);
      d.setUTCDate(d.getUTCDate() + 1);
    }

    const daysSlice = allDays.slice(dayOffset, dayOffset + daysPerCall);
    if (!daysSlice.length) {
      return new Response(JSON.stringify({ success: true, done: true, total_days: allDays.length }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();
    const stats: any[] = [];
    let totalInserted = 0;
    let daysActuallyProcessed = 0;

    for (const day of daysSlice) {
      // Timeout guard: stop if >45s elapsed
      if (Date.now() - startTime > 45000) break;

      const dayStart = `${day}T00:00:00+00`;
      const dayEnd = `${day}T23:59:59.999+00`;

      // Find best contract via count per instrument
      let bestId = "", bestSymbol = "", bestCount = 0;
      for (const inst of instruments) {
        const { count } = await supabase.from("market_candles")
          .select("*", { count: "exact", head: true })
          .eq("instrument_id", inst.id).eq("timeframe", timeframe)
          .gte("ts_open", dayStart).lte("ts_open", dayEnd);
        if (count && count > bestCount) {
          bestCount = count; bestId = inst.id; bestSymbol = inst.symbol;
        } else if (count && count === bestCount && inst.symbol < bestSymbol) {
          bestId = inst.id; bestSymbol = inst.symbol;
        }
      }

      if (bestCount === 0) { daysActuallyProcessed++; continue; }

      // Fetch candles for best contract
      const { data: candles } = await supabase.from("market_candles")
        .select("*").eq("instrument_id", bestId).eq("timeframe", timeframe)
        .gte("ts_open", dayStart).lte("ts_open", dayEnd)
        .order("ts_open", { ascending: true }).limit(1000);

      if (!candles?.length) { daysActuallyProcessed++; continue; }

      const rows = candles.map(c => ({
        base_symbol: baseSymbol, source_symbol: bestSymbol,
        source_instrument_id: bestId, timeframe,
        ts_open: c.ts_open, ts_close: c.ts_close,
        open: c.open, high: c.high, low: c.low, close: c.close,
        volume: c.volume, vwap: c.vwap, trade_count: c.trade_count,
        roll_method: "max_liquidity_v2",
      }));

      const { error: insErr } = await supabase.from("continuous_market_candles").insert(rows);
      if (insErr) throw new Error(`Insert ${day}: ${insErr.message}`);

      totalInserted += rows.length;
      stats.push({ d: day, s: bestSymbol, n: rows.length });
      daysActuallyProcessed++;
    }

    const hasMore = (dayOffset + daysActuallyProcessed) < allDays.length;

    return new Response(JSON.stringify({
      success: true, timeframe, days_processed: daysActuallyProcessed,
      candles_inserted: totalInserted, has_more: hasMore,
      next_offset: dayOffset + daysActuallyProcessed,
      total_days: allDays.length, stats,
      elapsed_ms: Date.now() - startTime,
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
