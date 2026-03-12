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
    const sourceTimeframe = body.source_timeframe || "M1";
    const brickSize: number = body.brick_size || 50;
    const startOffset: number = body.start_offset || 0;
    const deleteFirst: boolean = body.delete_first !== false && startOffset === 0;
    // Resume state
    let prevDirs: number[] = body.prev_dirs || [];
    let prevCloses: number[] = body.prev_closes || [];

    console.log(`[renko-features] offset=${startOffset}`);

    if (deleteFirst) {
      await supabase
        .from("continuous_renko_feature_vectors")
        .delete()
        .eq("base_symbol", baseSymbol)
        .eq("source_timeframe", sourceTimeframe)
        .eq("brick_size", brickSize);
    }

    const PAGE = 1000;
    const MAX_PAGES = 30;
    let offset = startOffset;
    let pagesProcessed = 0;
    let totalInserted = 0;
    let hasMore = true;

    while (hasMore && pagesProcessed < MAX_PAGES) {
      const { data: bricks, error } = await supabase
        .from("continuous_market_renko")
        .select("id, brick_index, direction, ts_open, ts_close, open, high, low, close")
        .eq("base_symbol", baseSymbol)
        .eq("source_timeframe", sourceTimeframe)
        .eq("brick_size", brickSize)
        .order("brick_index", { ascending: true })
        .range(offset, offset + PAGE - 1);

      if (error) throw new Error(`Fetch: ${error.message}`);
      if (!bricks || bricks.length === 0) { hasMore = false; break; }

      const features: any[] = [];

      for (const b of bricks) {
        const close = Number(b.close);
        const dirVal = b.direction === "up" ? 1 : -1;

        prevDirs.push(dirVal);
        prevCloses.push(close);
        if (prevDirs.length > 11) prevDirs.shift();
        if (prevCloses.length > 11) prevCloses.shift();

        const n = prevDirs.length;

        // Brick returns
        const brickReturn1 = n >= 2 ? prevCloses[n - 1] - prevCloses[n - 2] : null;
        const brickReturn3 = n >= 4 ? prevCloses[n - 1] - prevCloses[n - 4] : null;
        const brickReturn5 = n >= 6 ? prevCloses[n - 1] - prevCloses[n - 6] : null;

        // Close vs MA
        const ma5 = n >= 5 ? prevCloses.slice(-5).reduce((a, c) => a + c, 0) / 5 : null;
        const ma10 = n >= 10 ? prevCloses.slice(-10).reduce((a, c) => a + c, 0) / 10 : null;
        const closeVsMa5 = ma5 !== null ? close - ma5 : null;
        const closeVsMa10 = ma10 !== null ? close - ma10 : null;

        // Direction counts
        const last5 = prevDirs.slice(-5);
        const last10 = prevDirs.slice(-10);
        const upCount5 = last5.filter(d => d > 0).length;
        const downCount5 = last5.filter(d => d < 0).length;
        const upCount10 = last10.filter(d => d > 0).length;
        const downCount10 = last10.filter(d => d < 0).length;

        // Net moves
        const netMove3 = n >= 3 ? prevDirs.slice(-3).reduce((a, d) => a + d, 0) : null;
        const netMove5 = n >= 5 ? prevDirs.slice(-5).reduce((a, d) => a + d, 0) : null;
        const netMove10 = n >= 10 ? prevDirs.slice(-10).reduce((a, d) => a + d, 0) : null;

        // Same direction sequence
        let sameSeq = 1;
        for (let i = n - 2; i >= 0; i--) {
          if (prevDirs[i] === dirVal) sameSeq++;
          else break;
        }

        // Reversal
        const reversalFlag = n >= 2 ? prevDirs[n - 2] !== dirVal : false;

        features.push({
          base_symbol: baseSymbol,
          source_timeframe: sourceTimeframe,
          brick_size: brickSize,
          brick_index: Number(b.brick_index),
          direction: b.direction,
          dir_value: dirVal,
          source_row_id: b.id,
          ts_reference: b.ts_open,
          feature_set_version: "renko_v1",
          brick_return_1: brickReturn1,
          brick_return_3: brickReturn3,
          brick_return_5: brickReturn5,
          close_vs_ma_5: closeVsMa5 !== null ? Number(closeVsMa5.toFixed(2)) : null,
          close_vs_ma_10: closeVsMa10 !== null ? Number(closeVsMa10.toFixed(2)) : null,
          up_count_5: upCount5,
          down_count_5: downCount5,
          up_count_10: upCount10,
          down_count_10: downCount10,
          net_move_3: netMove3,
          net_move_5: netMove5,
          net_move_10: netMove10,
          same_dir_seq_count: sameSeq,
          reversal_flag: reversalFlag,
        });
      }

      if (features.length > 0) {
        for (let i = 0; i < features.length; i += 500) {
          const batch = features.slice(i, i + 500);
          const { error: insErr } = await supabase.from("continuous_renko_feature_vectors").insert(batch);
          if (insErr) throw new Error(`Insert: ${insErr.message}`);
        }
        totalInserted += features.length;
      }

      offset += bricks.length;
      pagesProcessed++;
      if (bricks.length < PAGE) hasMore = false;
    }

    return new Response(JSON.stringify({
      success: true,
      features_inserted: totalInserted,
      has_more: hasMore,
      resume: hasMore ? {
        start_offset: offset,
        delete_first: false,
        prev_dirs: prevDirs,
        prev_closes: prevCloses,
      } : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[rebuild-renko-features] Error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
