import type { ReactNode, CSSProperties } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "success"   // paid, actif
  | "danger"    // retard, annulé
  | "warning"   // en attente, partiel
  | "neutral"   // brouillon, résilié
  | "info"
  // Variants sémantiques de la maquette (stamps)
  | "paid"
  | "active"
  | "pending"
  | "partial"
  | "overdue"
  | "draft"
  | "terminated"
  | "cancelled";

export type BadgeProps = {
  variant?: BadgeVariant;
  /** Affiche une pastille colorée avant le texte (style dot) */
  dot?: boolean;
  /** Applique la rotation -1deg typique des stamps de la maquette */
  stamp?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

// ─── Style map ────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<BadgeVariant, { color: string; bg: string }> = {
  // Aliases sémantiques → redirigent vers les variantes maquette
  success:     { color: "#5B7B62", bg: "#E0E8DD" },  // sauge
  danger:      { color: "#A8432F", bg: "#F0DAD2" },  // rouge
  warning:     { color: "#C99A3A", bg: "#F3E6C4" },  // ocre
  neutral:     { color: "#3A4944", bg: "rgba(28,43,39,0.07)" }, // ink-soft
  info:        { color: "#1C5FA8", bg: "#DBEAFE" },

  // Stamps maquette
  paid:        { color: "#5B7B62", bg: "#E0E8DD" },  // sauge
  active:      { color: "#5B7B62", bg: "#E0E8DD" },  // sauge
  pending:     { color: "#C99A3A", bg: "#F3E6C4" },  // ocre
  partial:     { color: "#C99A3A", bg: "#F3E6C4" },  // ocre
  overdue:     { color: "#A8432F", bg: "#F0DAD2" },  // rouge
  draft:       { color: "#3A4944", bg: "rgba(28,43,39,0.07)" },
  terminated:  { color: "#3A4944", bg: "rgba(28,43,39,0.07)" },
  cancelled:   { color: "#A8432F", bg: "#F0DAD2" },  // rouge
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({
  variant = "neutral",
  dot = true,
  stamp = false,
  children,
  className = "",
  style: extraStyle,
}: BadgeProps) {
  const { color, bg } = VARIANT_STYLES[variant];

  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "4px 9px 4px 8px",
    borderRadius: "var(--r-sm)",
    border: `1.5px solid ${color}`,
    color,
    background: bg,
    transform: stamp ? "rotate(-1deg)" : undefined,
    whiteSpace: "nowrap",
    ...extraStyle,
  };

  return (
    <span className={className} style={baseStyle}>
      {dot && (
        <span
          style={{
            width: 5, height: 5,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
