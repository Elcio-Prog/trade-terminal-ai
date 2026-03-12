import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useBridgeAgent } from "@/hooks/useMarketData";
import { Wifi, WifiOff, Clock, AlertTriangle } from "lucide-react";

export function AppLayout() {
  const { agent, status } = useBridgeAgent(8_000);

  const statusConfig = {
    online: { label: "ONLINE", color: "text-bull", dot: "bg-bull", pulse: true },
    delayed: { label: "ATRASADO", color: "text-warning", dot: "bg-warning", pulse: true },
    offline: { label: "OFFLINE", color: "text-bear", dot: "bg-bear", pulse: false },
    awaiting: { label: "AGUARDANDO", color: "text-muted-foreground", dot: "bg-muted-foreground", pulse: false },
  };
  const cfg = statusConfig[status];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-10 bg-card border-b border-border flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border" />
              <span className="font-mono text-[10px] text-muted-foreground">
                {agent?.agent_name ?? "Sem agente"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {agent?.last_heartbeat_at
                    ? new Date(agent.last_heartbeat_at).toLocaleTimeString("pt-BR")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {status === "online" ? (
                  <Wifi className={`h-3 w-3 ${cfg.color}`} />
                ) : status === "delayed" ? (
                  <AlertTriangle className={`h-3 w-3 ${cfg.color}`} />
                ) : (
                  <WifiOff className={`h-3 w-3 ${cfg.color}`} />
                )}
                <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
                <span className={`font-mono text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
