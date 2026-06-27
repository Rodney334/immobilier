"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Search, FileText, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { leaseService } from "@/lib/services/lease.service";
import { useToast } from "@/components/ui/Toast";
import { LeaseDetailPanel } from "@/components/features/leases/LeaseDetailPanel";
import { LeaseFormModal } from "@/components/features/leases/LeaseFormModal";
import { LeaseTerminateModal } from "@/components/features/leases/LeaseTerminateModal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Lease, LeaseStatus, LeasePeriodicity, PaginationMeta } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeaseStatus, { label: string; variant: "success"|"warning"|"danger"|"neutral"|"active"|"pending"|"draft"|"terminated" }> = {
  ACTIVE:     { label: "Actif",      variant: "active"     },
  ARCHIVED:   { label: "Archivé",    variant: "pending"    },
  DRAFT:      { label: "Brouillon",  variant: "draft"      },
  EXPIRED:    { label: "Expiré",     variant: "neutral"    },
  SUSPENDED:  { label: "Suspendu",   variant: "warning"    },
  TERMINATED: { label: "Clôturé",   variant: "terminated" },
};

const FREQ_LABELS: Record<LeasePeriodicity, string> = {
  MONTHLY: "Mensuel", QUARTERLY: "Trimestriel", YEARLY: "Annuel",
};

