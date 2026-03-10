import { useMemo, useEffect, useRef } from "react";
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from "lightweight-charts";
import type { DBRenko } from "@/types/trading";
import { Loader2 } from "lucide-react";

interface RenkoChartProps {
  bricks: DBRenko[];
  loading: boolean;
}

export function RenkoChart({ bricks, loading }: RenkoChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

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

    chartRef.current = chart;
    seriesRef.current = series;

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
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(chartData);
    if (chartData.length > 0) chartRef.current.timeScale().fitContent();
  }, [chartData]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {chartData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-card/80">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">Carregando bricks...</span>
            </div>
          ) : (
            <span className="font-mono text-xs">Nenhum dado Renko disponível</span>
          )}
        </div>
      )}
    </div>
  );
}
