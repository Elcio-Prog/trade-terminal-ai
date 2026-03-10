import { useState, useMemo } from "react";
import { useContinuousCandles } from "@/hooks/useMarketData";
import { useCandleAvailability } from "@/hooks/useDataAvailability";
import { CandlestickChart } from "@/components/trading/CandlestickChart";
import { DateNavigator, dateToRange } from "@/components/dashboard/DateNavigator";
import type { CandleData, Timeframe } from "@/types/trading";
import { BarChart3, Loader2, Database, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TIMEFRAMES: Timeframe[] = ["M1", "M5", "M15", "M30", "H1"];
const LIMITS = [100, 300, 500];

export function CandleChartPanel() {
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [limit, setLimit] = useState(300);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sourceSymbol, setSourceSymbol] = useState<string | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);

  const { dateFrom, dateTo } = dateToRange(selectedDate);
  const isLive = selectedDate === null;

  const { availability, sourceSymbols, loading: availLoading } = useCandleAvailability("WIN");

  const { candles, loading, lastUpdate } = useContinuousCandles(
    "WIN", timeframe, limit, isLive ? 5_000 : 0, dateFrom, dateTo, sourceSymbol
  );

  // Get availability info for current selection
  const currentAvail = availability.filter(
    (a) =>
      a.timeframe === timeframe &&
      (sourceSymbol ? a.source_symbol === sourceSymbol : true)
  );

  const chartData: CandleData[] = useMemo(
    () =>
      candles
        .filter((c) => {
          const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close);
          if (o === h && h === l && l === cl && c.volume !== null && Number(c.volume) < 500) {
            return false;
          }
          return true;
        })
        .map((c) => ({
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

          {/* Source Symbol Selector */}
          <Popover open={showAvailability} onOpenChange={setShowAvailability}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground hover:text-primary transition-colors">
                {sourceSymbol ?? "WIN (todos)"}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Dados Disponíveis</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione um contrato específico ou veja todos unificados.
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {/* All option */}
                <button
                  onClick={() => { setSourceSymbol(null); setShowAvailability(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors ${
                    sourceSymbol === null
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span className="font-semibold">WIN (todos contratos)</span>
                  <span className="text-muted-foreground">
                    {availability.filter(a => a.timeframe === timeframe).reduce((s, a) => s + a.total, 0)} registros
                  </span>
                </button>

                {/* Individual contracts */}
                {sourceSymbols.map((sym) => {
                  const symAvail = availability.filter(
                    (a) => a.source_symbol === sym && a.timeframe === timeframe
                  );
                  const info = symAvail[0];

                  return (
                    <button
                      key={sym}
                      onClick={() => { setSourceSymbol(sym); setShowAvailability(false); }}
                      className={`w-full px-3 py-2 text-left text-xs font-mono flex flex-col gap-0.5 transition-colors ${
                        sourceSymbol === sym
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{sym}</span>
                        {info ? (
                          <span className="text-muted-foreground">{info.total} regs</span>
                        ) : (
                          <span className="text-muted-foreground/50">sem dados p/ {timeframe}</span>
                        )}
                      </div>
                      {info && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(info.first_date).toLocaleDateString("pt-BR")} → {new Date(info.last_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {availLoading && (
                <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Carregando...
                </div>
              )}
            </PopoverContent>
          </Popover>

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
          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

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

      {/* Data availability bar */}
      {currentAvail.length > 0 && (
        <div className="px-4 py-1 bg-secondary/20 border-b border-border flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>
            Dados: {new Date(Math.min(...currentAvail.map(a => new Date(a.first_date).getTime()))).toLocaleDateString("pt-BR")}
            {" → "}
            {new Date(Math.max(...currentAvail.map(a => new Date(a.last_date).getTime()))).toLocaleDateString("pt-BR")}
          </span>
          <span>•</span>
          <span>{currentAvail.reduce((s, a) => s + a.total, 0)} registros totais</span>
        </div>
      )}

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
              <div className="text-center">
                <p>Nenhum dado disponível para {sourceSymbol ?? "WIN"} / {timeframe}</p>
                {selectedDate && (
                  <p className="text-xs mt-1">
                    Data: {selectedDate.toLocaleDateString("pt-BR")} — tente outra data ou contrato
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
        <span>{candles.length} candles carregados</span>
        {lastUpdate && (
          <span>Último: {new Date(lastUpdate).toLocaleString("pt-BR")}</span>
        )}
      </div>
    </div>
  );
}
