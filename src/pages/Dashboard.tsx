import { useState, useMemo } from "react";
import { useBridgeAgent, useContinuousCandles, useContractCandles, useContinuousRenko, useInstruments } from "@/hooks/useMarketData";
import { CandlestickChart } from "@/components/trading/CandlestickChart";
import { RenkoChart } from "@/components/dashboard/RenkoChart";
import { DateNavigator, dateToRange } from "@/components/dashboard/DateNavigator";
import type { CandleData, Timeframe } from "@/types/trading";
import {
  Activity, Wifi, WifiOff, Clock, Server, TrendingUp, TrendingDown, Minus,
  BarChart3, Blocks, Loader2, ChevronDown, Database
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DataMode = "continuous" | "contract";
type ChartTab = "candles" | "renko";

const TIMEFRAMES: Timeframe[] = ["M1", "M5", "M15", "M30", "H1"];
const LIMITS = [100, 300, 500];
const BRICK_SIZES = [25, 50, 100];

const Dashboard = () => {
  // Data mode & filters
  const [mode, setMode] = useState<DataMode>("continuous");
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null);
  const [selectedInstrumentSymbol, setSelectedInstrumentSymbol] = useState<string>("");
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [limit, setLimit] = useState(300);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeChart, setActiveChart] = useState<ChartTab>("candles");
  const [brickSize, setBrickSize] = useState(50);
  const [renkoLimit, setRenkoLimit] = useState(300);
  const [contractOpen, setContractOpen] = useState(false);

  const { dateFrom, dateTo } = dateToRange(selectedDate);
  const isLive = selectedDate === null;

  // Data hooks
  const { agent, status } = useBridgeAgent(8_000);
  const { instruments } = useInstruments("WIN");

  const continuousCandles = useContinuousCandles(
    "WIN", timeframe, limit,
    mode === "continuous" && isLive ? 5_000 : 0,
    dateFrom, dateTo
  );

  const contractCandles = useContractCandles(
    mode === "contract" ? selectedInstrumentId : null,
    timeframe, limit,
    mode === "contract" && isLive ? 5_000 : 0,
    dateFrom, dateTo
  );

  const { bricks, loading: renkoLoading, lastUpdate: renkoLastUpdate } = useContinuousRenko(
    "WIN", "M1", brickSize, renkoLimit, isLive ? 5_000 : 0, dateFrom, dateTo
  );

  // Derived data
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

  const sourceLabel = mode === "continuous" ? "Série contínua" : `Contrato: ${selectedInstrumentSymbol}`;

  // Agent status config
  const statusConfig = {
    online:   { label: "ONLINE",    color: "bg-bull",    textColor: "text-bull",    pulse: true },
    delayed:  { label: "ATRASADO",  color: "bg-warning", textColor: "text-warning", pulse: true },
    offline:  { label: "OFFLINE",   color: "bg-bear",    textColor: "text-bear",    pulse: false },
    awaiting: { label: "AGUARDANDO",color: "bg-muted-foreground", textColor: "text-muted-foreground", pulse: false },
  };
  const cfg = statusConfig[status];

  const formatTime = (ts: string | null | undefined) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

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
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      {/* ═══ TOP BAR: System + Agent Status ═══ */}
      <div className="bg-card border-b border-border px-3 py-1.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-xs font-bold tracking-wider text-foreground">TRADER AI</span>
          <span className="text-[10px] text-muted-foreground">|</span>
          <span className="font-mono text-[10px] text-muted-foreground">WIN</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="font-mono text-[10px] text-primary">{sourceLabel}</span>
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <Server className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Agent:</span>
            <span className="font-mono text-foreground">{agent?.agent_name ?? "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-foreground">{formatTime(agent?.last_heartbeat_at)}</span>
          </div>
          {agent?.app_version && (
            <span className="text-muted-foreground">v{agent.app_version}</span>
          )}
          <div className="flex items-center gap-1.5">
            {status === "online" ? <Wifi className={`h-3 w-3 ${cfg.textColor}`} /> : <WifiOff className={`h-3 w-3 ${cfg.textColor}`} />}
            <div className={`h-1.5 w-1.5 rounded-full ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`} />
            <span className={`font-mono text-[10px] font-semibold uppercase ${cfg.textColor}`}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* ═══ MINI CARDS + TOOLBAR ═══ */}
      <div className="bg-card/50 border-b border-border px-3 py-1.5 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        {/* Left: Mini info cards */}
        <div className="flex items-center gap-3">
          {/* Price */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase">Preço:</span>
            <span className={`font-mono text-sm font-bold ${direction === "up" ? "text-bull" : direction === "down" ? "text-bear" : "text-foreground"}`}>
              {formatPrice(lastPrice)}
            </span>
          </div>

          <span className="text-border">│</span>

          {/* Direction */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase">Dir:</span>
            {direction === "up" ? (
              <><TrendingUp className="h-3 w-3 text-bull" /><span className="font-mono text-[10px] font-bold text-bull">ALTA</span></>
            ) : direction === "down" ? (
              <><TrendingDown className="h-3 w-3 text-bear" /><span className="font-mono text-[10px] font-bold text-bear">BAIXA</span></>
            ) : direction === "doji" ? (
              <><Minus className="h-3 w-3 text-warning" /><span className="font-mono text-[10px] font-bold text-warning">DOJI</span></>
            ) : <span className="font-mono text-[10px] text-muted-foreground">—</span>}
          </div>

          <span className="text-border">│</span>

          {/* Last update */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase">Atualiz:</span>
            <span className="font-mono text-[10px] text-foreground">
              {candlesLastUpdate ? new Date(candlesLastUpdate).toLocaleTimeString("pt-BR") : "—"}
            </span>
          </div>

          <span className="text-border">│</span>

          {/* Source */}
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[10px] text-primary">{mode === "continuous" ? "contínuo" : "contrato"}</span>
          </div>

          {candlesLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-2">
          {/* Mode + Contract selector */}
          <Popover open={contractOpen} onOpenChange={setContractOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-sm bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                {mode === "continuous" ? "WIN Contínuo" : selectedInstrumentSymbol}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <button
                onClick={selectContinuous}
                className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors ${
                  mode === "continuous" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"
                }`}
              >
                <span className="font-semibold">WIN Contínuo</span>
                <span className="text-[10px] text-muted-foreground">série contínua</span>
              </button>
              <div className="border-t border-border">
                {instruments.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => selectContract(inst)}
                    className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors ${
                      mode === "contract" && selectedInstrumentId === inst.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <span className="font-semibold">{inst.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">contrato</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Timeframe */}
          <div className="flex items-center gap-0.5 bg-secondary/50 rounded-sm p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm transition-colors ${
                  timeframe === tf ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Limit */}
          <div className="flex items-center gap-0.5 bg-secondary/50 rounded-sm p-0.5">
            {LIMITS.map((l) => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm transition-colors ${
                  limit === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Date navigator */}
          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

          {!isLive && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded-sm bg-warning/20 text-warning uppercase">
              Histórico
            </span>
          )}
        </div>
      </div>

      {/* ═══ MAIN CHART AREA ═══ */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chart Tab Bar */}
        <div className="flex items-center border-b border-border bg-card shrink-0">
          <button
            onClick={() => setActiveChart("candles")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-mono font-medium uppercase tracking-wider transition-colors ${
              activeChart === "candles"
                ? "text-primary border-b-2 border-primary bg-secondary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            Candles
          </button>
          <button
            onClick={() => setActiveChart("renko")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-mono font-medium uppercase tracking-wider transition-colors ${
              activeChart === "renko"
                ? "text-primary border-b-2 border-primary bg-secondary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Blocks className="h-3 w-3" />
            Renko
          </button>

          {/* Renko controls (shown when renko tab active) */}
          {activeChart === "renko" && (
            <div className="ml-auto flex items-center gap-2 pr-3">
              <span className="text-[10px] text-muted-foreground font-mono">Brick:</span>
              <div className="flex items-center gap-0.5 bg-secondary/50 rounded-sm p-0.5">
                {BRICK_SIZES.map((bs) => (
                  <button
                    key={bs}
                    onClick={() => setBrickSize(bs)}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm transition-colors ${
                      brickSize === bs ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {bs}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 bg-secondary/50 rounded-sm p-0.5">
                {LIMITS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setRenkoLimit(l)}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm transition-colors ${
                      renkoLimit === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {renkoLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
          )}
        </div>

        {/* Chart content */}
        <div className="flex-1 min-h-0">
          {activeChart === "candles" ? (
            chartData.length > 0 ? (
              <CandlestickChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {candlesLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando candles...
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-mono text-xs">Nenhum dado disponível</p>
                    <p className="text-[10px] mt-1 text-muted-foreground">
                      Fonte: {sourceLabel} • {timeframe}
                    </p>
                  </div>
                )}
              </div>
            )
          ) : (
            <RenkoChart bricks={bricks} loading={renkoLoading} />
          )}
        </div>

        {/* Footer bar */}
        <div className="px-3 py-1 border-t border-border bg-card flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
          {activeChart === "candles" ? (
            <>
              <span>{rawCandles.length} candles • Fonte: {sourceLabel}</span>
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
    </div>
  );
};

export default Dashboard;
