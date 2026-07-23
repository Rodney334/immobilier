"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, History, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { tenantService } from "@/lib/services/tenant.service";
import { paymentHistoryService } from "@/lib/services/payment-history.service";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Tenant, PaymentHistoryByTenant, LeaseHistoryGroup, HistoryEntry, PaymentHistorySummary } from "@/types";

// ─── Badge de statut ──────────────────────────────────────────────────────────

function StatusBadge({ entry }: { entry: HistoryEntry }) {
  if (entry.paidOnTime === true) {
    return (
      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#E1F5EE", color: "#0F6E56", fontWeight: 500, whiteSpace: "nowrap" }}>
        À l&apos;heure
      </span>
    );
  }
  if (entry.paidOnTime === false) {
    const days = entry.delayDays ?? 0;
    return (
      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#FCEBEB", color: "#A32D2D", fontWeight: 500, whiteSpace: "nowrap" }}>
        {days} jour{days > 1 ? "s" : ""} de retard
      </span>
    );
  }
  // paidOnTime === null
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#FAEEDA", color: "#854F0B", fontWeight: 500, whiteSpace: "nowrap" }}>
      {entry.statusLabel || "En attente"}
    </span>
  );
}

// ─── Entrée d'échéance ────────────────────────────────────────────────────────

function HistoryEntryCard({ entry }: { entry: HistoryEntry }) {
  const hasPayments = entry.payments && entry.payments.length > 0;

  return (
    <div
      style={{
        border: "0.5px solid var(--paper-line)",
        borderRadius: "var(--r-md)",
        padding: "12px 14px",
        background: "var(--paper-raised)",
      }}
    >
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{entry.period}</p>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
            Échéance le {entry.dueDateFormatted}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
            {entry.isFullyPaid
              ? `${entry.amountDueFormatted} FCFA`
              : `${entry.amountPaidFormatted} / ${entry.amountDueFormatted} FCFA`}
          </p>
          <StatusBadge entry={entry} />
        </div>
      </div>

      {/* Versements */}
      {hasPayments && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "0.5px solid var(--paper-line)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {entry.payments.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--ink-soft)" }}>
              <span>
                {p.dateFormatted} · {p.methodLabel}
                {p.reference && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, marginLeft: 4, opacity: 0.7 }}>
                    {p.reference}
                  </span>
                )}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", fontWeight: 500, flexShrink: 0, marginLeft: 12 }}>
                {p.amountFormatted} FCFA
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Groupe de bail ───────────────────────────────────────────────────────────

