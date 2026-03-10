import { useMarketSummary, useRenkoSummary, useContinuousCandles } from "@/hooks/useMarketData";
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Database, Clock } from "lucide-react";

export function MarketSummaryPanel() {
  const { lastPrice, lastDirection, lastCandleTime } = useMarketSummary("WIN", 5_000);
  const { upCount, downCount, total } = useRenkoSummary("WIN", 50, 20, 10_000);

  const formatPrice = (p: number | null) => (p ? p.toLocaleString("pt-BR", { minimumFractionDigits: 0 }) : "—");

  const formatTime = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3">
      {/* Last Price */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="data-label">Último Preço</span>
          {lastDirection === "up" ? (
            <TrendingUp className="h-4 w-4 text-bull" />
          ) : lastDirection === "down" ? (
            <TrendingDown className="h-4 w-4 text-bear" />
          ) : null}
        </div>
        <div className={`font-mono text-2xl font-bold ${lastDirection === "up" ? "text-bull" : lastDirection === "down" ? "text-bear" : "text-foreground"}`}>
          {formatPrice(lastPrice)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">WIN • M1</div>
      </div>

      {/* Candle Direction */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="data-label">Último Candle</span>
          {lastDirection === "up" ? (
            <ArrowUpCircle className="h-4 w-4 text-bull" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-bear" />
          )}
        </div>
        <div className={`font-mono text-lg font-bold uppercase ${lastDirection === "up" ? "text-bull" : "text-bear"}`}>
          {lastDirection === "up" ? "Alta" : lastDirection === "down" ? "Baixa" : "—"}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Direção M1</div>
      </div>

      {/* Renko Distribution */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="data-label">Renko (últimos 20)</span>
          <Database className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-bull" />
            <span className="font-mono text-lg font-bold text-bull">{upCount}</span>
          </div>
          <span className="text-muted-foreground">×</span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-bear" />
            <span className="font-mono text-lg font-bold text-bear">{downCount}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">50pts • {total} bricks</div>
      </div>

      {/* Last Update */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="data-label">Última Atualização</span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-mono text-lg font-bold text-foreground">
          {formatTime(lastCandleTime)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {lastCandleTime ? new Date(lastCandleTime).toLocaleDateString("pt-BR") : "—"}
        </div>
      </div>
    </div>
  );
}
