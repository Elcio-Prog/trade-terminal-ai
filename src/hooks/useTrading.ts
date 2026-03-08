// ============================================================
// HOOKS DE TRADING — Conexão real com a API
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { api, mockData } from "@/services/api";
import type {
  EngineState,
  BackendConfig,
  CandleData,
  Timeframe,
} from "@/types/trading";

// ============================================================
// Health check — verifica conexão com backend
// ============================================================
export function useHealthCheck(intervalMs = 10_000) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        await api.health();
        if (active) setConnected(true);
      } catch {
        if (active) setConnected(false);
      }
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);

  return connected;
}

// ============================================================
// Config — carrega uma vez ao montar
// ============================================================
export function useConfig() {
  const [config, setConfig] = useState<BackendConfig | null>(null);

  useEffect(() => {
    api.config().then(setConfig).catch(() => setConfig(null));
  }, []);

  return config;
}

// ============================================================
// State polling — lê /state a cada N ms
// ============================================================
export function useEngineState(intervalMs = 3_000) {
  const [state, setState] = useState<EngineState>(mockData.engineState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const s = await api.state();
        if (active) { setState(s); setLoading(false); }
      } catch {
        if (active) setLoading(false);
      }
    };
    poll();
    const id = setInterval(poll, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);

  return { state, loading };
}

// ============================================================
// Chart data — busca candles quando symbol/tf mudam
// ============================================================
export function useChartData(symbol: string, timeframe: Timeframe) {
  const [candles, setCandles] = useState<CandleData[]>(mockData.candles);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.chart(symbol, timeframe, 300)
      .then((data) => { if (active) setCandles(data); })
      .catch(() => { /* keep last data or mock */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [symbol, timeframe]);

  return { candles, loading };
}

// ============================================================
// Run Once — dispara /engine/run-once
// ============================================================
export function useRunOnce() {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<EngineState | null>(null);

  const execute = useCallback(async () => {
    setRunning(true);
    try {
      const result = await api.runOnce();
      setLastResult(result);
      return result;
    } catch (err) {
      console.error("[RunOnce] falha:", err);
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  return { execute, running, lastResult };
}
