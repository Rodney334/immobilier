import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
};

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-[#263447] active:bg-[#16202C] disabled:bg-primary/50",
  secondary:
    "bg-secondary text-white hover:bg-[#C8935E] active:bg-[#BC8352] disabled:bg-secondary/50",
  ghost:
    "bg-transparent text-primary border border-[#E5E7EB] hover:bg-primary/5 active:bg-primary/10 disabled:opacity-50",
  danger:
    "bg-danger text-white hover:bg-[#D9613E] active:bg-[#CC5233] disabled:bg-danger/50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md gap-1.5",
  md: "h-10 px-5 text-[14px] rounded-lg gap-2",
  lg: "h-12 px-6 text-[15px] rounded-lg gap-2",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center",
        "font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading && (
        <Loader2 size={15} className="animate-spin shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
