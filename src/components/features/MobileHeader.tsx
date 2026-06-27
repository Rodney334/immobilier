"use client";

import { Menu } from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebar.store";

/**
 * Header fixe visible uniquement sur mobile/tablette (< lg).
 * Contient le bouton hamburger pour ouvrir le drawer sidebar.
 */
export function MobileHeader() {
  const openMobile = useSidebarStore((s) => s.openMobile);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center gap-3 px-4 lg:hidden"
      style={{ background: "var(--ink)" }}
    >
      <button
        onClick={openMobile}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: "rgba(247,243,236,0.6)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--paper)"; (e.currentTarget as HTMLElement).style.background = "rgba(247,243,236,0.07)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(247,243,236,0.6)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* Brand mark */}
      <div
        style={{
          width: 28, height: 28, flexShrink: 0,
          borderRadius: "var(--r-sm)",
          background: "var(--terracotta)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 600, fontSize: 15,
          color: "var(--ink)",
        }}
      >
        E
      </div>

      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--paper)",
          letterSpacing: "0.01em",
        }}
      >
        Estate Project
      </span>
    </header>
  );
}
