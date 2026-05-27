"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Contenu scrollable du corps de la modale */
  children: ReactNode;
  /** Slot pied de modale fixe (boutons d'action, etc.) */
  footer?: ReactNode;
  /** Largeur max custom (défaut : 480px conforme THEME.md) */
  maxWidth?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Modal — conforme à la spec THEME.md :
 * Largeur 480px, radius 16px, Header fixe + Body scrollable + Footer fixe.
 * Fermeture par Escape, clic backdrop ou bouton ×.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "480px",
}: ModalProps) {
  // Fermeture au clavier Escape + blocage du scroll body
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* ── Backdrop ─────────────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-primary/40 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* ── Panneau ──────────────────────────────────────────────────────── */}
      <div
        style={{ maxWidth }}
        className="relative w-full bg-white rounded-[16px] shadow-xl
                   flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (fixe) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-custom shrink-0">
          <h2
            id="modal-title"
            className="font-semibold text-[20px] text-primary tracking-tight"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-primary/35 hover:text-primary transition-colors
                       rounded-md p-1 -mr-1"
            aria-label="Fermer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {children}
        </div>

        {/* Footer (fixe, optionnel) */}
        {footer && (
          <div className="px-6 py-4 border-t border-border-custom shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
