"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/features/Sidebar";
import { MobileHeader } from "@/components/features/MobileHeader";
import { useSidebarStore } from "@/lib/stores/sidebar.store";

/**
 * Shell du dashboard.
 * — Mobile  : header hamburger + drawer overlay (géré dans Sidebar)
 * — Desktop : sidebar fixe, largeur 248px (étendue) ou 64px (réduite)
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const desktopCollapsed = useSidebarStore((s) => s.desktopCollapsed);
  const DESKTOP_W = desktopCollapsed ? 64 : 248;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--paper)" }}>
      <Sidebar />
      <MobileHeader />

      {/* Espace réservé à la sidebar sur desktop — suit la transition de largeur */}
      <div
        className="hidden lg:block shrink-0"
        style={{
          width: DESKTOP_W,
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Contenu principal */}
      <main
        id="main-content"
        className="flex-1 min-w-0 overflow-y-auto"
        style={{ paddingTop: 0 }}
      >
        {/* Espace sous le header mobile (visible seulement < lg) */}
        <div className="h-14 lg:hidden" />
        {children}
      </main>
    </div>
  );
}
