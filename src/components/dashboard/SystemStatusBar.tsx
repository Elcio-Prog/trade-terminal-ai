import { useBridgeAgent } from "@/hooks/useMarketData";
import { Activity, Wifi, WifiOff, Clock, Server } from "lucide-react";

export function SystemStatusBar() {
  const { agent, status } = useBridgeAgent(8_000);

  const statusConfig = {
    online: { label: "Online", color: "bg-bull", textColor: "text-bull", pulse: true },
    delayed: { label: "Atrasado", color: "bg-warning", textColor: "text-warning", pulse: true },
    offline: { label: "Offline", color: "bg-bear", textColor: "text-bear", pulse: false },
  };

  const cfg = statusConfig[status];

  const formatTime = (ts: string | null | undefined) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const timeSince = (ts: string | null | undefined) => {
    if (!ts) return "—";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    return `${Math.floor(diff / 3600)}h atrás`;
  };

  return (
    <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: System Name */}
      <div className="flex items-center gap-3">
        <Activity className="h-4 w-4 text-primary" />
        <span className="font-mono text-sm font-bold tracking-wider text-foreground">
          TRADER AI
        </span>
        <span className="text-xs text-muted-foreground">|</span>
        <span className="font-mono text-xs text-muted-foreground">WIN</span>
      </div>

      {/* Center: Agent Info */}
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Agent:</span>
          <span className="font-mono text-foreground">{agent?.agent_name ?? "—"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Heartbeat:</span>
          <span className="font-mono text-foreground">
            {formatTime(agent?.last_heartbeat_at)}
          </span>
          <span className="text-muted-foreground">
            ({timeSince(agent?.last_heartbeat_at)})
          </span>
        </div>

        {agent?.app_version && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">v{agent.app_version}</span>
          </div>
        )}
      </div>

      {/* Right: Status Badge */}
      <div className="flex items-center gap-2">
        {status === "online" ? (
          <Wifi className={`h-3.5 w-3.5 ${cfg.textColor}`} />
        ) : (
          <WifiOff className={`h-3.5 w-3.5 ${cfg.textColor}`} />
        )}
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`} />
          <span className={`font-mono text-xs font-semibold uppercase tracking-wider ${cfg.textColor}`}>
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}
