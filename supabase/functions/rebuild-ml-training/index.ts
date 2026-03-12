import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

function ema(prev: number | null, value: number, period: number): number {
  const k = 2 / (period + 1);
  return prev === null ? value : value * k + prev * (1 - k);
}

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

    // Resume state for EMAs and indicators
    let state = body.state || {
      ema9: null, ema21: null, ema200: null,
      rsi_avg_gain: null, rsi_avg_loss: null,
      ema12: null, ema26: null, macd_signal: null,
      atr_prev: null,
      prev_close: null, prev_high: null, prev_low: null,
      prev_closes: [] as number[],  // last 14 for ADX
      prev_highs: [] as number[],
      prev_lows: [] as number[],
      prev_tr: [] as number[],
      prev_plus_dm: [] as number[],
      prev_minus_dm: [] as number[],
      smoothed_plus_dm: null,
      smoothed_minus_dm: null,
      smoothed_tr: null,
      adx_prev: null,
      prev_dx: [] as number[],
      vwap_cum_pv: 0, vwap_cum_vol: 0, vwap_session_date: "",
      candle_count: 0,
    };

    console.log(`[ml-training] offset=${startOffset} candle_count=${state.candle_count}`);

    if (deleteFirst) {
      await supabase
        .from("ml_training_data")
        .delete()
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe);
    }

    const PAGE = 990;
    const MAX_PAGES = 40;
    let offset = startOffset;
    let pagesProcessed = 0;
    let totalInserted = 0;
    let hasMore = true;

    // We also need future candles for target computation, so we'll buffer
    const LOOKAHEAD = 10;

    while (hasMore && pagesProcessed < MAX_PAGES) {
      // Fetch extra candles for future returns
      const { data: candles, error } = await supabase
        .from("continuous_market_candles")
        .select("id, ts_open, ts_close, open, high, low, close, volume")
        .eq("base_symbol", baseSymbol)
        .eq("timeframe", timeframe)
        .order("ts_open", { ascending: true })
        .range(offset, offset + PAGE + LOOKAHEAD - 1);

      if (error) throw new Error(`Fetch: ${error.message}`);
      if (!candles || candles.length === 0) { hasMore = false; break; }

      const mainCount = Math.min(candles.length, PAGE);
      const rows: any[] = [];

      for (let idx = 0; idx < mainCount; idx++) {
        const c = candles[idx];
        const close = Number(c.close);
        const open = Number(c.open);
        const high = Number(c.high);
        const low = Number(c.low);
        const vol = Number(c.volume || 0);
        const price = close;

        state.candle_count++;

        // Session date for VWAP reset
        const sessionDate = c.ts_open.substring(0, 10);
        if (sessionDate !== state.vwap_session_date) {
          state.vwap_cum_pv = 0;
          state.vwap_cum_vol = 0;
          state.vwap_session_date = sessionDate;
        }

        // VWAP
        const typical = (high + low + close) / 3;
        state.vwap_cum_pv += typical * vol;
        state.vwap_cum_vol += vol;
        const vwap = state.vwap_cum_vol > 0 ? state.vwap_cum_pv / state.vwap_cum_vol : close;

        // EMAs
        state.ema9 = ema(state.ema9, close, 9);
        state.ema21 = ema(state.ema21, close, 21);
        state.ema200 = ema(state.ema200, close, 200);
        state.ema12 = ema(state.ema12, close, 12);
        state.ema26 = ema(state.ema26, close, 26);

        // MACD
        const macdLine = state.ema12 - state.ema26;
        state.macd_signal = ema(state.macd_signal, macdLine, 9);
        const macdHist = macdLine - state.macd_signal;

        // RSI
        let rsi: number | null = null;
        if (state.prev_close !== null) {
          const change = close - state.prev_close;
          const gain = change > 0 ? change : 0;
          const loss = change < 0 ? -change : 0;

          if (state.rsi_avg_gain === null) {
            // Initialize after 14 periods
            state.prev_closes.push(close);
            if (state.prev_closes.length >= 15) {
              let totalGain = 0, totalLoss = 0;
              for (let i = 1; i < 15; i++) {
                const d = state.prev_closes[i] - state.prev_closes[i - 1];
                if (d > 0) totalGain += d; else totalLoss += -d;
              }
              state.rsi_avg_gain = totalGain / 14;
              state.rsi_avg_loss = totalLoss / 14;
              const rs = state.rsi_avg_loss === 0 ? 100 : state.rsi_avg_gain / state.rsi_avg_loss;
              rsi = 100 - 100 / (1 + rs);
            }
          } else {
            state.rsi_avg_gain = (state.rsi_avg_gain * 13 + gain) / 14;
            state.rsi_avg_loss = (state.rsi_avg_loss * 13 + loss) / 14;
            const rs = state.rsi_avg_loss === 0 ? 100 : state.rsi_avg_gain / state.rsi_avg_loss;
            rsi = 100 - 100 / (1 + rs);
          }
        } else {
          state.prev_closes.push(close);
        }

        // ATR
        let atr: number | null = null;
        if (state.prev_close !== null) {
          const tr = Math.max(high - low, Math.abs(high - state.prev_close), Math.abs(low - state.prev_close));
          state.prev_tr.push(tr);
          if (state.prev_tr.length > 14) state.prev_tr.shift();

          if (state.atr_prev === null && state.prev_tr.length >= 14) {
            state.atr_prev = state.prev_tr.reduce((a: number, b: number) => a + b, 0) / 14;
            atr = state.atr_prev;
          } else if (state.atr_prev !== null) {
            state.atr_prev = (state.atr_prev * 13 + tr) / 14;
            atr = state.atr_prev;
          }

          // ADX components
          const plusDM = (high - (state.prev_high || high)) > ((state.prev_low || low) - low)
            ? Math.max(high - (state.prev_high || high), 0) : 0;
          const minusDM = ((state.prev_low || low) - low) > (high - (state.prev_high || high))
            ? Math.max((state.prev_low || low) - low, 0) : 0;
          state.prev_plus_dm.push(plusDM);
          state.prev_minus_dm.push(minusDM);
          if (state.prev_plus_dm.length > 14) state.prev_plus_dm.shift();
          if (state.prev_minus_dm.length > 14) state.prev_minus_dm.shift();

          if (state.smoothed_tr === null && state.prev_tr.length >= 14) {
            state.smoothed_tr = state.prev_tr.reduce((a: number, b: number) => a + b, 0);
            state.smoothed_plus_dm = state.prev_plus_dm.reduce((a: number, b: number) => a + b, 0);
            state.smoothed_minus_dm = state.prev_minus_dm.reduce((a: number, b: number) => a + b, 0);
          } else if (state.smoothed_tr !== null) {
            state.smoothed_tr = state.smoothed_tr - state.smoothed_tr / 14 + tr;
            state.smoothed_plus_dm = state.smoothed_plus_dm - state.smoothed_plus_dm / 14 + plusDM;
            state.smoothed_minus_dm = state.smoothed_minus_dm - state.smoothed_minus_dm / 14 + minusDM;
          }
        }

        let adx: number | null = null;
        if (state.smoothed_tr !== null && state.smoothed_tr > 0) {
          const plusDI = (state.smoothed_plus_dm / state.smoothed_tr) * 100;
          const minusDI = (state.smoothed_minus_dm / state.smoothed_tr) * 100;
          const diSum = plusDI + minusDI;
          const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
          state.prev_dx.push(dx);
          if (state.prev_dx.length > 14) state.prev_dx.shift();

          if (state.adx_prev === null && state.prev_dx.length >= 14) {
            state.adx_prev = state.prev_dx.reduce((a: number, b: number) => a + b, 0) / 14;
            adx = state.adx_prev;
          } else if (state.adx_prev !== null) {
            state.adx_prev = (state.adx_prev * 13 + dx) / 14;
            adx = state.adx_prev;
          }
        }

        // Candle features
        const bodyVal = close - open;
        const rangeVal = high - low;
        const upperWick = high - Math.max(open, close);
        const lowerWick = Math.min(open, close) - low;

        // Returns
        const ret1 = state.prev_close !== null ? close - state.prev_close : null;
        // We need prev_closes for ret3/ret5 but we repurposed it for RSI init
        // Use a simpler approach with stored values
        const prevClosesArr = state.prev_closes;
        const pcn = prevClosesArr.length;
        const ret3 = pcn >= 3 ? close - prevClosesArr[pcn - 3] : null;
        const ret5 = pcn >= 5 ? close - prevClosesArr[pcn - 5] : null;

        // Volume features
        state.prev_highs.push(high);
        state.prev_lows.push(low);
        if (state.prev_highs.length > 21) state.prev_highs.shift();
        if (state.prev_lows.length > 21) state.prev_lows.shift();

        // VWAP distance
        const distVwapPts = close - vwap;
        const distVwapPct = vwap !== 0 ? (distVwapPts / vwap) * 100 : 0;

        // Future returns (lookahead)
        let futRet3: number | null = null;
        let futRet5: number | null = null;
        let futRet10: number | null = null;
        if (idx + 3 < candles.length) futRet3 = Number(candles[idx + 3].close) - close;
        if (idx + 5 < candles.length) futRet5 = Number(candles[idx + 5].close) - close;
        if (idx + 10 < candles.length) futRet10 = Number(candles[idx + 10].close) - close;

        // Targets
        let targetBinary: number | null = null;
        let targetClass: number | null = null;
        if (futRet5 !== null) {
          targetBinary = futRet5 > 0 ? 1 : 0;
          if (futRet5 > 50) targetClass = 2;       // strong up
          else if (futRet5 > 0) targetClass = 1;    // mild up
          else if (futRet5 > -50) targetClass = -1;  // mild down
          else targetClass = -2;                      // strong down
        }

        // Only insert if we have enough warmup (200 candles for EMA200)
        if (state.candle_count >= 200) {
          rows.push({
            base_symbol: baseSymbol,
            timeframe,
            source_type: "continuous_market_candles",
            source_id: c.id,
            ts_ref: c.ts_open,
            price,
            open, high, low, close,
            volume: vol,
            ema9: Number(state.ema9.toFixed(2)),
            ema21: Number(state.ema21.toFixed(2)),
            ema200: Number(state.ema200.toFixed(2)),
            vwap: Number(vwap.toFixed(2)),
            vwap_std: null,
            vwap_upper_1: null, vwap_lower_1: null,
            vwap_upper_2: null, vwap_lower_2: null,
            distance_vwap_points: Number(distVwapPts.toFixed(2)),
            distance_vwap_pct: Number(distVwapPct.toFixed(4)),
            rsi: rsi !== null ? Number(rsi.toFixed(2)) : null,
            macd: Number(macdLine.toFixed(4)),
            macd_signal: Number(state.macd_signal.toFixed(4)),
            macd_hist: Number(macdHist.toFixed(4)),
            atr: atr !== null ? Number(atr.toFixed(2)) : null,
            adx: adx !== null ? Number(adx.toFixed(2)) : null,
            body: bodyVal,
            range: rangeVal,
            upper_wick: upperWick,
            lower_wick: lowerWick,
            return_1: ret1,
            return_3: ret3,
            return_5: ret5,
            future_return_3: futRet3,
            future_return_5: futRet5,
            future_return_10: futRet10,
            target_binary: targetBinary,
            target_class: targetClass,
            volume_mean: null,
            relative_volume: null,
            volume_delta: null,
            order_flow_imbalance: null,
            renko_dir: null,
            renko_streak: null,
            renko_brick_size: null,
            regime_label: null,
            liquidity_zone_id: null,
            liquidity_zone_center: null,
            liquidity_zone_distance: null,
            liquidity_zone_strength: null,
          });
        }

        state.prev_close = close;
        state.prev_high = high;
        state.prev_low = low;
        if (state.prev_closes.length > 20) {
          // Keep limited for memory, RSI already initialized
          state.prev_closes = state.prev_closes.slice(-15);
        }
        if (state.rsi_avg_gain !== null) {
          // After RSI init, keep only recent closes for ret calculations
          state.prev_closes.push(close);
          if (state.prev_closes.length > 15) state.prev_closes = state.prev_closes.slice(-15);
        }
      }

      if (rows.length > 0) {
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error: insErr } = await supabase.from("ml_training_data").insert(batch);
          if (insErr) throw new Error(`Insert: ${insErr.message}`);
        }
        totalInserted += rows.length;
      }

      offset += mainCount;
      pagesProcessed++;
      if (candles.length < PAGE + LOOKAHEAD) hasMore = false;
    }

    return new Response(JSON.stringify({
      success: true,
      rows_inserted: totalInserted,
      has_more: hasMore,
      resume: hasMore ? {
        start_offset: offset,
        delete_first: false,
        state,
      } : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[rebuild-ml-training] Error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
