"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, DoorOpen, FileText, Users, CreditCard,
  BarChart3, LogOut, MapPin, CalendarClock, Receipt, SlidersHorizontal,
  UserCog, AlertTriangle, ShieldCheck, TrendingUp, ScrollText, Bell,
  ChevronLeft, ChevronRight, X, FileCode,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useSidebarStore } from "@/lib/stores/sidebar.store";
import { authService } from "@/lib/services/auth.service";

// ─── Navigation structure ────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Aperçu",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, badge: null, superAdminOnly: false },
    ],
  },
  {
    label: "Gestion locative",
    items: [
      { label: "Contrats & baux",    href: "/dashboard/leases",             icon: FileText,          badge: null,    superAdminOnly: false },
      { label: "Échéances",          href: "/dashboard/schedules",          icon: CalendarClock,     badge: "alert", superAdminOnly: false },
      { label: "Paiements",          href: "/dashboard/payments",           icon: CreditCard,        badge: null,    superAdminOnly: false },
      { label: "Ajustements",        href: "/dashboard/adjustments",        icon: SlidersHorizontal, badge: null,    superAdminOnly: false },
      { label: "Reçus",              href: "/dashboard/receipts",           icon: Receipt,           badge: null,    superAdminOnly: false },
      { label: "Garanties",          href: "/dashboard/deposits",           icon: ShieldCheck,       badge: null,    superAdminOnly: false },
      { label: "Modèles de contrat", href: "/dashboard/contract-templates", icon: FileCode,          badge: null,    superAdminOnly: true  },
    ],
  },
  {
    label: "Parc immobilier",
    items: [
      { label: "Quartiers",   href: "/dashboard/neighborhoods", icon: MapPin,        badge: null,    superAdminOnly: false },
      { label: "Propriétés",  href: "/dashboard/properties",   icon: Building2,     badge: null,    superAdminOnly: false },
      { label: "Locaux",      href: "/dashboard/units",        icon: DoorOpen,      badge: null,    superAdminOnly: false },
      { label: "Locataires",  href: "/dashboard/tenants",      icon: Users,         badge: null,    superAdminOnly: false },
      { label: "Incidents",   href: "/dashboard/incidents",    icon: AlertTriangle, badge: "alert", superAdminOnly: false },
    ],
  },
  {
    label: "Suivi",
    items: [
      { label: "Rentabilité",     href: "/dashboard/profitability", icon: TrendingUp, badge: null, superAdminOnly: false },
      { label: "Rapports",        href: "/dashboard/reports",       icon: BarChart3,  badge: null, superAdminOnly: false },
      { label: "Journal d'audit", href: "/dashboard/audit-logs",   icon: ScrollText, badge: null, superAdminOnly: false },
      { label: "Notifications",   href: "#",                        icon: Bell,       badge: null, superAdminOnly: false },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Utilisateurs", href: "/dashboard/users", icon: UserCog, badge: null, superAdminOnly: false },
    ],
  },
];

// ─── Inner sidebar content (shared between mobile & desktop) ─────────────────

