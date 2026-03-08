import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, type IChartApi, type CandlestickData, type Time } from "lightweight-charts";
import type { CandleData } from "@/types/trading";

interface CandlestickChartProps {
  data: CandleData[];
  className?: string;
}

export function CandlestickChart({ data, className = "" }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

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

    const series = chart.addCandlestickSeries({
      upColor: "hsl(142, 71%, 45%)",
      downColor: "hsl(0, 72%, 51%)",
      borderUpColor: "hsl(142, 71%, 45%)",
      borderDownColor: "hsl(0, 72%, 51%)",
      wickUpColor: "hsl(142, 71%, 50%)",
      wickDownColor: "hsl(0, 72%, 56%)",
    });

    const chartData: CandlestickData[] = data.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data]);

  return <div ref={containerRef} className={`w-full h-full min-h-[300px] ${className}`} />;
}
