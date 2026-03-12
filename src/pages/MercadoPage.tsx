import { useState, useMemo } from "react";
import { useBridgeAgent, useContinuousCandles, useContractCandles, useContinuousRenko, useInstruments } from "@/hooks/useMarketData";
import { CandlestickChart } from "@/components/trading/CandlestickChart";
import { RenkoChart } from "@/components/dashboard/RenkoChart";
import { DateNavigator, dateToRange } from "@/components/dashboard/DateNavigator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CandleData, Timeframe } from "@/types/trading";
import {
  BarChart3, Blocks, Loader2, ChevronDown, Database,
  TrendingUp, TrendingDown, Minus, Clock, Layers
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DataMode = "continuous" | "contract";
type ChartTab = "candles" | "renko";

const TIMEFRAMES: Timeframe[] = ["M1", "M5", "M15", "M30", "H1"];
const LIMITS = [100, 300, 500];
const BRICK_SIZES = [25, 50, 100];

const MercadoPage = () => {
  const [mode, setMode] = useState<DataMode>("continuous");
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null);
  const [selectedInstrumentSymbol, setSelectedInstrumentSymbol] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [limit, setLimit] = useState(300);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeChart, setActiveChart] = useState<ChartTab>("candles");
  const [brickSize, setBrickSize] = useState(50);
  const [renkoLimit, setRenkoLimit] = useState(300);
  const [contractOpen, setContractOpen] = useState(false);

  const { dateFrom, dateTo } = dateToRange(selectedDate);
  const isLive = selectedDate === null;

  const { status } = useBridgeAgent(8_000);
  const { instruments } = useInstruments("WIN");

  const continuousCandles = useContinuousCandles("WIN", timeframe, limit, mode === "continuous" && isLive ? 5_000 : 0, dateFrom, dateTo);
  const contractCandles = useContractCandles(mode === "contract" ? selectedInstrumentId : null, timeframe, limit, mode === "contract" && isLive ? 5_000 : 0, dateFrom, dateTo);
  const { bricks, loading: renkoLoading, lastUpdate: renkoLastUpdate } = useContinuousRenko("WIN", "M1", brickSize, renkoLimit, isLive ? 5_000 : 0, dateFrom, dateTo);

  const activeCandles = mode === "continuous" ? continuousCandles : contractCandles;
  const rawCandles = mode === "continuous" ? continuousCandles.candles : contractCandles.candles;
  const candlesLoading = activeCandles.loading;
  const candlesLastUpdate = activeCandles.lastUpdate;

  const chartData: CandleData[] = useMemo(() =>
    rawCandles
      .filter((c: any) => {
        const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close);
        if (o === h && h === l && l === cl && c.volume !== null && Number(c.volume) < 500) return false;
        return true;
      })
      .map((c: any) => ({
        time: Math.floor(new Date(c.ts_open).getTime() / 1000),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: c.volume ? Number(c.volume) : undefined,
      })),
    [rawCandles]
  );

  const lastCandle = rawCandles.length > 0 ? rawCandles[rawCandles.length - 1] : null;
  const lastPrice = lastCandle ? Number((lastCandle as any).close) : null;
  const lastOpen = lastCandle ? Number((lastCandle as any).open) : null;
  const lastClose = lastCandle ? Number((lastCandle as any).close) : null;
  const direction = lastCandle
    ? lastClose! > lastOpen! ? "up" : lastClose! < lastOpen! ? "down" : "doji"
    : null;

  const sourceLabel = mode === "continuous" ? "Contínuo" : selectedInstrumentSymbol;

  const formatPrice = (p: number | null) =>
    p ? p.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "—";

  const selectContract = (inst: { id: string; symbol: string }) => {
    setMode("contract");
    setSelectedInstrumentId(inst.id);
    setSelectedInstrumentSymbol(inst.symbol);
    setContractOpen(false);
  };

  const selectContinuous = () => {
    setMode("continuous");
    setSelectedInstrumentId(null);
    setSelectedInstrumentSymbol("");
    setContractOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-terminal-bg">
      {/* ═══ INFO BAR ═══ */}
      <div className="bg-card/60 border-b border-border px-4 py-2 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          {/* Symbol & Price */}
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-foreground">WIN</span>
            <span className="font-mono text-xs text-muted-foreground">{sourceLabel}</span>
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className={`font-mono text-lg font-bold ${direction === "up" ? "text-bull" : direction === "down" ? "text-bear" : "text-foreground"}`}>
              {formatPrice(lastPrice)}
            </span>
            {direction === "up" && <TrendingUp className="h-4 w-4 text-bull" />}
            {direction === "down" && <TrendingDown className="h-4 w-4 text-bear" />}
            {direction === "doji" && <Minus className="h-4 w-4 text-warning" />}
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {candlesLastUpdate ? new Date(candlesLastUpdate).toLocaleTimeString("pt-BR") : "—"}
            </span>
          </div>

          {candlesLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}

          {!isLive && (
            <StatusBadge status="warning" label="Histórico" />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Source */}
          <Popover open={contractOpen} onOpenChange={setContractOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-md bg-secondary/60 text-foreground hover:bg-secondary transition-colors border border-border/50">
                <Database className="h-3 w-3 text-muted-foreground" />
                {mode === "continuous" ? "WIN Contínuo" : selectedInstrumentSymbol}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1" align="end">
              <button
                onClick={selectContinuous}
                className={`w-full px-3 py-2 text-left text-xs font-mono rounded-md flex items-center justify-between transition-colors ${mode === "continuous" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"}`}
              >
                <span className="font-semibold">WIN Contínuo</span>
              </button>
              {instruments.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => selectContract(inst)}
                  className={`w-full px-3 py-2 text-left text-xs font-mono rounded-md flex items-center justify-between transition-colors ${mode === "contract" && selectedInstrumentId === inst.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"}`}
                >
                  <span className="font-semibold">{inst.symbol}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Timeframe */}
          <div className="flex items-center gap-0.5 bg-secondary/40 rounded-md p-0.5 border border-border/30">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-[11px] font-mono font-medium rounded transition-all ${timeframe === tf ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Limit */}
          <div className="flex items-center gap-0.5 bg-secondary/40 rounded-md p-0.5 border border-border/30">
            {LIMITS.map((l) => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-all ${limit === l ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>

          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>

      {/* ═══ CHART TAB BAR ═══ */}
      <div className="flex items-center border-b border-border bg-card/40 shrink-0">
        <button
          onClick={() => setActiveChart("candles")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider transition-all ${activeChart === "candles" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Candles
        </button>
        <button
          onClick={() => setActiveChart("renko")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider transition-all ${activeChart === "renko" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Blocks className="h-3.5 w-3.5" /> Renko
        </button>

        {activeChart === "renko" && (
          <div className="ml-auto flex items-center gap-2 pr-3">
            <span className="text-[10px] text-muted-foreground font-mono">Brick:</span>
            <div className="flex items-center gap-0.5 bg-secondary/40 rounded-md p-0.5 border border-border/30">
              {BRICK_SIZES.map((bs) => (
                <button
                  key={bs}
                  onClick={() => setBrickSize(bs)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${brickSize === bs ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {bs}
                </button>
              ))}
            </div>
            {renkoLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </div>
        )}
      </div>

      {/* ═══ CHART ═══ */}
      <div className="flex-1 min-h-0">
        {activeChart === "candles" ? (
          chartData.length > 0 ? (
            <CandlestickChart data={chartData} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {candlesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-mono text-xs">Carregando candles...</span>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-mono text-xs">Nenhum dado disponível</p>
                  <p className="text-[10px] text-muted-foreground/60">{sourceLabel} • {timeframe}</p>
                </div>
              )}
            </div>
          )
        ) : (
          <RenkoChart bricks={bricks} loading={renkoLoading} />
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="px-4 py-1.5 border-t border-border bg-card/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
        {activeChart === "candles" ? (
          <>
            <span>{rawCandles.length} candles • {sourceLabel} • {timeframe}</span>
            {candlesLastUpdate && <span>Último: {new Date(candlesLastUpdate).toLocaleString("pt-BR")}</span>}
          </>
        ) : (
          <>
            <span>{bricks.length} bricks • {brickSize}pts</span>
            {renkoLastUpdate && <span>Último: {new Date(renkoLastUpdate).toLocaleString("pt-BR")}</span>}
          </>
        )}
      </div>
    </div>
  );
};

export default MercadoPage;