function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const toggleDesktop = useSidebarStore((s) => s.toggleDesktop);

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

  const userRole = user?.role;
  const isSuperAdmin = userRole === "superadmin";

  const roleName =
    userRole === "superadmin" ? "Super Admin" :
    userRole === "admin" ? "Admin" : "Gestionnaire";

  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        padding: collapsed ? "20px 10px" : "24px 14px",
        transition: "padding 0.2s",
      }}
    >
      {/* ─── Brand ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: collapsed ? "0 4px" : "0 6px",
          marginBottom: 24,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: 34, height: 34, flexShrink: 0,
            borderRadius: "var(--r-sm)",
            background: "var(--terracotta)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 600, fontSize: 18,
            color: "var(--ink)",
          }}
        >
          E
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, letterSpacing: "0.01em", lineHeight: 1.1 }}>
              Estate Project
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(247,243,236,0.4)", marginTop: 2 }}>
              Console de gestion
            </div>
          </div>
        )}

        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(247,243,236,0.5)", padding: 4, borderRadius: "var(--r-sm)", display: "flex" }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ─── Navigation ────────────────────────────────────────────── */}
      <nav style={{ flex: 1 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 2 }}>
            {/* Group label — hidden when collapsed */}
            {!collapsed && (
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(247,243,236,0.35)",
                padding: "0 10px",
                marginBottom: 4,
                marginTop: 14,
              }}>
                {group.label}
              </div>
            )}
            {collapsed && <div style={{ marginTop: 14, borderTop: "1px solid rgba(247,243,236,0.08)" }} />}

            {/* Items */}
            {group.items.filter((item) => !item.superAdminOnly || isSuperAdmin).map(({ label, href, icon: Icon, badge }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? "9px 0" : "8px 10px",
                    borderRadius: "var(--r-sm)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: active ? "var(--paper)" : "rgba(247,243,236,0.68)",
                    background: active ? "rgba(193,98,45,0.2)" : "transparent",
                    textDecoration: "none",
                    position: "relative",
                    transition: "background 0.15s, color 0.15s",
                    marginBottom: 1,
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(247,243,236,0.07)";
                      (e.currentTarget as HTMLElement).style.color = "var(--paper)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(247,243,236,0.68)";
                    }
                  }}
                >
                  {/* Active bar */}
                  {active && (
                    <span style={{
                      position: "absolute",
                      left: collapsed ? -10 : -14,
                      top: 0, bottom: 0, width: 3,
                      background: "var(--terracotta)",
                      borderRadius: "0 3px 3px 0",
                    }} />
                  )}

                  <Icon size={16} style={{ flexShrink: 0, opacity: 0.9 }} />

                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{label}</span>
                      {badge === "alert" && (
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          background: "var(--rouge)",
                          color: "white",
                          padding: "1px 5px",
                          borderRadius: 10,
                        }}>!</span>
                      )}
                    </>
                  )}

                  {/* Alert dot when collapsed */}
                  {collapsed && badge === "alert" && (
                    <span style={{
                      position: "absolute",
                      top: 6, right: 6,
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: "var(--rouge)",
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(247,243,236,0.1)",
        paddingTop: 14,
        marginTop: 8,
      }}>
        {/* User info */}
        {!collapsed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px", marginBottom: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--sauge)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name ?? "—"}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "rgba(247,243,236,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {roleName}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(247,243,236,0.4)", padding: 4, borderRadius: "var(--r-sm)", display: "flex", flexShrink: 0, transition: "color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--paper)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(247,243,236,0.4)"; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div title={user?.name ?? "—"} style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--sauge)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white",
            }}>
              {initials}
            </div>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(247,243,236,0.4)", padding: 4, borderRadius: "var(--r-sm)", display: "flex", transition: "color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--paper)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(247,243,236,0.4)"; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        {/* Desktop collapse toggle */}
        {!onClose && (
          <button
            onClick={toggleDesktop}
            title={collapsed ? "Développer" : "Réduire"}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "6px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(247,243,236,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--r-sm)",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(247,243,236,0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(247,243,236,0.25)"; }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Sidebar component ──────────────────────────────────────────────────

export function Sidebar() {
  const { mobileOpen, closeMobile, desktopCollapsed } = useSidebarStore();

  const DESKTOP_W = desktopCollapsed ? 64 : 248;

  return (
    <>
      {/* ── Mobile overlay backdrop ────────────────────────────────── */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 39,
          }}
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer (slide from left) ───────────────────────── */}
      <aside
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: 268,
          zIndex: 40,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.25)" : "none",
        }}
        className="lg:hidden"
      >
        <SidebarContent collapsed={false} onClose={closeMobile} />
      </aside>

      {/* ── Desktop sidebar (always visible, collapsible) ──────────── */}
      <aside
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: DESKTOP_W,
          zIndex: 40,
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
        className="hidden lg:block"
      >
        <SidebarContent collapsed={desktopCollapsed} />
      </aside>
    </>
  );
}
