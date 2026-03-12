import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("empty-state", className)}>
      <Icon className="empty-state-icon" />
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
    </div>
  );
}
