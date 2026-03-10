import { useState, useMemo } from "react";
import { useContinuousCandles } from "@/hooks/useMarketData";
import { CandlestickChart } from "@/components/trading/CandlestickChart";
import type { CandleData, Timeframe } from "@/types/trading";
import { BarChart3, RefreshCw, Loader2 } from "lucide-react";

const TIMEFRAMES: Timeframe[] = ["M1", "M5", "M15", "M30", "H1"];
const LIMITS = [100, 300, 500];

export function CandleChartPanel() {
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [limit, setLimit] = useState(300);

  const { candles, loading, lastUpdate } = useContinuousCandles("WIN", timeframe, limit, 5_000);

  const chartData: CandleData[] = useMemo(
    () =>
      candles.map((c) => ({
        time: Math.floor(new Date(c.ts_open).getTime() / 1000),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: c.volume ? Number(c.volume) : undefined,
      })),
    [candles]
  );

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border bg-card flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm font-bold text-foreground">WIN</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="font-mono text-xs text-primary font-semibold">{timeframe}</span>
          {lastCandle && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="font-mono text-xs text-muted-foreground">
                {new Date(lastCandle.ts_close).toLocaleTimeString("pt-BR")}
              </span>
            </>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-2">
          {/* Limit selector */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-sm p-0.5">
            {LIMITS.map((l) => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                className={`px-2 py-1 text-xs font-mono rounded-sm transition-colors ${
                  limit === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-sm p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-xs font-mono rounded-sm transition-colors ${
                  timeframe === tf
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {chartData.length > 0 ? (
          <CandlestickChart data={chartData} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando candles...
              </div>
            ) : (
              "Nenhum dado disponível para WIN / " + timeframe
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 py-1.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
        <span>{candles.length} candles carregados</span>
        {lastUpdate && (
          <span>Último: {new Date(lastUpdate).toLocaleString("pt-BR")}</span>
        )}
      </div>
    </div>
  );
}
