import type { LogEntry } from "@/types/trading";

interface LogsPanelProps {
  logs: LogEntry[];
}

const levelColors: Record<LogEntry["level"], string> = {
  INFO: "text-info",
  WARN: "text-warning",
  ERROR: "text-bear",
  SIGNAL: "text-primary",
};

export function LogsPanel({ logs }: LogsPanelProps) {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span>Logs</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin font-mono text-xs p-2 space-y-0.5 bg-terminal-bg">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 py-0.5 leading-relaxed">
            <span className="text-muted-foreground shrink-0">
              {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
            </span>
            <span className={`shrink-0 w-14 text-right ${levelColors[log.level]}`}>
              [{log.level}]
            </span>
            <span className="text-secondary-foreground">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
