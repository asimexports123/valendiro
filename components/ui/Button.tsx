import { cn } from "./utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-foreground text-background hover:bg-foreground/90",
        variant === "secondary" && "border border-border bg-background text-foreground hover:bg-accent",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
