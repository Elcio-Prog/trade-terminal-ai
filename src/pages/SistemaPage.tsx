import { useBridgeAgent } from "@/hooks/useMarketData";
import { useHealthCheck } from "@/hooks/useTrading";
import { mockData } from "@/services/api";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectionHeader } from "@/components/shared/SectionHeader";
import {
  Server, Database, Wifi, WifiOff, Clock, Activity, AlertTriangle,
  CheckCircle, Heart, Terminal, Cpu, HardDrive
} from "lucide-react";

const SistemaPage = () => {
  const { agent, status } = useBridgeAgent(5_000);
  const backendConnected = useHealthCheck(5_000);
  const logs = mockData.logs;

  const levelColors: Record<string, string> = {
    INFO: "text-info",
    WARN: "text-warning",
    ERROR: "text-bear",
    SIGNAL: "text-primary",
  };

  const systems = [
    { name: "Backend API", status: backendConnected ? "online" as const : "offline" as const, detail: backendConnected ? "127.0.0.1:8787" : "Sem conexão" },
    { name: "Bridge Agent", status: status === "online" ? "online" as const : status === "delayed" ? "warning" as const : "offline" as const, detail: agent?.agent_name ?? "—" },
    { name: "Database", status: "online" as const, detail: "Lovable Cloud" },
    { name: "IA Model", status: "paper" as const, detail: "Paper mode" },
    { name: "Paper Trading", status: "paper" as const, detail: "Ativo" },
    { name: "Polling", status: "online" as const, detail: "5s / 8s" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        title="Sistema"
        subtitle="Monitoramento técnico, saúde e diagnósticos da plataforma"
      />

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {systems.map((sys, i) => (
          <div key={i} className="card-premium p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{sys.name}</span>
              <StatusBadge status={sys.status} />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">{sys.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Details */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-primary" />
              Bridge Agent
            </span>
            <StatusBadge status={status === "online" ? "online" : status === "delayed" ? "warning" : "offline"} />
          </div>
          <div className="p-4 space-y-0">
            {[
              { label: "Nome", value: agent?.agent_name ?? "—" },
              { label: "Host", value: agent?.host_name ?? "—" },
              { label: "IP", value: agent?.ip_address ?? "—" },
              { label: "Versão", value: agent?.app_version ?? "—" },
              { label: "Status", value: agent?.status ?? "—" },
              { label: "Último heartbeat", value: agent?.last_heartbeat_at ? new Date(agent.last_heartbeat_at).toLocaleString("pt-BR") : "—" },
            ].map((item, i) => (
              <div key={i} className="data-row">
                <span className="data-label">{item.label}</span>
                <span className="data-value text-xs">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Checks */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-primary" />
              Health Checks
            </span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { check: "API /health", ok: backendConnected },
              { check: "Supabase connection", ok: true },
              { check: "Agent heartbeat", ok: status === "online" },
              { check: "Candle data flow", ok: true },
              { check: "Renko data flow", ok: true },
              { check: "Paper engine", ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">{item.check}</span>
                {item.ok ? (
                  <CheckCircle className="h-3.5 w-3.5 text-bull" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-bear" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              Configuração
            </span>
          </div>
          <div className="p-4 space-y-0">
            {[
              { label: "Modo", value: "Paper Trading" },
              { label: "Polling Engine", value: "3s" },
              { label: "Polling Agent", value: "8s" },
              { label: "Polling Market", value: "5s" },
              { label: "API Base", value: "localhost:8787" },
              { label: "Versão", value: "1.0.0" },
            ].map((item, i) => (
              <div key={i} className="data-row">
                <span className="data-label">{item.label}</span>
                <span className="data-value text-xs">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="card-premium">
        <div className="panel-header">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            System Logs
          </span>
          <span className="font-mono text-[10px]">{logs.length} entradas</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin font-mono text-xs p-3 space-y-0.5 bg-terminal-bg rounded-b-lg">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 py-1 leading-relaxed hover:bg-secondary/20 px-2 rounded transition-colors">
              <span className="text-muted-foreground shrink-0 text-[10px]">
                {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
              </span>
              <span className={`shrink-0 w-14 text-right text-[10px] font-semibold ${levelColors[log.level]}`}>
                [{log.level}]
              </span>
              <span className="text-secondary-foreground text-[11px]">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SistemaPage;
