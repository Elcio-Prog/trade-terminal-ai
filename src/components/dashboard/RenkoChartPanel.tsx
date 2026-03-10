import { useState, useMemo, useEffect, useRef } from "react";
import { useContinuousRenko } from "@/hooks/useMarketData";
import { DateNavigator, dateToRange } from "@/components/dashboard/DateNavigator";
import { createChart, CandlestickSeries, type IChartApi, type CandlestickData, type Time } from "lightweight-charts";
import { Blocks, Loader2 } from "lucide-react";

const BRICK_SIZES = [25, 50, 100];
const LIMITS = [100, 300, 500];

export function RenkoChartPanel() {
  const [brickSize, setBrickSize] = useState(50);
  const [limit, setLimit] = useState(300);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { dateFrom, dateTo } = dateToRange(selectedDate);
  const isLive = selectedDate === null;

  const { bricks, loading, lastUpdate } = useContinuousRenko(
    "WIN", "M1", brickSize, limit, isLive ? 5_000 : 0, dateFrom, dateTo
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const chartData: CandlestickData[] = useMemo(
    () =>
      bricks.map((b, i) => ({
        time: (Math.floor(new Date(b.ts_open).getTime() / 1000) + i) as Time,
        open: Number(b.open),
        high: Number(b.high),
        low: Number(b.low),
        close: Number(b.close),
      })),
    [bricks]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "hsl(220, 22%, 5%)" },
        textColor: "hsl(215, 15%, 50%)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "hsl(220, 16%, 12%)" },
        horzLines: { color: "hsl(220, 16%, 12%)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "hsl(199, 89%, 48%)", width: 1, style: 2 },
        horzLine: { color: "hsl(199, 89%, 48%)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "hsl(220, 16%, 16%)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "hsl(220, 16%, 16%)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(142, 71%, 45%)",
      downColor: "hsl(0, 72%, 51%)",
      borderUpColor: "hsl(142, 71%, 45%)",
      borderDownColor: "hsl(0, 72%, 51%)",
      wickUpColor: "hsl(142, 71%, 50%)",
      wickDownColor: "hsl(0, 72%, 56%)",
    });

    if (chartData.length > 0) {
      series.setData(chartData);
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [chartData]);

  const lastBrick = bricks.length > 0 ? bricks[bricks.length - 1] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border bg-card flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Blocks className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm font-bold text-foreground">WIN RENKO</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="font-mono text-xs text-primary font-semibold">{brickSize}pts</span>
          {lastBrick && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="font-mono text-xs text-muted-foreground">
                {new Date(lastBrick.ts_close).toLocaleTimeString("pt-BR")}
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

          {/* Brick size selector */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-sm p-0.5">
            {BRICK_SIZES.map((bs) => (
              <button
                key={bs}
                onClick={() => setBrickSize(bs)}
                className={`px-2 py-1 text-xs font-mono rounded-sm transition-colors ${
                  brickSize === bs
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {bs}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {chartData.length > 0 ? (
          <div ref={containerRef} className="w-full h-full min-h-[200px]" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando bricks...
              </div>
            ) : (
              <div ref={containerRef} className="w-full h-full min-h-[200px]" />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
        <span>{bricks.length} bricks carregados</span>
        {lastUpdate && (
          <span>Último: {new Date(lastUpdate).toLocaleString("pt-BR")}</span>
        )}
      </div>
    </div>
  );
}
