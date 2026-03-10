import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBCandle, DBRenko, DBBridgeAgent, Timeframe } from "@/types/trading";

// ============================================================
// Bridge Agent Status (with market hours awareness)
// ============================================================
export function useBridgeAgent(pollMs = 8_000) {
  const [agent, setAgent] = useState<DBBridgeAgent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgent = useCallback(async () => {
    const { data } = await supabase
      .from("bridge_agents")
      .select("*")
      .order("last_heartbeat_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setAgent(data as unknown as DBBridgeAgent);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgent();
    const id = setInterval(fetchAgent, pollMs);
    return () => clearInterval(id);
  }, [fetchAgent, pollMs]);

  const getStatus = useCallback((): "online" | "offline" | "delayed" | "awaiting" => {
    // Check if we're inside market operational window (08:50 - 18:10 BRT, Mon-Fri)
    const now = new Date();
    const brt = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const day = brt.getDay();
    const minutes = brt.getHours() * 60 + brt.getMinutes();
    const marketOpen = 8 * 60 + 50;  // 08:50
    const marketClose = 18 * 60 + 10; // 18:10
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = isWeekday && minutes >= marketOpen && minutes <= marketClose;

    if (!agent) {
      return isMarketHours ? "offline" : "awaiting";
    }

    const diff = Date.now() - new Date(agent.last_heartbeat_at).getTime();

    if (!isMarketHours) {
      // Outside market hours: if heartbeat is recent it's fine, otherwise awaiting
      if (diff < 120_000) return "online";
      return "awaiting";
    }

    // During market hours
    if (diff < 30_000) return "online";
    if (diff < 120_000) return "delayed";
    return "offline";
  }, [agent]);

  return { agent, loading, status: getStatus() };
}

// ============================================================
// Continuous Market Candles (continuous_market_candles)
// ============================================================
export function useContinuousCandles(
  baseSymbol: string,
  timeframe: Timeframe,
  limit: number = 300,
  pollMs: number = 5_000,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  const [candles, setCandles] = useState<DBCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchCandles = useCallback(async () => {
    let query = supabase
      .from("continuous_market_candles")
      .select("*")
      .like("base_symbol", `${baseSymbol}%`)
      .eq("timeframe", timeframe);

    if (dateFrom) query = query.gte("ts_open", dateFrom);
    if (dateTo) query = query.lte("ts_open", dateTo);

    const { data, error } = await query
      .order("ts_open", { ascending: false })
      .limit(limit);

    if (!error && data) {
      const rows = (data as unknown as DBCandle[]).reverse();
      setCandles(rows);
      if (rows.length > 0) setLastUpdate(rows[rows.length - 1].ts_close);
    }
    setLoading(false);
  }, [baseSymbol, timeframe, limit, dateFrom, dateTo]);

  useEffect(() => {
    setLoading(true);
    fetchCandles();
    if (pollMs > 0) {
      const id = setInterval(fetchCandles, pollMs);
      return () => clearInterval(id);
    }
  }, [fetchCandles, pollMs]);

  return { candles, loading, lastUpdate };
}

// ============================================================
// Contract-specific Candles (market_candles via instrument)
// ============================================================
export interface DBMarketCandle {
  id: string;
  instrument_id: string;
  timeframe: string;
  ts_open: string;
  ts_close: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  vwap: number | null;
  trade_count: number | null;
  source: string;
}

export function useContractCandles(
  instrumentId: string | null,
  timeframe: Timeframe,
  limit: number = 300,
  pollMs: number = 5_000,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  const [candles, setCandles] = useState<DBMarketCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchCandles = useCallback(async () => {
    if (!instrumentId) { setLoading(false); return; }

    let query = supabase
      .from("market_candles")
      .select("*")
      .eq("instrument_id", instrumentId)
      .eq("timeframe", timeframe);

    if (dateFrom) query = query.gte("ts_open", dateFrom);
    if (dateTo) query = query.lte("ts_open", dateTo);

    const { data, error } = await query
      .order("ts_open", { ascending: false })
      .limit(limit);

    if (!error && data) {
      const rows = (data as unknown as DBMarketCandle[]).reverse();
      setCandles(rows);
      if (rows.length > 0) setLastUpdate(rows[rows.length - 1].ts_close);
    }
    setLoading(false);
  }, [instrumentId, timeframe, limit, dateFrom, dateTo]);

  useEffect(() => {
    setLoading(true);
    fetchCandles();
    if (pollMs > 0) {
      const id = setInterval(fetchCandles, pollMs);
      return () => clearInterval(id);
    }
  }, [fetchCandles, pollMs]);

  return { candles, loading, lastUpdate };
}

// ============================================================
// Available Instruments (for contract selector)
// ============================================================
export interface DBInstrument {
  id: string;
  symbol: string;
  base_symbol: string;
  is_active: boolean;
}

export function useInstruments(baseSymbol: string) {
  const [instruments, setInstruments] = useState<DBInstrument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instruments")
        .select("id, symbol, base_symbol, is_active")
        .like("base_symbol", `${baseSymbol}%`)
        .order("symbol", { ascending: false });
      if (data) setInstruments(data as unknown as DBInstrument[]);
      setLoading(false);
    })();
  }, [baseSymbol]);

  return { instruments, loading };
}

// ============================================================
// Continuous Market Renko
// ============================================================
export function useContinuousRenko(
  baseSymbol: string,
  sourceTimeframe: string = "M1",
  brickSize: number = 50,
  limit: number = 300,
  pollMs: number = 5_000,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  const [bricks, setBricks] = useState<DBRenko[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchBricks = useCallback(async () => {
    let query = supabase
      .from("continuous_market_renko")
      .select("*")
      .like("base_symbol", `${baseSymbol}%`)
      .eq("source_timeframe", sourceTimeframe)
      .eq("brick_size", brickSize);

    if (dateFrom) query = query.gte("ts_open", dateFrom);
    if (dateTo) query = query.lte("ts_open", dateTo);

    const { data, error } = await query
      .order("brick_index", { ascending: false })
      .limit(limit);

    if (!error && data) {
      const rows = (data as unknown as DBRenko[]).reverse();
      setBricks(rows);
      if (rows.length > 0) setLastUpdate(rows[rows.length - 1].ts_close);
    }
    setLoading(false);
  }, [baseSymbol, sourceTimeframe, brickSize, limit, dateFrom, dateTo]);

  useEffect(() => {
    setLoading(true);
    fetchBricks();
    if (pollMs > 0) {
      const id = setInterval(fetchBricks, pollMs);
      return () => clearInterval(id);
    }
  }, [fetchBricks, pollMs]);

  return { bricks, loading, lastUpdate };
}
