import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const baseSymbol: string = body.base_symbol || "WIN";
    const timeframe: string = body.timeframe || "M1";
    const mode: string = body.mode || "rebuild";
    const dayOffset: number = body.day_offset || 0;
    const daysPerCall: number = body.days_per_call || 5;

    if (mode === "delete_all") {
      await supabase.from("continuous_market_candles").delete()
        .eq("base_symbol", baseSymbol).eq("timeframe", timeframe);
      return respond({ success: true, action: "deleted" });
    }

    // Get instruments
    const { data: instruments } = await supabase.from("instruments")
      .select("id, symbol").like("base_symbol", `${baseSymbol}%`);
    if (!instruments?.length) throw new Error("No instruments");

    // Instead of querying per instrument per day, query ALL candles for a day range
    // and group in code
    const { data: minR } = await supabase.from("market_candles").select("ts_open")
      .in("instrument_id", instruments.map(i => i.id)).eq("timeframe", timeframe)
      .order("ts_open", { ascending: true }).limit(1);
    const { data: maxR } = await supabase.from("market_candles").select("ts_open")
      .in("instrument_id", instruments.map(i => i.id)).eq("timeframe", timeframe)
      .order("ts_open", { ascending: false }).limit(1);
    if (!minR?.length || !maxR?.length) throw new Error("No data");

    const allDays: string[] = [];
    const d = new Date(minR[0].ts_open); d.setUTCHours(0, 0, 0, 0);
    const maxD = new Date(maxR[0].ts_open);
    while (d <= maxD) {
      allDays.push(d.toISOString().split('T')[0]);
      d.setUTCDate(d.getUTCDate() + 1);
    }

    const daysSlice = allDays.slice(dayOffset, dayOffset + daysPerCall);
    if (!daysSlice.length) {
      return respond({ success: true, done: true, total_days: allDays.length });
    }

    const instMap = new Map(instruments.map(i => [i.id, i.symbol]));
    const stats: any[] = [];
    let totalInserted = 0;

    // Process each day individually - one query per day to get ALL instrument data
    for (const day of daysSlice) {
      const dayStart = `${day}T00:00:00+00`;
      const dayEnd = `${day}T23:59:59.999+00`;

      // Fetch ALL candles for ALL instruments for this day (up to 1000)
      // This is much faster than N queries per instrument
      let allCandles: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase.from("market_candles")
          .select("*")
          .in("instrument_id", instruments.map(i => i.id))
          .eq("timeframe", timeframe)
          .gte("ts_open", dayStart).lte("ts_open", dayEnd)
          .order("ts_open", { ascending: true })
          .range(offset, offset + 999);
        if (error) throw new Error(error.message);
        if (!data?.length) break;
        allCandles = allCandles.concat(data);
        if (data.length < 1000) break;
        offset += 1000;
      }

      if (!allCandles.length) continue;

      // Group by instrument and count
      const countByInst = new Map<string, number>();
      for (const c of allCandles) {
        countByInst.set(c.instrument_id, (countByInst.get(c.instrument_id) || 0) + 1);
      }

      // Find best: most candles, then symbol ASC
      let bestId = "", bestCount = 0, bestSymbol = "ZZZZ";
      for (const [instId, cnt] of countByInst) {
        const sym = instMap.get(instId) || "ZZZZ";
        if (cnt > bestCount || (cnt === bestCount && sym < bestSymbol)) {
          bestId = instId; bestCount = cnt; bestSymbol = sym;
        }
      }

      // Filter candles for the best instrument
      const bestCandles = allCandles
        .filter(c => c.instrument_id === bestId)
        .sort((a, b) => a.ts_open.localeCompare(b.ts_open));

      const rows = bestCandles.map(c => ({
        base_symbol: baseSymbol, source_symbol: bestSymbol,
        source_instrument_id: bestId, timeframe,
        ts_open: c.ts_open, ts_close: c.ts_close,
        open: c.open, high: c.high, low: c.low, close: c.close,
        volume: c.volume, vwap: c.vwap, trade_count: c.trade_count,
        roll_method: "max_liquidity_v2",
      }));

      // Insert
      for (let i = 0; i < rows.length; i += 1000) {
        const { error: insErr } = await supabase.from("continuous_market_candles").insert(rows.slice(i, i + 1000));
        if (insErr) throw new Error(`Insert ${day}: ${insErr.message}`);
      }

      totalInserted += rows.length;
      stats.push({ d: day, s: bestSymbol, n: rows.length });
    }

    const nextOffset = dayOffset + daysSlice.length;
    const hasMore = nextOffset < allDays.length;

    return respond({
      success: true, timeframe, days_processed: daysSlice.length,
      candles_inserted: totalInserted, has_more: hasMore,
      next_offset: nextOffset, total_days: allDays.length, stats,
    });

  } catch (e) {
    console.error("[rebuild-continuous] Error:", e);
    return respond({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }

  function respond(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
