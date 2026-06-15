"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, DoorOpen, FileText, Users, CreditCard,
  BarChart3, Settings, LogOut, ChevronRight, MapPin,
  CalendarClock, Receipt, SlidersHorizontal, UserCog,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { authService } from "@/lib/services/auth.service";

const NAV_ITEMS = [
  { label: "Tableau de bord",  href: "/dashboard",              icon: LayoutDashboard },
  { label: "Quartiers",        href: "/dashboard/neighborhoods", icon: MapPin },
  { label: "Propriétés",       href: "/dashboard/properties",    icon: Building2 },
  { label: "Locaux",           href: "/dashboard/units",         icon: DoorOpen },
  { label: "Locataires",       href: "/dashboard/tenants",       icon: Users },
  { label: "Contrats",         href: "/dashboard/leases",        icon: FileText },
  { label: "Echéances",        href: "/dashboard/schedules",     icon: CalendarClock },
  { label: "Paiements",        href: "/dashboard/payments",      icon: CreditCard },
  { label: "Reçus",            href: "/dashboard/receipts",      icon: Receipt },
  { label: "Ajustements",      href: "/dashboard/adjustments",   icon: SlidersHorizontal },
  { label: "Rapports",         href: "/dashboard/reports",       icon: BarChart3 },
  { label: "Utilisateurs",     href: "/dashboard/users",         icon: UserCog },
  { label: "Paramètres",       href: "/dashboard/settings",      icon: Settings },
] as const;

export function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);

  async function handleLogout() {
    // ORDRE IMPORTANT :
    // 1. authService.logout() démarre en premier : apiRequest() lit
    //    tokenManager.getAccess() de manière synchrone avant son premier await.
    //    Le Bearer token est donc capturé AVANT que logoutStore() ne le supprime.
    // 2. logoutStore() efface le store + tokenManager côté client (immédiat).
    // 3. router.push() redirige sans attendre la réponse réseau.
    authService.logout();      // démarre l'appel API — capture le token sync
    logoutStore();             // nettoie le store + tokenManager
    router.push("/login");     // redirige immédiatement
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-primary">
      <div className="h-16 flex items-center px-6 shrink-0">
        <span className="text-white font-bold text-[20px] tracking-wide">Estate Mgmt</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-150 group ${active ? "bg-white text-secondary" : "text-white/80 hover:text-white hover:bg-white/8"}`}>
              <Icon size={18} className={active ? "text-secondary" : "text-white/70 group-hover:text-white"} aria-hidden="true" />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto text-secondary/60" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-semibold text-secondary">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white truncate">{user?.name ?? "—"}</p>
            <p className="text-[11px] text-white/45 truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150">
          <LogOut size={15} aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