const FILTER_OPTIONS: { value: LeaseStatus | "all"; label: string }[] = [
  { value: "all",        label: "Tous"       },
  { value: "ACTIVE",     label: "Actifs"     },
  { value: "DRAFT",      label: "Brouillon"  },
  { value: "EXPIRED",    label: "Expiré"     },
  { value: "SUSPENDED",  label: "Suspendu"   },
  { value: "TERMINATED", label: "Clôturé"   },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtMono(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(2)}`;
}
function fmtXOF(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " F"; }
function daysUntil(iso: string) { return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000); }
function initials(name: string) { return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (p: number) => void }) {
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="ep-pagination">
      <span>Affichage {from}–{to} sur {total} contrat{total > 1 ? "s" : ""}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button className="ep-page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={13} />
        </button>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "0 8px" }}>
          Page {page} / {totalPages}
        </span>
        <button className="ep-page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

export function LeasesClient() {
  const { toast } = useToast();

  const [leases, setLeases]         = useState<Lease[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatusFilter] = useState<LeaseStatus | "all">("all");
  const [selected, setSelected]     = useState<Lease | null>(null);
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Lease | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<Lease | null>(null);
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await leaseService.getAll({
        page, limit: PAGE_LIMIT,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedQ || undefined,
      });
      const list: Lease[] = Array.isArray(res.data) ? res.data : ((res as any).data?.data ?? []);
      const meta = res.meta ?? (res as any).pagination ?? null;
      setLeases(list); setPagination(meta);

      if (!toastShown) {
        const expiring = list.filter(l => l.status === "ACTIVE" && l.endDate && daysUntil(l.endDate) >= 0 && daysUntil(l.endDate) <= 30);
        if (expiring.length > 0) {
          toast({ variant: "warning", title: `${expiring.length} contrat(s) expire(nt) bientôt`, duration: 8000 });
          setToastShown(true);
        }
      }
    } catch { setError("Impossible de charger les contrats."); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, debouncedQ]);

  useEffect(() => { load(); }, [load]);

  function handleSaved(l: Lease) {
    setLeases(prev => { const idx = prev.findIndex(x => x.id === l.id); if (idx >= 0) { const n = [...prev]; n[idx] = l; return n; } return [l, ...prev]; });
    if (selected?.id === l.id) setSelected(l);
    setFormOpen(false); setEditTarget(null); load();
  }
  function handleTerminated(l: Lease) {
    setLeases(prev => prev.map(x => x.id === l.id ? l : x));
    if (selected?.id === l.id) setSelected(l);
    setTerminateTarget(null);
  }

  async function handleDownload(l: Lease) {
    toast({ variant: "warning", title: "Téléchargement en cours…", duration: 3000 });
    try {
      const blob = await leaseService.downloadContractPdf(l.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `contrat-${l.id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast({ variant: "danger", title: "Échec du téléchargement", duration: 4000 }); }
  }

  return (
    <>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── Zone principale ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Topbar */}
          <div className="ep-topbar" style={{ paddingBottom: 20 }}>
            <div>
              <p className="ep-eyebrow">Gestion locative</p>
              <h1 className="ep-page-title">Contrats &amp; baux</h1>
              <p className="ep-page-desc">Tous les baux du parc, leur statut et leurs conditions financières.</p>
            </div>
            <div className="ep-topbar-actions">
              <button className="ep-btn ep-btn-ghost" onClick={() => handleDownload(leases[0] ?? ({} as Lease))}>
                <Download size={13} /> Exporter
              </button>
              <button className="ep-btn ep-btn-primary" onClick={() => { setEditTarget(null); setFormOpen(true); }}>
                <Plus size={14} /> Nouveau bail
              </button>
            </div>
          </div>

          {/* Filtres + recherche */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 32px 16px", flexWrap: "wrap" }}>
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className="ep-chip"
                data-active={statusFilter === opt.value ? "true" : "false"}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <div className="ep-search" style={{ marginLeft: "auto", minWidth: 220 }}>
              <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Locataire, n° contrat…"
              />
            </div>
          </div>

          {error && (
            <div style={{ margin: "0 32px 16px", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--rouge-soft)", border: "1px solid var(--rouge)", fontSize: 13, color: "var(--rouge)" }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Panel */}
          <div style={{ flex: 1, overflow: "hidden", padding: "0 32px 32px", display: "flex", flexDirection: "column" }}>
            <div className="ep-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {loading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
                </div>
              ) : leases.length === 0 ? (
                <div style={{ padding: 24 }}>
                  <EmptyState
                    icon={FileText}
                    title="Aucun contrat"
                    description={statusFilter !== "all" ? "Aucun contrat pour ce statut." : "Créez votre premier bail."}
                    actionLabel={statusFilter === "all" ? "Nouveau contrat" : undefined}
                    onAction={statusFilter === "all" ? () => { setEditTarget(null); setFormOpen(true); } : undefined}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <table className="ep-table">
                    <thead>
                      <tr>
                        {["Contrat", "Locataire", "Unité", "Loyer mensuel", "Période", "Statut", ""].map((h, i) => (
                          <th key={i} className="ep-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leases.map(l => {
                        const tenantName = l.tenant?.fullName ?? (l.tenant ? `${l.tenant.firstName} ${l.tenant.lastName}` : "—");
                        const unitLabel  = l.unit ? `${l.unit.property?.name ? l.unit.property.name + " — " : ""}Unité ${l.unit.unitNumber}` : "—";
                        const daysLeft   = l.endDate ? daysUntil(l.endDate) : Infinity;
                        const nearExpiry = l.status === "ACTIVE" && daysLeft <= 30 && daysLeft >= 0;
                        const cfg        = STATUS_CONFIG[l.status];
                        const isSelected = selected?.id === l.id;

                        return (
                          <tr
                            key={l.id}
                            className="ep-tr"
                            onClick={() => setSelected(p => p?.id === l.id ? null : l)}
                            style={{ background: isSelected ? "rgba(193,98,45,0.06)" : undefined }}
                          >
                            <td className="ep-td ep-mono">{l.id.slice(-8).toUpperCase()}</td>
                            <td className="ep-td">
                              <div className="ep-person">
                                <div className="ep-avatar">{tenantName !== "—" ? initials(tenantName) : "?"}</div>
                                <div>
                                  <div className="ep-person-name">{tenantName}</div>
                                  <div className="ep-person-sub">Locataire principal</div>
                                </div>
                              </div>
                            </td>
                            <td className="ep-td" style={{ fontSize: 13, color: "var(--ink-soft)" }}>{unitLabel}</td>
                            <td className="ep-td ep-amount">{fmtXOF(Number(l.monthlyRent))}</td>
                            <td className="ep-td ep-mono">
                              {fmtMono(l.startDate)} → {l.endDate ? fmtMono(l.endDate) : "en cours"}
                              {nearExpiry && <div style={{ fontSize: 10.5, color: "var(--ocre)", marginTop: 2 }}>{daysLeft}j restants</div>}
                            </td>
                            <td className="ep-td">
                              <Badge variant={cfg.variant as any} stamp>{cfg.label}</Badge>
                            </td>
                            <td className="ep-td" style={{ width: 40 }}>
                              <button
                                className="ep-icon-btn"
                                onClick={e => { e.stopPropagation(); setSelected(p => p?.id === l.id ? null : l); }}
                              >
                                →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {pagination && pagination.totalPages > 1 && (
                <Pagination meta={pagination} onPage={setPage} />
              )}
            </div>
          </div>
        </div>

        {/* ── Panneau latéral détail ── */}
        {selected && (
          <LeaseDetailPanel
            lease={selected}
            onClose={() => setSelected(null)}
            onEdit={l => { setEditTarget(l); setFormOpen(true); }}
            onTerminate={l => setTerminateTarget(l)}
            onUpdated={handleSaved}
          />
        )}
      </div>

      <LeaseFormModal
        isOpen={formOpen}
        lease={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />
      {terminateTarget && (
        <LeaseTerminateModal
          isOpen={!!terminateTarget}
          lease={terminateTarget}
          onClose={() => setTerminateTarget(null)}
          onDone={handleTerminated}
        />
      )}
    </>
  );
}
