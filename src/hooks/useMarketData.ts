import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBCandle, DBRenko, DBBridgeAgent, Timeframe } from "@/types/trading";

// ============================================================
// Bridge Agent Status
// ============================================================
export function useBridgeAgent(pollMs = 10_000) {
  const [agent, setAgent] = useState<DBBridgeAgent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("bridge_agents")
      .select("*")
      .order("last_heartbeat_at", { ascending: false })
      .limit(1)
      .single();
    if (data) setAgent(data as unknown as DBBridgeAgent);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, pollMs);
    return () => clearInterval(id);
  }, [fetch, pollMs]);

  const agentStatus = useCallback((): "online" | "offline" | "delayed" => {
    if (!agent) return "offline";
    const diff = Date.now() - new Date(agent.last_heartbeat_at).getTime();
    if (diff < 30_000) return "online";
    if (diff < 120_000) return "delayed";
    return "offline";
  }, [agent]);

  return { agent, loading, status: agentStatus() };
}

// ============================================================
// Continuous Market Candles
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
      .eq("base_symbol", baseSymbol)
      .eq("timeframe", timeframe);

    if (dateFrom) query = query.gte("ts_open", dateFrom);
    if (dateTo) query = query.lte("ts_open", dateTo);

    const { data, error } = await query
      .order("ts_open", { ascending: false })
      .limit(limit);

    if (!error && data) {
      const rows = (data as unknown as DBCandle[]).reverse();
      setCandles(rows);
      if (rows.length > 0) {
        setLastUpdate(rows[rows.length - 1].ts_close);
      }
    }
    setLoading(false);
  }, [baseSymbol, timeframe, limit, dateFrom, dateTo]);

  useEffect(() => {
    setLoading(true);
    fetchCandles();
    const id = setInterval(fetchCandles, pollMs);
    return () => clearInterval(id);
  }, [fetchCandles, pollMs]);

  return { candles, loading, lastUpdate };
}

// ============================================================
// Continuous Market Renko
// ============================================================
export function useContinuousRenko(
  baseSymbol: string,
  sourceTimeframe: string = "M1",
  brickSize: number = 50,
  limit: number = 300,
  pollMs: number = 5_000
) {
  const [bricks, setBricks] = useState<DBRenko[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchBricks = useCallback(async () => {
    const { data, error } = await supabase
      .from("continuous_market_renko")
      .select("*")
      .eq("base_symbol", baseSymbol)
      .eq("source_timeframe", sourceTimeframe)
      .eq("brick_size", brickSize)
      .order("brick_index", { ascending: false })
      .limit(limit);

    if (!error && data) {
      const rows = (data as unknown as DBRenko[]).reverse();
      setBricks(rows);
      if (rows.length > 0) {
        setLastUpdate(rows[rows.length - 1].ts_close);
      }
    }
    setLoading(false);
  }, [baseSymbol, sourceTimeframe, brickSize, limit]);

  useEffect(() => {
    setLoading(true);
    fetchBricks();
    const id = setInterval(fetchBricks, pollMs);
    return () => clearInterval(id);
  }, [fetchBricks, pollMs]);

  return { bricks, loading, lastUpdate };
}

// ============================================================
// Market Summary (last price from M1)
// ============================================================
export function useMarketSummary(baseSymbol: string, pollMs = 5_000) {
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [lastDirection, setLastDirection] = useState<"up" | "down" | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    const { data } = await supabase
      .from("continuous_market_candles")
      .select("close, open, ts_close")
      .eq("base_symbol", baseSymbol)
      .eq("timeframe", "M1")
      .order("ts_open", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const row = data as unknown as { close: number; open: number; ts_close: string };
      setLastPrice(row.close);
      setLastDirection(row.close >= row.open ? "up" : "down");
      setLastCandleTime(row.ts_close);
    }
  }, [baseSymbol]);

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, pollMs);
    return () => clearInterval(id);
  }, [fetchSummary, pollMs]);

  return { lastPrice, lastDirection, lastCandleTime };
}

// ============================================================
// Renko Direction Summary
// ============================================================
export function useRenkoSummary(
  baseSymbol: string,
  brickSize: number = 50,
  count: number = 20,
  pollMs: number = 10_000
) {
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);

  const fetchSummary = useCallback(async () => {
    const { data } = await supabase
      .from("continuous_market_renko")
      .select("direction")
      .eq("base_symbol", baseSymbol)
      .eq("brick_size", brickSize)
      .order("brick_index", { ascending: false })
      .limit(count);

    if (data) {
      const rows = data as unknown as { direction: string }[];
      setUpCount(rows.filter((r) => r.direction === "up").length);
      setDownCount(rows.filter((r) => r.direction === "down").length);
    }
  }, [baseSymbol, brickSize, count]);

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, pollMs);
    return () => clearInterval(id);
  }, [fetchSummary, pollMs]);

  return { upCount, downCount, total: upCount + downCount };
}