function LeaseGroup({ group }: { group: LeaseHistoryGroup }) {
  return (
    <div>
      {(group.leaseRef || group.propertyName) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div className="ep-section-label" style={{ margin: 0 }}>
            {[group.leaseRef, group.propertyName, group.unitNumber].filter(Boolean).join(" · ")}
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {group.history.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--ink-soft)", opacity: 0.6, padding: "12px 0" }}>
            Aucune échéance enregistrée.
          </p>
        ) : (
          [...group.history].reverse().map((entry, i) => (
            <HistoryEntryCard key={i} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: PaymentHistorySummary }) {
  const cards = [
    { label: "Échéances", value: summary.totalSchedules, icon: Clock, color: "var(--ink)" },
    { label: "À l'heure", value: summary.totalOnTime, icon: CheckCircle2, color: "#0F6E56" },
    { label: "En retard", value: summary.totalLate, icon: XCircle, color: "#A32D2D" },
    {
      label: "Taux à l'heure",
      value: `${summary.onTimeRate?.toFixed(0) ?? 0}%`,
      icon: AlertCircle,
      color: summary.onTimeRate >= 80 ? "#0F6E56" : summary.onTimeRate >= 60 ? "#854F0B" : "#A32D2D",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--paper-line)",
            borderRadius: "var(--r-md)",
            padding: "12px 14px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <Icon size={13} style={{ color, opacity: 0.7 }} />
            <p style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{label}</p>
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color, lineHeight: 1.1 }}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Tenant list item ─────────────────────────────────────────────────────────

function TenantListItem({ tenant, selected, onClick }: { tenant: Tenant; selected: boolean; onClick: () => void }) {
  const initials = tenant.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "9px 12px", borderRadius: "var(--r-md)",
        background: selected ? "rgba(193,98,45,0.08)" : "transparent",
        border: selected ? "1px solid rgba(193,98,45,0.18)" : "1px solid transparent",
        cursor: "pointer", textAlign: "left", transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(28,43,39,0.04)"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: selected ? "rgba(193,98,45,0.15)" : "rgba(28,43,39,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 11, fontWeight: 700,
        color: selected ? "var(--terracotta)" : "var(--ink-soft)",
      }}>
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: selected ? 600 : 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tenant.fullName}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          {tenant.phone ?? tenant.email ?? "—"}
        </p>
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PaymentHistoryClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [history, setHistory] = useState<PaymentHistoryByTenant | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load tenant list
  useEffect(() => {
    tenantService.getAll({ limit: 100 }).then((res) => {
      setTenants(res.data ?? []);
    }).catch(() => {}).finally(() => setTenantsLoading(false));
  }, []);

  // Load history when tenant changes
  const loadHistory = useCallback((tenant: Tenant) => {
    setHistoryLoading(true);
    setHistory(null);
    paymentHistoryService.getByTenant(tenant.id)
      .then((res) => setHistory(res.data))
      .catch(() => setHistory(null))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTenant) loadHistory(selectedTenant);
  }, [selectedTenant, loadHistory]);

  const filteredTenants = tenants.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ── Panneau gauche ── */}
      <div style={{
        width: 268, flexShrink: 0,
        display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--paper-line)",
        background: "var(--paper-raised)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "22px 16px 12px", borderBottom: "1px solid var(--paper-line)", flexShrink: 0 }}>
          <p className="ep-eyebrow" style={{ marginBottom: 2 }}>Suivi</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: 12 }}>
            Historique paiements
          </h1>
          <div className="ep-search">
            <Search size={13} style={{ flexShrink: 0, opacity: 0.45 }} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un locataire…"
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {tenantsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--ink-soft)", opacity: 0.4 }} />
            </div>
          ) : filteredTenants.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)", opacity: 0.6, padding: "32px 16px" }}>
              {search ? "Aucun résultat" : "Aucun locataire"}
            </p>
          ) : (
            filteredTenants.map((tenant) => (
              <TenantListItem
                key={tenant.id}
                tenant={tenant}
                selected={selectedTenant?.id === tenant.id}
                onClick={() => setSelectedTenant(tenant)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "var(--paper)" }}>
        {!selectedTenant ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <EmptyState
              icon={History}
              title="Sélectionnez un locataire"
              description="Cliquez sur un locataire pour afficher son historique de paiements."
            />
          </div>
        ) : (
          <>
            {/* Topbar */}
            <div className="ep-topbar" style={{ paddingBottom: 20 }}>
              <div>
                <p className="ep-eyebrow" style={{ marginBottom: 2 }}>Historique des paiements</p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.2 }}>
                  {selectedTenant.fullName}
                </h2>
                {selectedTenant.phone && (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{selectedTenant.phone}</p>
                )}
              </div>
            </div>

            <div style={{ padding: "0 28px 40px" }}>
              {historyLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-soft)", opacity: 0.35 }} />
                </div>
              ) : !history ? (
                <div style={{
                  padding: "14px 18px",
                  background: "var(--paper-raised)",
                  border: "1px solid var(--paper-line)",
                  borderRadius: "var(--r-md)",
                  fontSize: 13, color: "var(--ink-soft)",
                }}>
                  Aucun historique disponible pour ce locataire.
                </div>
              ) : (
                <>
                  {/* KPIs */}
                  <SummaryCards summary={history.summary} />

                  {/* Détail par échéance */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 12 }}>
                      Détail par échéance
                    </p>
                  </div>

                  {history.leases.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", opacity: 0.6 }}>Aucune échéance trouvée.</p>
                  ) : history.leases.length === 1 ? (
                    // Bail unique — affichage plat sans header de groupe
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {history.leases[0].leaseRef || history.leases[0].propertyName ? (
                        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>
                          {[history.leases[0].leaseRef, history.leases[0].propertyName, history.leases[0].unitNumber].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      {[...history.leases[0].history].reverse().map((entry, i) => (
                        <HistoryEntryCard key={i} entry={entry} />
                      ))}
                    </div>
                  ) : (
                    // Plusieurs baux — groupés
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {history.leases.map((group) => (
                        <LeaseGroup key={group.leaseId} group={group} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
