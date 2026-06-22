"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, DoorOpen, FileText, Users, CreditCard,
  BarChart3, Settings, LogOut, ChevronRight, ChevronLeft, MapPin,
  CalendarClock, Receipt, SlidersHorizontal, UserCog, X,
  AlertTriangle, ShieldCheck, TrendingUp, ScrollText,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useSidebarStore } from "@/lib/stores/sidebar.store";
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
  { label: "Incidents",         href: "/dashboard/incidents",     icon: AlertTriangle },
  { label: "Garanties",        href: "/dashboard/deposits",      icon: ShieldCheck },
  { label: "Rentabilité",      href: "/dashboard/profitability", icon: TrendingUp },
  { label: "Logs d'audit",    href: "/dashboard/audit-logs",    icon: ScrollText },
  { label: "Rapports",         href: "/dashboard/reports",       icon: BarChart3 },
  { label: "Utilisateurs",     href: "/dashboard/users",         icon: UserCog },
  { label: "Paramètres",       href: "/dashboard/settings",      icon: Settings },
] as const;

export function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);

  const { mobileOpen, closeMobile, desktopCollapsed, toggleDesktop } =
    useSidebarStore();

  async function handleLogout() {
    authService.logout();
    logoutStore();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <aside
      className={[
        // Base : fixed, colonne flex
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-primary",
        // Transition sur la largeur (desktop) et le translate (mobile)
        "transition-all duration-200",
        // Mobile : glisse depuis la gauche
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop : toujours visible, largeur variable
        "lg:translate-x-0",
        desktopCollapsed ? "lg:w-16" : "lg:w-60",
        // Largeur de base (utilisée sur mobile)
        "w-64",
      ].join(" ")}
    >
      {/* ─── En-tête ──────────────────────────────────────────────────────── */}
      <div className="h-14 lg:h-16 flex items-center px-4 shrink-0">
        {/* Logo / titre (caché quand réduit sur desktop) */}
        <span
          className={[
            "text-white font-bold tracking-wide",
            desktopCollapsed ? "lg:hidden" : "",
          ].join(" ")}
          style={{ fontSize: 20 }}
        >
          Estate Mgmt
        </span>

        {/* Initiale quand réduit sur desktop */}
        {desktopCollapsed && (
          <span className="hidden lg:block text-white font-bold text-[18px] mx-auto">
            E
          </span>
        )}

        {/* Bouton fermeture sur mobile */}
        <button
          onClick={closeMobile}
          className="ml-auto lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ─── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobile}
              title={desktopCollapsed ? label : undefined}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-150 group",
                desktopCollapsed ? "lg:justify-center lg:px-2" : "",
                active
                  ? "bg-white text-secondary"
                  : "text-white/80 hover:text-white hover:bg-white/8",
              ].join(" ")}
            >
              <Icon
                size={18}
                className={active ? "text-secondary shrink-0" : "text-white/70 group-hover:text-white shrink-0"}
                aria-hidden="true"
              />
              <span className={desktopCollapsed ? "lg:hidden" : ""}>{label}</span>
              {active && !desktopCollapsed && (
                <ChevronRight size={14} className="ml-auto text-secondary/60" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ─── Pied de page ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {/* Infos utilisateur (cachées quand réduit sur desktop) */}
        <div className={["flex items-center gap-3 mb-2", desktopCollapsed ? "lg:hidden" : ""].join(" ")}>
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
            <span className="text-[12px] font-semibold text-secondary">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-white truncate">{user?.name ?? "—"}</p>
            <p className="text-[11px] text-white/45 truncate">{user?.email ?? "—"}</p>
          </div>
        </div>

        {/* Avatar seul quand réduit */}
        {desktopCollapsed && (
          <div className="hidden lg:flex justify-center mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="text-[12px] font-semibold text-secondary">{initials}</span>
            </div>
          </div>
        )}

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          title={desktopCollapsed ? "Se déconnecter" : undefined}
          className={[
            "flex items-center gap-2 w-full px-2 py-2 rounded-lg text-[13px] text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150",
            desktopCollapsed ? "lg:justify-center" : "",
          ].join(" ")}
        >
          <LogOut size={15} aria-hidden="true" />
          <span className={desktopCollapsed ? "lg:hidden" : ""}>Se déconnecter</span>
        </button>

        {/* Bouton collapse — desktop uniquement */}
        <button
          onClick={toggleDesktop}
          className="hidden lg:flex items-center justify-center w-full mt-1 py-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-colors"
          aria-label={desktopCollapsed ? "Développer la barre" : "Réduire la barre"}
        >
          {desktopCollapsed
            ? <ChevronRight size={14} />
            : <ChevronLeft size={14} />
          }
        </button>
      </div>
    </aside>
  );
}
