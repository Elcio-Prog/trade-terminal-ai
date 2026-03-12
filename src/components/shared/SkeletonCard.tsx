import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn("panel p-4 space-y-3", className)}>
      <div className="skeleton h-3 w-1/3 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-2.5 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}
