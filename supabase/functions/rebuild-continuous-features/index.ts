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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const baseSymbol = body.base_symbol || "WIN";
    const timeframe = body.timeframe || "M1";
    const startOffset: number = body.start_offset || 0;
    const deleteFirst: boolean = body.delete_first !== false && startOffset === 0;
    // Resume state
    let prevCloses: number[] = body.prev_closes || [];
    let prevVolumes: number[] = body.prev_volumes || [];
    let prevHighs: number[] = body.prev_highs || [];
    let prevLows: number[] = body.prev_lows || [];
    let prevDir: number = body.prev_dir || 0; // 1=up, -1=down
    let upSeq: number = body.up_seq || 0;
    let downSeq: number = body.down_seq || 0;

    console.log(`[features] symbol=${baseSymbol} tf=${timeframe} offset=${startOffset}`);

    if (deleteFirst) {
      await supabase
        .from("continuous_feature_vectors")
        .delete()
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe);
    }

    const PAGE = 1000;
    const MAX_PAGES = 30;
    let offset = startOffset;
    let pagesProcessed = 0;
    let totalInserted = 0;
    let hasMore = true;

    while (hasMore && pagesProcessed < MAX_PAGES) {
      const { data: candles, error } = await supabase
        .from("continuous_market_candles")
        .select("id, ts_open, open, high, low, close, volume")
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe)
        .order("ts_open", { ascending: true })
        .range(offset, offset + PAGE - 1);

      if (error) throw new Error(`Fetch: ${error.message}`);
      if (!candles || candles.length === 0) { hasMore = false; break; }

      const features: any[] = [];

      for (const c of candles) {
        const close = Number(c.close);
        const open = Number(c.open);
        const high = Number(c.high);
        const low = Number(c.low);
        const vol = Number(c.volume || 0);

        prevCloses.push(close);
        prevVolumes.push(vol);
        prevHighs.push(high);
        prevLows.push(low);

        // Keep max 21 for MA-20 + current
        if (prevCloses.length > 21) prevCloses.shift();
        if (prevVolumes.length > 21) prevVolumes.shift();
        if (prevHighs.length > 21) prevHighs.shift();
        if (prevLows.length > 21) prevLows.shift();

        const n = prevCloses.length;
        if (n < 2) {
          // Track direction
          prevDir = 0;
          continue;
        }

        const prevClose = prevCloses[n - 2];
        const diff = close - prevClose;
        const curDir = diff > 0 ? 1 : diff < 0 ? -1 : prevDir;

        if (curDir === prevDir && curDir > 0) { upSeq++; downSeq = 0; }
        else if (curDir === prevDir && curDir < 0) { downSeq++; upSeq = 0; }
        else if (curDir > 0) { upSeq = 1; downSeq = 0; }
        else if (curDir < 0) { downSeq = 1; upSeq = 0; }
        prevDir = curDir;

        // Returns
        const ret1 = prevClose !== 0 ? (close - prevClose) / prevClose : null;
        const ret3 = n >= 4 ? (close - prevCloses[n - 4]) / prevCloses[n - 4] : null;
        const ret5 = n >= 6 ? (close - prevCloses[n - 6]) / prevCloses[n - 6] : null;
        const ret10 = n >= 11 ? (close - prevCloses[n - 11]) / prevCloses[n - 11] : null;

        // Candle metrics
        const rangePoints = high - low;
        const bodyPoints = close - open;
        const upperWick = high - Math.max(open, close);
        const lowerWick = Math.min(open, close) - low;

        // MAs
        const ma9 = n >= 9 ? prevCloses.slice(-9).reduce((a, b) => a + b, 0) / 9 : null;
        const ma20 = n >= 20 ? prevCloses.slice(-20).reduce((a, b) => a + b, 0) / 20 : null;
        const closeVsMa9 = ma9 ? close - ma9 : null;
        const closeVsMa20 = ma20 ? close - ma20 : null;

        // Volume means
        const volMean5 = n >= 5 ? prevVolumes.slice(-5).reduce((a, b) => a + b, 0) / 5 : null;
        const volMean20 = n >= 20 ? prevVolumes.slice(-20).reduce((a, b) => a + b, 0) / 20 : null;

        // Rolling high/low 20
        const rh20 = n >= 20 ? Math.max(...prevHighs.slice(-20)) : null;
        const rl20 = n >= 20 ? Math.min(...prevLows.slice(-20)) : null;
        const rollingHigh20Dist = rh20 !== null ? close - rh20 : null;
        const rollingLow20Dist = rl20 !== null ? close - rl20 : null;

        features.push({
          base_symbol: baseSymbol,
          timeframe,
          source_type: "time",
          source_table: "continuous_market_candles",
          source_row_id: c.id,
          ts_reference: c.ts_open,
          feature_set_version: "cont_v1",
          ret_1: ret1 !== null ? Number(ret1.toFixed(8)) : null,
          ret_3: ret3 !== null ? Number(ret3.toFixed(8)) : null,
          ret_5: ret5 !== null ? Number(ret5.toFixed(8)) : null,
          ret_10: ret10 !== null ? Number(ret10.toFixed(8)) : null,
          range_points: rangePoints,
          body_points: bodyPoints,
          upper_wick: upperWick,
          lower_wick: lowerWick,
          close_vs_prev_close: diff,
          close_vs_ma_9: closeVsMa9 !== null ? Number(closeVsMa9.toFixed(2)) : null,
          close_vs_ma_20: closeVsMa20 !== null ? Number(closeVsMa20.toFixed(2)) : null,
          vol_mean_5: volMean5 !== null ? Number(volMean5.toFixed(2)) : null,
          vol_mean_20: volMean20 !== null ? Number(volMean20.toFixed(2)) : null,
          rolling_high_20_dist: rollingHigh20Dist !== null ? Number(rollingHigh20Dist.toFixed(2)) : null,
          rolling_low_20_dist: rollingLow20Dist !== null ? Number(rollingLow20Dist.toFixed(2)) : null,
          up_seq_count: upSeq,
          down_seq_count: downSeq,
        });
      }

      if (features.length > 0) {
        for (let i = 0; i < features.length; i += 500) {
          const batch = features.slice(i, i + 500);
          const { error: insErr } = await supabase.from("continuous_feature_vectors").insert(batch);
          if (insErr) throw new Error(`Insert: ${insErr.message}`);
        }
        totalInserted += features.length;
      }

      offset += candles.length;
      pagesProcessed++;
      if (candles.length < PAGE) hasMore = false;
    }

    return new Response(JSON.stringify({
      success: true,
      features_inserted: totalInserted,
      has_more: hasMore,
      resume: hasMore ? {
        start_offset: offset,
        delete_first: false,
        prev_closes: prevCloses,
        prev_volumes: prevVolumes,
        prev_highs: prevHighs,
        prev_lows: prevLows,
        prev_dir: prevDir,
        up_seq: upSeq,
        down_seq: downSeq,
      } : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[rebuild-continuous-features] Error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
