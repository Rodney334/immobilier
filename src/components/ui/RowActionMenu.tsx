"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export type RowActionItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
  /** Affiche un séparateur avant cet item */
  dividerBefore?: boolean;
  /** Cache l'item si false */
  hidden?: boolean;
};

type Props = {
  items: RowActionItem[];
  /** Largeur du menu en px (défaut 192) */
  width?: number;
};

/**
 * Bouton "trois points" avec menu déroulant rendu dans un portal (document.body).
 * Évite tout problème de z-index / overflow:hidden dans les tableaux.
 */
export function RowActionMenu({ items, width = 192 }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  }

  const visibleItems = items.filter((it) => it.hidden !== true);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-7 h-7 rounded-md flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/6 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical size={14} />
      </button>

      {open && mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[200]"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            />
            {/* Menu */}
            <div
              className="fixed z-[201] bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]"
              style={{ top: pos.top, right: pos.right, width }}
            >
              {visibleItems.map((item, i) => (
                <div key={i}>
                  {item.dividerBefore && (
                    <div className="my-1 border-t border-border-custom" />
                  )}
                  <button
                    onClick={() => { setOpen(false); item.onClick(); }}
                    className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2
                      ${
                        item.variant === "danger"
                          ? "hover:bg-danger/6 text-danger"
                          : item.variant === "success"
                            ? "hover:bg-success/6 text-success"
                            : "hover:bg-primary/4 text-primary/70 hover:text-primary"
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
