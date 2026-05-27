import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmptyStateProps = {
  /** Icône Lucide à afficher dans le cercle central */
  icon: LucideIcon;
  /** Titre principal (H2) */
  title: string;
  /** Texte descriptif (caption) */
  description: string;
  /** Libellé du bouton CTA (optionnel) */
  actionLabel?: string;
  /** Callback au clic sur le CTA (requis si actionLabel fourni) */
  onAction?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EmptyState — conforme à la spec THEME.md :
 * Conteneur blanc, centré, icône dans un cercle, titre H2,
 * caption muted, bouton CTA bg-primary.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center flex flex-col items-center gap-4">
      {/* Icône dans cercle subtil */}
      <div
        className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center"
        aria-hidden="true"
      >
        <Icon size={24} className="text-primary/35" />
      </div>

      {/* Texte */}
      <div className="flex flex-col gap-1.5 items-center">
        <h2 className="font-semibold text-[20px] text-primary tracking-tight leading-snug">
          {title}
        </h2>
        <p className="text-[12px] text-primary/50 max-w-xs leading-relaxed">
          {description}
        </p>
      </div>

      {/* CTA */}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
