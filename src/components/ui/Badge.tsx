import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

export type BadgeProps = {
  variant?: BadgeVariant;
  /** Petite pastille colorée avant le texte */
  dot?: boolean;
  children: ReactNode;
  className?: string;
};

// ─── Style map ────────────────────────────────────────────────────────────────

const variantClasses: Record<
  BadgeVariant,
  { badge: string; dot: string }
> = {
  // Vert Émeraude → statuts payés, succès
  success: {
    badge: "bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20",
    dot: "bg-[#2A9D8F]",
  },
  // Rouge Corail → impayé, erreur, suppression
  danger: {
    badge: "bg-[#E76F51]/10 text-[#E76F51] border-[#E76F51]/20",
    dot: "bg-[#E76F51]",
  },
  // Or chaud (Secondary) → avertissement, baux expirant
  warning: {
    badge: "bg-[#D4A373]/10 text-[#D4A373] border-[#D4A373]/20",
    dot: "bg-[#D4A373]",
  },
  // Neutre → états génériques, non définis
  neutral: {
    badge: "bg-primary/8 text-primary/65 border-primary/15",
    dot: "bg-primary/40",
  },
  // Info → usage occasionnel
  info: {
    badge: "bg-blue-50 text-blue-600 border-blue-200",
    dot: "bg-blue-500",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({
  variant = "neutral",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  const { badge, dot: dotColor } = variantClasses[variant];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        "px-2.5 py-0.5 rounded-full",
        "text-[12px] font-medium border",
        badge,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
