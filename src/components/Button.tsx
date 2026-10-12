import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500/50 shadow-sm shadow-indigo-900/50",
  secondary:
    "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700",
  danger:
    "bg-red-600/90 text-white hover:bg-red-500 border border-red-500/50 shadow-sm shadow-red-900/30",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500/50 shadow-sm shadow-emerald-900/30",
  ghost:
    "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
