import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
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
  // Fond encre foncée — action principale
  primary:
    "bg-primary text-white hover:bg-[#0f1a17] active:bg-[#0a1410] disabled:opacity-50",
  // Fond terracotta — action secondaire / CTA chaud
  secondary:
    "bg-secondary text-white hover:bg-[#a8542a] active:bg-[#943f1e] disabled:opacity-50",
  // Accent alias (identique à secondary dans ce design)
  accent:
    "bg-secondary text-white hover:bg-[#a8542a] active:bg-[#943f1e] disabled:opacity-50",
  // Contour discret — action neutre
  ghost:
    "bg-transparent text-primary border border-[var(--paper-line)] hover:bg-[var(--paper-raised)] active:bg-[var(--paper-line)] disabled:opacity-50",
  // Rouge destructif
  danger:
    "bg-danger text-white hover:bg-[#8f3924] active:bg-[#7a2e1b] disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px] rounded-[var(--r-sm)] gap-1.5",
  md: "h-9 px-4 text-[13px] rounded-[var(--r-sm)] gap-1.5",
  lg: "h-10 px-5 text-[14px] rounded-[var(--r-sm)] gap-2",
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
        "inline-flex items-center justify-center font-semibold",
        "transition-colors duration-150",
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
        <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
