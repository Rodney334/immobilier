"use client";

import { Menu } from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebar.store";

/**
 * Barre de navigation supérieure visible uniquement sur mobile/tablette (< lg).
 * Contient le bouton hamburger pour ouvrir le drawer sidebar.
 */
export function MobileHeader() {
  const openMobile = useSidebarStore((s) => s.openMobile);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center gap-3 px-4 bg-primary shadow-sm lg:hidden">
      <button
        onClick={openMobile}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={22} />
      </button>
      <span className="text-white font-bold text-[18px] tracking-wide">
        Estate Mgmt
      </span>
    </header>
  );
}
