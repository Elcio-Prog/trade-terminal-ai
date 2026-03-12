import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

/**
 * rebuild-continuous-candles v2
 * 
 * Rebuilds continuous_market_candles for a given base_symbol and timeframe
 * using the BEST contract per day:
 *   1. Most candles (count DESC)
 *   2. Most volume (sum DESC)  
 *   3. Nearest expiry (symbol ASC as proxy)
 * 
 * Supports resumable execution via day_offset parameter.
 * 
 * Body params:
 *   base_symbol: string (default "WIN")
 *   timeframe: string (default "M1")
 *   day_offset: number (default 0) - skip N days for resume
 *   days_per_call: number (default 30) - max days per invocation
 *   delete_first: boolean (default true on first call)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const bridgeSecret = req.headers.get("x-bridge-secret");
    const authHeader = req.headers.get("Authorization");
    const expectedSecret = Deno.env.get("BRIDGE_SECRET");
    if (expectedSecret && bridgeSecret !== expectedSecret && !authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const baseSymbol: string = body.base_symbol || "WIN";
    const timeframe: string = body.timeframe || "M1";
    const dayOffset: number = body.day_offset || 0;
    const daysPerCall: number = body.days_per_call || 30;
    const deleteFirst: boolean = body.delete_first !== false && dayOffset === 0;

    console.log(`[rebuild-continuous] base=${baseSymbol} tf=${timeframe} offset=${dayOffset} daysPerCall=${daysPerCall} delete=${deleteFirst}`);

    // Step 1: Get all distinct days from market_candles via instruments
    // We need instrument_ids for this base_symbol
    const { data: instruments, error: instErr } = await supabase
      .from("instruments")
      .select("id, symbol")
      .like("base_symbol", `${baseSymbol}%`);

    if (instErr) throw new Error(`Instruments fetch: ${instErr.message}`);
    if (!instruments || instruments.length === 0) {
      return new Response(JSON.stringify({ error: "No instruments found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instrumentIds = instruments.map(i => i.id);
    const instrumentMap = new Map(instruments.map(i => [i.id, i.symbol]));

    // Step 2: Get distinct days using raw SQL approach via multiple queries
    // First get the date range from market_candles
    // We'll query day by day starting from the earliest data
    
    // Get min/max dates - use a single instrument query to find range
    const { data: rangeData } = await supabase
      .from("market_candles")
      .select("ts_open")
      .in("instrument_id", instrumentIds)
      .eq("timeframe", timeframe)
      .order("ts_open", { ascending: true })
      .limit(1);
    
    const { data: rangeDataMax } = await supabase
      .from("market_candles")
      .select("ts_open")
      .in("instrument_id", instrumentIds)
      .eq("timeframe", timeframe)
      .order("ts_open", { ascending: false })
      .limit(1);

    if (!rangeData?.length || !rangeDataMax?.length) {
      return new Response(JSON.stringify({ error: "No candle data found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const minDate = new Date(rangeData[0].ts_open);
    const maxDate = new Date(rangeDataMax[0].ts_open);
    
    // Build list of dates
    const allDays: string[] = [];
    const d = new Date(minDate);
    d.setUTCHours(0, 0, 0, 0);
    const maxD = new Date(maxDate);
    maxD.setUTCHours(23, 59, 59, 999);
    
    while (d <= maxD) {
      allDays.push(d.toISOString().split('T')[0]);
      d.setUTCDate(d.getUTCDate() + 1);
    }

    const daysToProcess = allDays.slice(dayOffset, dayOffset + daysPerCall);
    const hasMore = (dayOffset + daysPerCall) < allDays.length;

    console.log(`[rebuild-continuous] Total days: ${allDays.length}, processing: ${daysToProcess.length} (offset ${dayOffset})`);

    if (daysToProcess.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No more days to process",
        has_more: false,
        total_days: allDays.length,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete existing data for this base_symbol+timeframe on first call
    if (deleteFirst) {
      console.log(`[rebuild-continuous] Deleting existing data for ${baseSymbol}/${timeframe}`);
      await supabase
        .from("continuous_market_candles")
        .delete()
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe);
    }

    let totalInserted = 0;
    let daysProcessed = 0;
    const dailyStats: { date: string; symbol: string; count: number }[] = [];

    for (const day of daysToProcess) {
      const dayStart = `${day}T00:00:00+00`;
      const dayEnd = `${day}T23:59:59.999+00`;

      // For each instrument, count candles on this day
      const candidateCounts: { instrumentId: string; symbol: string; count: number; volume: number }[] = [];

      for (const inst of instruments) {
        // Count candles for this instrument on this day
        const { count, error: cntErr } = await supabase
          .from("market_candles")
          .select("*", { count: "exact", head: true })
          .eq("instrument_id", inst.id)
          .eq("timeframe", timeframe)
          .gte("ts_open", dayStart)
          .lte("ts_open", dayEnd);

        if (!cntErr && count && count > 0) {
          // Get volume sum
          const { data: volData } = await supabase
            .from("market_candles")
            .select("volume")
            .eq("instrument_id", inst.id)
            .eq("timeframe", timeframe)
            .gte("ts_open", dayStart)
            .lte("ts_open", dayEnd);
          
          const totalVolume = volData?.reduce((s, r) => s + (Number(r.volume) || 0), 0) || 0;

          candidateCounts.push({
            instrumentId: inst.id,
            symbol: inst.symbol,
            count: count,
            volume: totalVolume,
          });
        }
      }

      if (candidateCounts.length === 0) continue;

      // Sort: most candles DESC, most volume DESC, symbol ASC (nearest expiry)
      candidateCounts.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.volume !== a.volume) return b.volume - a.volume;
        return a.symbol.localeCompare(b.symbol);
      });

      const bestContract = candidateCounts[0];
      console.log(`[rebuild-continuous] ${day}: best=${bestContract.symbol} count=${bestContract.count} vol=${bestContract.volume}`);

      // Fetch all candles for the winning contract on this day
      // Need to paginate since could be > 1000
      let offset = 0;
      const PAGE = 1000;
      let allCandles: any[] = [];
      
      while (true) {
        const { data: candles, error: fetchErr } = await supabase
          .from("market_candles")
          .select("*")
          .eq("instrument_id", bestContract.instrumentId)
          .eq("timeframe", timeframe)
          .gte("ts_open", dayStart)
          .lte("ts_open", dayEnd)
          .order("ts_open", { ascending: true })
          .range(offset, offset + PAGE - 1);

        if (fetchErr) throw new Error(`Fetch candles: ${fetchErr.message}`);
        if (!candles || candles.length === 0) break;
        allCandles = allCandles.concat(candles);
        if (candles.length < PAGE) break;
        offset += PAGE;
      }

      // Transform to continuous_market_candles format
      const rows = allCandles.map((c, idx) => ({
        base_symbol: baseSymbol,
        source_symbol: bestContract.symbol,
        source_instrument_id: bestContract.instrumentId,
        timeframe: timeframe,
        ts_open: c.ts_open,
        ts_close: c.ts_close,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        vwap: c.vwap,
        trade_count: c.trade_count,
        roll_method: "max_liquidity_v2",
      }));

      // Insert in batches
      for (let i = 0; i < rows.length; i += 1000) {
        const batch = rows.slice(i, i + 1000);
        const { error: insErr } = await supabase
          .from("continuous_market_candles")
          .insert(batch);
        if (insErr) throw new Error(`Insert error on ${day}: ${insErr.message}`);
      }

      totalInserted += rows.length;
      daysProcessed++;
      dailyStats.push({ date: day, symbol: bestContract.symbol, count: rows.length });
    }

    return new Response(JSON.stringify({
      success: true,
      base_symbol: baseSymbol,
      timeframe: timeframe,
      days_processed: daysProcessed,
      candles_inserted: totalInserted,
      has_more: hasMore,
      daily_stats: dailyStats,
      resume: hasMore ? {
        day_offset: dayOffset + daysPerCall,
        delete_first: false,
      } : null,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[rebuild-continuous] Error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
