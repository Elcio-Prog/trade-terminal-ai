import type { Position } from "@/types/trading";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PositionPanelProps {
  position: Position | null;
  sessionPnl: number;
  tradesCount: number;
}

export function PositionPanel({ position, sessionPnl, tradesCount }: PositionPanelProps) {
  const pnlPositive = sessionPnl >= 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Posição & PnL</span>
        <span className={`font-mono text-sm font-bold ${pnlPositive ? "text-bull" : "text-bear"}`}>
          {pnlPositive ? "+" : ""}R${sessionPnl.toFixed(2)}
        </span>
      </div>
      <div className="panel-body">
        {position ? (
          <div className="space-y-0">
            <div className="data-row">
              <span className="data-label">Ativo</span>
              <span className="data-value">{position.symbol}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Direção</span>
              <span className={`data-value flex items-center gap-1 ${position.direction === "LONG" ? "text-bull" : "text-bear"}`}>
                {position.direction === "LONG" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {position.direction}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Entrada</span>
              <span className="data-value">{position.entry_price.toLocaleString("pt-BR")}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Atual</span>
              <span className="data-value">{position.current_price.toLocaleString("pt-BR")}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Contratos</span>
              <span className="data-value">{position.contracts}</span>
            </div>
            <div className="data-row">
              <span className="data-label">PnL</span>
              <span className={`data-value font-bold ${position.pnl >= 0 ? "text-bull" : "text-bear"}`}>
                {position.pnl >= 0 ? "+" : ""}R${position.pnl.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-xs">
            Sem posição aberta
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
          <span className="text-muted-foreground">Trades na sessão</span>
          <span className="font-mono text-foreground">{tradesCount}</span>
        </div>
      </div>
    </div>
  );
}
