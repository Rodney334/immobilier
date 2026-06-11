"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// ---------------------------------------------------------------------------
// Données de navigation
// L'ordre correspond à la maquette : Tableau de bord, Propriétés, Locaux,
// Locataires, Contrats, Paiements, Rapports, Paramètres
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/proprietes", label: "Propriétés", icon: Building2 },
  { href: "/locaux", label: "Locaux", icon: DoorOpen },
  { href: "/locataires", label: "Locataires", icon: Users },
  { href: "/contrats", label: "Contrats", icon: FileText },
  { href: "/paiements", label: "Paiements", icon: CreditCard },
  { href: "/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

// ---------------------------------------------------------------------------
// Composant NavLink (isolé pour clarté)
// ---------------------------------------------------------------------------

type NavLinkProps = {
  item: NavItem;
  isActive: boolean;
};

function NavLink({ item, isActive }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
        "text-[14px] font-medium transition-colors duration-150",
        isActive
          ? "bg-white text-secondary"
          : "text-white hover:text-neutral hover:bg-white/5",
      ].join(" ")}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Composant principal Sidebar
// ---------------------------------------------------------------------------

export function Sidebar() {
  const pathname = usePathname();

  /**
   * Détermine si un item est actif :
   * - Correspondance exacte OU sous-route (ex: /locaux/123 → item /locaux actif)
   */
  function isItemActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 bg-primary flex flex-col z-40"
      aria-label="Navigation principale"
    >
      {/* ── Header / Logo ─────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-5 border-b border-white/10 shrink-0">
        <p className="text-white text-[20px] font-bold tracking-wide leading-none">
          Estate Mangement
        </p>
        <p className="text-white/40 text-[11px] mt-1 tracking-wide uppercase">
          Gestion Immobilière
        </p>
      </div>

      {/* ── Navigation principale ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Menu">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink item={item} isActive={isItemActive(item.href)} />
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Footer / Profil utilisateur ───────────────────────────── */}
      <div className="px-4 py-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar initiales */}
          <div
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-[11px] font-bold shrink-0 select-none"
            aria-hidden="true"
          >
            AD
          </div>

          {/* Infos utilisateur */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-medium leading-tight truncate">
              Amadou Diop
            </p>
            <p className="text-white/45 text-[11px] leading-tight truncate">
              Propriétaire
            </p>
          </div>

          {/* Bouton déconnexion */}
          <button
            type="button"
            className="text-white/45 hover:text-white transition-colors duration-150 shrink-0"
            aria-label="Se déconnecter"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
