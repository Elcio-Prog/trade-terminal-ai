import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DataAvailability {
  source_symbol: string;
  timeframe: string;
  total: number;
  first_date: string;
  last_date: string;
}

export interface RenkoAvailability {
  source_timeframe: string;
  brick_size: number;
  total: number;
  first_date: string;
  last_date: string;
}

/**
 * Fetches distinct source_symbols available for candles
 */
export function useCandleAvailability(baseSymbol: string) {
  const [data, setData] = useState<DataAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    // We can't do GROUP BY via PostgREST, so fetch distinct source_symbols
    const { data: rows } = await supabase
      .from("continuous_market_candles")
      .select("source_symbol, timeframe, ts_open")
      .like("base_symbol", `${baseSymbol}%`)
      .order("ts_open", { ascending: false });

    if (rows) {
      // Group by source_symbol + timeframe
      const map = new Map<string, { source_symbol: string; timeframe: string; total: number; first_date: string; last_date: string }>();
      for (const r of rows as any[]) {
        const key = `${r.source_symbol}|${r.timeframe}`;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            source_symbol: r.source_symbol,
            timeframe: r.timeframe,
            total: 1,
            first_date: r.ts_open,
            last_date: r.ts_open,
          });
        } else {
          existing.total++;
          if (r.ts_open < existing.first_date) existing.first_date = r.ts_open;
          if (r.ts_open > existing.last_date) existing.last_date = r.ts_open;
        }
      }
      setData(Array.from(map.values()));
    }
    setLoading(false);
  }, [baseSymbol]);

  useEffect(() => { fetch(); }, [fetch]);

  // Extract unique source_symbols
  const sourceSymbols = [...new Set(data.map(d => d.source_symbol))].sort();

  return { availability: data, sourceSymbols, loading };
}

/**
 * Fetches renko data availability
 */
export function useRenkoAvailability(baseSymbol: string) {
  const [data, setData] = useState<RenkoAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: rows } = await supabase
      .from("continuous_market_renko")
      .select("source_timeframe, brick_size, ts_open")
      .like("base_symbol", `${baseSymbol}%`)
      .order("ts_open", { ascending: false })
      .limit(1000);

    if (rows) {
      const map = new Map<string, RenkoAvailability>();
      for (const r of rows as any[]) {
        const key = `${r.source_timeframe}|${r.brick_size}`;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            source_timeframe: r.source_timeframe,
            brick_size: r.brick_size,
            total: 1,
            first_date: r.ts_open,
            last_date: r.ts_open,
          });
        } else {
          existing.total++;
          if (r.ts_open < existing.first_date) existing.first_date = r.ts_open;
          if (r.ts_open > existing.last_date) existing.last_date = r.ts_open;
        }
      }
      setData(Array.from(map.values()));
    }
    setLoading(false);
  }, [baseSymbol]);

  useEffect(() => { fetch(); }, [fetch]);

  return { availability: data, loading };
}
