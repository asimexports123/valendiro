import { cn } from "./utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-background p-6 shadow-[var(--shadow)]", className)}>
      {children}
    </div>
  );
}
