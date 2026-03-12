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
    // Auth handled by Supabase gateway

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const baseSymbol = body.base_symbol || "WIN";
    const timeframe = body.timeframe || "M1";
    const brickSize: number = body.brick_size || 50;
    // Resume support: pass ref_price & brick_index & start_offset to continue
    const startOffset: number = body.start_offset || 0;
    let refPrice: number | null = body.ref_price ?? null;
    let brickIndex: number = body.brick_index ?? 0;
    const deleteFirst: boolean = body.delete_first !== false && startOffset === 0;

    console.log(`[renko] bs=${brickSize} offset=${startOffset} refPrice=${refPrice} brickIdx=${brickIndex}`);

    // Delete existing only on first run
    if (deleteFirst) {
      await supabase
        .from("continuous_market_renko")
        .delete()
        .eq("base_symbol", baseSymbol)
        .eq("source_timeframe", timeframe)
        .eq("brick_size", brickSize);
    }

    const PAGE = 1000;
    const MAX_PAGES = 50; // Process max 50000 candles per call
    let offset = startOffset;
    let pagesProcessed = 0;
    let totalBricks = 0;
    let totalCandles = 0;
    let hasMore = true;
    let lastTs = "";

    while (hasMore && pagesProcessed < MAX_PAGES) {
      const { data: candles, error } = await supabase
        .from("continuous_market_candles")
        .select("ts_open, ts_close, close")
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe)
        .order("ts_open", { ascending: true })
        .range(offset, offset + PAGE - 1);

      if (error) throw new Error(`Fetch error: ${error.message}`);
      if (!candles || candles.length === 0) { hasMore = false; break; }

      totalCandles += candles.length;

      if (refPrice === null) {
        refPrice = Math.floor(Number(candles[0].close) / brickSize) * brickSize;
      }

      const bricks: any[] = [];
      for (const c of candles) {
        const closePrice = Number(c.close);
        const diff = closePrice - refPrice!;
        const absDiff = Math.abs(diff);
        if (absDiff < brickSize) continue;

        const numBricks = Math.floor(absDiff / brickSize);
        const direction = diff > 0 ? "up" : "down";
        const step = direction === "up" ? brickSize : -brickSize;

        for (let b = 0; b < numBricks; b++) {
          const brickOpen = refPrice!;
          const brickClose = refPrice! + step;
          bricks.push({
            base_symbol: baseSymbol,
            source_timeframe: timeframe,
            brick_size: brickSize,
            brick_index: brickIndex,
            direction,
            ts_open: c.ts_open,
            ts_close: c.ts_close,
            open: brickOpen,
            high: Math.max(brickOpen, brickClose),
            low: Math.min(brickOpen, brickClose),
            close: brickClose,
            source_row_count: 1,
            source_open_ts: c.ts_open,
            source_close_ts: c.ts_close,
          });
          refPrice = brickClose;
          brickIndex++;
        }
      }

      // Insert
      if (bricks.length > 0) {
        for (let i = 0; i < bricks.length; i += 1000) {
          const batch = bricks.slice(i, i + 1000);
          const { error: insErr } = await supabase.from("continuous_market_renko").insert(batch);
          if (insErr) throw new Error(`Insert error: ${insErr.message}`);
        }
        totalBricks += bricks.length;
      }

      lastTs = candles[candles.length - 1].ts_close;
      offset += candles.length;
      pagesProcessed++;
      if (candles.length < PAGE) hasMore = false;
    }

    return new Response(JSON.stringify({
      success: true,
      brick_size: brickSize,
      candles_processed: totalCandles,
      bricks_generated: totalBricks,
      last_ts: lastTs,
      has_more: hasMore,
      // Resume params for next call
      resume: hasMore ? {
        start_offset: offset,
        ref_price: refPrice,
        brick_index: brickIndex,
        delete_first: false,
      } : null,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[renko-rebuild] Error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
