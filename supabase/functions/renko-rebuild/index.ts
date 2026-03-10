import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

interface Candle {
  ts_open: string;
  ts_close: string;
  close: number;
  base_symbol: string;
  source_symbol: string;
}

interface RenkoBrick {
  base_symbol: string;
  source_timeframe: string;
  brick_size: number;
  brick_index: number;
  direction: string;
  ts_open: string;
  ts_close: string;
  open: number;
  high: number;
  low: number;
  close: number;
  source_row_count: number;
  source_open_ts: string;
  source_close_ts: string;
}

/**
 * Close-only Renko builder.
 * For each candle close, compute how many full bricks can be formed
 * in the direction of price movement from the current reference level.
 */
function buildCloseOnlyRenko(candles: Candle[], brickSize: number, baseSymbol: string): RenkoBrick[] {
  if (candles.length === 0) return [];

  const bricks: RenkoBrick[] = [];
  // Start reference at the first candle's close, rounded down to brick boundary
  let refPrice = Math.floor(candles[0].close / brickSize) * brickSize;
  let brickIndex = 0;
  let lastDirection: "UP" | "DOWN" | null = null;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const closePrice = c.close;
    const diff = closePrice - refPrice;
    const absDiff = Math.abs(diff);

    if (absDiff < brickSize) continue;

    const numBricks = Math.floor(absDiff / brickSize);
    const direction = diff > 0 ? "UP" : "DOWN";
    const step = direction === "UP" ? brickSize : -brickSize;

    for (let b = 0; b < numBricks; b++) {
      const brickOpen = refPrice;
      const brickClose = refPrice + step;
      const high = Math.max(brickOpen, brickClose);
      const low = Math.min(brickOpen, brickClose);

      bricks.push({
        base_symbol: baseSymbol,
        source_timeframe: "M1",
        brick_size: brickSize,
        brick_index: brickIndex,
        direction,
        ts_open: c.ts_open,
        ts_close: c.ts_close,
        open: brickOpen,
        high,
        low,
        close: brickClose,
        source_row_count: 1,
        source_open_ts: c.ts_open,
        source_close_ts: c.ts_close,
      });

      refPrice = brickClose;
      brickIndex++;
      lastDirection = direction;
    }
  }

  return bricks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const bridgeSecret = req.headers.get("x-bridge-secret");
    const expectedSecret = Deno.env.get("BRIDGE_SECRET");
    if (expectedSecret && bridgeSecret !== expectedSecret) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const baseSymbol = body.base_symbol || "WIN";
    const timeframe = body.timeframe || "M1";
    const brickSizes: number[] = body.brick_sizes || [25, 50, 100];

    console.log(`[renko-rebuild] Starting rebuild for ${baseSymbol}/${timeframe}, brick sizes: ${brickSizes}`);

    // ── Step 1: Paginate ALL candles ──
    const PAGE_SIZE = 1000;
    let allCandles: Candle[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("continuous_market_candles")
        .select("ts_open, ts_close, close, base_symbol, source_symbol")
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe)
        .order("ts_open", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw new Error(`Fetch candles error: ${error.message}`);
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allCandles = allCandles.concat(data as Candle[]);
        offset += data.length;
        if (data.length < PAGE_SIZE) hasMore = false;
      }
    }

    console.log(`[renko-rebuild] Loaded ${allCandles.length} candles`);

    if (allCandles.length === 0) {
      return new Response(JSON.stringify({ error: "No candles found", base_symbol: baseSymbol, timeframe }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: Delete existing renko data ──
    console.log(`[renko-rebuild] Deleting existing renko data for ${baseSymbol}`);
    for (const bs of brickSizes) {
      const { error: delError } = await supabase
        .from("continuous_market_renko")
        .delete()
        .eq("base_symbol", baseSymbol)
        .eq("source_timeframe", timeframe)
        .eq("brick_size", bs);
      if (delError) console.error(`Delete error for brick_size=${bs}: ${delError.message}`);
    }

    // ── Step 3: Build and insert for each brick size ──
    const results: Record<number, { count: number; min_ts: string; max_ts: string }> = {};

    for (const bs of brickSizes) {
      console.log(`[renko-rebuild] Building bricks for size=${bs}...`);
      const bricks = buildCloseOnlyRenko(allCandles, bs, baseSymbol);
      console.log(`[renko-rebuild] Generated ${bricks.length} bricks for size=${bs}`);

      if (bricks.length === 0) {
        results[bs] = { count: 0, min_ts: "", max_ts: "" };
        continue;
      }

      // Insert in batches of 500
      const BATCH = 500;
      for (let i = 0; i < bricks.length; i += BATCH) {
        const batch = bricks.slice(i, i + BATCH);
        const { error: insError } = await supabase
          .from("continuous_market_renko")
          .insert(batch);
        if (insError) {
          console.error(`Insert error at batch ${i}: ${insError.message}`);
          throw new Error(`Insert error: ${insError.message}`);
        }
      }

      results[bs] = {
        count: bricks.length,
        min_ts: bricks[0].ts_open,
        max_ts: bricks[bricks.length - 1].ts_close,
      };
    }

    console.log(`[renko-rebuild] Complete!`, results);

    return new Response(JSON.stringify({
      success: true,
      candles_loaded: allCandles.length,
      candles_range: {
        first: allCandles[0].ts_open,
        last: allCandles[allCandles.length - 1].ts_close,
      },
      results,
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
