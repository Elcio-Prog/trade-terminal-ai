import { useState, useMemo } from "react";
import { useContinuousCandles } from "@/hooks/useMarketData";
import { CandlestickChart } from "@/components/trading/CandlestickChart";
import { DateNavigator, dateToRange } from "@/components/dashboard/DateNavigator";
import type { CandleData, Timeframe } from "@/types/trading";
import { BarChart3, Loader2 } from "lucide-react";

const TIMEFRAMES: Timeframe[] = ["M1", "M5", "M15", "M30", "H1"];
const LIMITS = [100, 300, 500];

export function CandleChartPanel() {
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [limit, setLimit] = useState(300);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { dateFrom, dateTo } = dateToRange(selectedDate);
  const isLive = selectedDate === null;

  const { candles, loading, lastUpdate } = useContinuousCandles(
    "WIN", timeframe, limit, isLive ? 5_000 : 0, dateFrom, dateTo
  );

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
          {!isLive && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-sm bg-warning/20 text-warning uppercase">
              Histórico
            </span>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-2">
          {/* Date navigator */}
          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

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
              "Nenhum dado disponível para WIN / " + timeframe + (selectedDate ? ` em ${selectedDate.toLocaleDateString("pt-BR")}` : "")
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
