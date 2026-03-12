import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  className?: string;
  variant?: "default" | "bull" | "bear" | "primary" | "warning";
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  subtitle,
  className,
  variant = "default",
}: MetricCardProps) {
  const variantClasses = {
    default: "",
    bull: "border-bull/20",
    bear: "border-bear/20",
    primary: "border-primary/20",
    warning: "border-warning/20",
  };

  const valueColor = {
    default: "text-foreground",
    bull: "text-bull",
    bear: "text-bear",
    primary: "text-primary",
    warning: "text-warning",
  };

  return (
    <div className={cn("metric-card group", variantClasses[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{label}</p>
          <p className={cn("metric-value", valueColor[variant])}>{value}</p>
          {subtitle && (
            <p className="text-[10px] font-mono text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-secondary/50">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
