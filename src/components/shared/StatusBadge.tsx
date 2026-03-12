import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "warning" | "paper" | "live" | "idle";
  label?: string;
  className?: string;
}

const statusMap = {
  online: { bg: "bg-bull-muted", text: "text-bull", dot: "bg-bull", default: "Online" },
  offline: { bg: "bg-bear-muted", text: "text-bear", dot: "bg-bear", default: "Offline" },
  warning: { bg: "bg-warning/15", text: "text-warning", dot: "bg-warning", default: "Atenção" },
  paper: { bg: "bg-warning/15", text: "text-warning", dot: "bg-warning", default: "Paper" },
  live: { bg: "bg-bull-muted", text: "text-bull", dot: "bg-bull", default: "Live" },
  idle: { bg: "bg-secondary", text: "text-muted-foreground", dot: "bg-muted-foreground", default: "Idle" },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cfg = statusMap[status];
  return (
    <span className={cn("status-badge", cfg.bg, cfg.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {label ?? cfg.default}
    </span>
  );
}
