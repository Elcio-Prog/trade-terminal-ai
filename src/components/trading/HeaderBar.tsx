import type { Timeframe, TradingMode } from "@/types/trading";
import { Activity, Wifi, WifiOff } from "lucide-react";

interface HeaderBarProps {
  symbol: string;
  timeframe: Timeframe;
  mode: TradingMode;
  connected: boolean;
  onTimeframeChange: (tf: Timeframe) => void;
}

const timeframes: Timeframe[] = ["M1", "M5", "M15", "H1"];

export function HeaderBar({ symbol, timeframe, mode, connected, onTimeframeChange }: HeaderBarProps) {
  return (
    <header className="h-11 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-mono font-bold text-sm text-foreground tracking-wide">TRADING TERMINAL</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="font-mono text-sm text-primary font-semibold">{symbol}</span>
        <div className="h-4 w-px bg-border" />
        <div className="flex gap-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-sm transition-colors ${
                tf === timeframe
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
          mode === "PAPER"
            ? "bg-warning/20 text-warning"
            : "bg-bull/20 text-bull"
        }`}>
          {mode}
        </span>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-bull" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-bear" />
          )}
          <span className={`text-xs font-mono ${connected ? "text-bull" : "text-bear"}`}>
            {connected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>
    </header>
  );
}
