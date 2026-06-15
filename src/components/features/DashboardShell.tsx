"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/features/Sidebar";
import { MobileHeader } from "@/components/features/MobileHeader";
import { useSidebarStore } from "@/lib/stores/sidebar.store";

/**
 * Shell client du dashboard.
 * Gère la marge du contenu principal en fonction de l'état de la sidebar
 * (collapsée ou non sur desktop) et l'overlay sur mobile.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { mobileOpen, closeMobile, desktopCollapsed } = useSidebarStore();

  return (
    <div className="flex min-h-screen bg-neutral">
      {/* Overlay sombre derrière le drawer mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <Sidebar />
      <MobileHeader />

      <main
        id="main-content"
        className={[
          "flex-1 min-w-0 overflow-y-auto",
          // Espace sous le header mobile (visible sur < lg)
          "pt-14 lg:pt-0",
          // Transition fluide sur desktop
          "transition-[margin-left] duration-200",
          desktopCollapsed ? "lg:ml-16" : "lg:ml-60",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}
