import type { AISignal } from "@/types/trading";
import { TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";

interface AISignalPanelProps {
  signal: AISignal;
}

export function AISignalPanel({ signal }: AISignalPanelProps) {
  const isLong = signal.direction === "LONG";
  const isShort = signal.direction === "SHORT";
  const directionColor = isLong ? "text-bull" : isShort ? "text-bear" : "text-muted-foreground";
  const glowClass = isLong ? "glow-bull" : isShort ? "glow-bear" : "";
  const DirectionIcon = isLong ? TrendingUp : isShort ? TrendingDown : Minus;

  return (
    <div className={`panel ${glowClass}`}>
      <div className="panel-header">
        <span className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-primary" />
          Sinal da IA
        </span>
        <span className={`animate-pulse-glow ${directionColor} font-mono font-bold text-sm`}>
          {signal.direction}
        </span>
      </div>
      <div className="panel-body space-y-0">
        <div className="data-row">
          <span className="data-label">Direção</span>
          <span className={`data-value flex items-center gap-1 ${directionColor}`}>
            <DirectionIcon className="h-3.5 w-3.5" />
            {signal.direction}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">Probabilidade</span>
          <span className="data-value text-primary">{(signal.probability * 100).toFixed(1)}%</span>
        </div>
        <div className="data-row">
          <span className="data-label">Contratos</span>
          <span className="data-value">{signal.contracts}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Regime</span>
          <span className="data-value">{signal.regime}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Vol Regime</span>
          <span className={`data-value ${signal.vol_regime === "HIGH" || signal.vol_regime === "EXTREME" ? "text-warning" : ""}`}>
            {signal.vol_regime}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">Meta State</span>
          <span className={`data-value ${signal.meta_state === "DEFENSIVE" ? "text-warning" : signal.meta_state === "OFF" ? "text-bear" : ""}`}>
            {signal.meta_state}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">Modelo</span>
          <span className="data-value uppercase">{signal.model_used}</span>
        </div>
        <div className="pt-2 mt-1 border-t border-border">
          <span className="data-label block mb-1">Motivo</span>
          <p className="text-xs text-secondary-foreground leading-relaxed">{signal.reason}</p>
        </div>
      </div>
    </div>
  );
}
