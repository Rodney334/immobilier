import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SidebarState = {
  /** Drawer mobile ouvert (toujours fermé au démarrage) */
  mobileOpen: boolean;
  /** Sidebar réduite sur desktop (persistée) */
  desktopCollapsed: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleDesktop: () => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      mobileOpen: false,
      desktopCollapsed: false,
      openMobile: () => set({ mobileOpen: true }),
      closeMobile: () => set({ mobileOpen: false }),
      toggleDesktop: () =>
        set((s) => ({ desktopCollapsed: !s.desktopCollapsed })),
    }),
    {
      name: "sidebar-pref",
      storage: createJSONStorage(() => localStorage),
      // On ne persiste que la préférence desktop — le drawer mobile repart toujours fermé
      partialize: (s) => ({ desktopCollapsed: s.desktopCollapsed }),
    },
  ),
);
