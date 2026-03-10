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
    const authHeader = req.headers.get("Authorization");
    const bridgeSecret = req.headers.get("x-bridge-secret");
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
    const baseSymbol = body.base_symbol || "WIN";
    const timeframe = body.timeframe || "M1";
    const brickSize: number = body.brick_size || 50;

    console.log(`[renko-rebuild] ${baseSymbol}/${timeframe} brick_size=${brickSize}`);

    // ── Paginate ALL candle closes ──
    const PAGE = 1000;
    let offset = 0;
    let hasMore = true;

    // Renko state
    let refPrice: number | null = null;
    let brickIndex = 0;
    let totalCandles = 0;
    let firstTs = "";
    let lastTs = "";

    // Delete existing
    const { error: delErr } = await supabase
      .from("continuous_market_renko")
      .delete()
      .eq("base_symbol", baseSymbol)
      .eq("source_timeframe", timeframe)
      .eq("brick_size", brickSize);
    if (delErr) console.error("Delete error:", delErr.message);

    let totalBricks = 0;
    let minBrickTs = "";
    let maxBrickTs = "";

    while (hasMore) {
      const { data: candles, error } = await supabase
        .from("continuous_market_candles")
        .select("ts_open, ts_close, close")
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe)
        .order("ts_open", { ascending: true })
        .range(offset, offset + PAGE - 1);

      if (error) throw new Error(`Fetch error at offset ${offset}: ${error.message}`);
      if (!candles || candles.length === 0) { hasMore = false; break; }

      totalCandles += candles.length;
      if (!firstTs && candles.length > 0) firstTs = candles[0].ts_open;
      lastTs = candles[candles.length - 1].ts_close;

      // Init ref price from first candle
      if (refPrice === null) {
        refPrice = Math.floor(Number(candles[0].close) / brickSize) * brickSize;
      }

      // Build bricks from this page
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

      // Insert bricks from this page in batches
      if (bricks.length > 0) {
        const BATCH = 300;
        for (let i = 0; i < bricks.length; i += BATCH) {
          const batch = bricks.slice(i, i + BATCH);
          const { error: insErr } = await supabase
            .from("continuous_market_renko")
            .insert(batch);
          if (insErr) throw new Error(`Insert error: ${insErr.message}`);
        }
        totalBricks += bricks.length;
        if (!minBrickTs) minBrickTs = bricks[0].ts_open;
        maxBrickTs = bricks[bricks.length - 1].ts_close;
      }

      offset += candles.length;
      if (candles.length < PAGE) hasMore = false;
    }

    const result = {
      success: true,
      base_symbol: baseSymbol,
      brick_size: brickSize,
      candles_loaded: totalCandles,
      candles_range: { first: firstTs, last: lastTs },
      bricks_generated: totalBricks,
      bricks_range: { first: minBrickTs, last: maxBrickTs },
    };

    console.log("[renko-rebuild] Done:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
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
