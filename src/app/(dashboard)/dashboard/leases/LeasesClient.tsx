"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
} from "lucide-react";
import { leaseService } from "@/lib/services/lease.service";
import { useToast } from "@/components/ui/Toast";
import { LeaseDetailPanel } from "@/components/features/leases/LeaseDetailPanel";
import { LeaseFormModal } from "@/components/features/leases/LeaseFormModal";
import { LeaseTerminateModal } from "@/components/features/leases/LeaseTerminateModal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
  Lease,
  LeaseStatus,
  LeasePeriodicity,
  PaginationMeta,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  LeaseStatus,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "neutral" | "info";
  }
> = {
  ACTIVE: { label: "Actif", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "warning" },
  DRAFT: { label: "Brouillon", variant: "neutral" },
  EXPIRED: { label: "Expiré", variant: "neutral" },
  SUSPENDED: { label: "Suspendu", variant: "warning" },
  TERMINATED: { label: "Clôturé", variant: "neutral" },
};

const FREQ_LABELS: Record<LeasePeriodicity, string> = {
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " XOF";
}
function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function LeaseRowActions({
  lease,
  onViewDetails,
  onTerminate,
  onDownload,
}: {
  lease: Lease;
  onViewDetails: () => void;
  onTerminate: () => void;
  onDownload: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded-md flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/6 transition-colors"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]">
            <button
              onClick={() => {
                setOpen(false);
                onViewDetails();
              }}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors"
            >
              Voir les details
            </button>
            {lease.status === "ACTIVE" && (
              <button
                onClick={() => {
                  setOpen(false);
                  onTerminate();
                }}
                className="w-full text-left px-4 py-2 hover:bg-danger/6 text-danger transition-colors"
              >
                Resilier
              </button>
            )}
            <div className="my-1 border-t border-border-custom" />
            <button
              onClick={() => {
                setOpen(false);
                onDownload();
              }}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors flex items-center gap-2"
            >
              <Download size={12} /> Telecharger PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function LeaseRow({
  lease,
  selected,
  onClick,
  onTerminate,
  onDownload,
}: {
  lease: Lease;
  selected: boolean;
  onClick: () => void;
  onTerminate: () => void;
  onDownload: () => void;
}) {
  const cfg = STATUS_CONFIG[lease.status];
  const tenantName =
    lease.tenant?.fullName ??
    (lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : "—");
  const unitLabel = lease.unit ? `Local ${lease.unit.unitNumber}` : "—";
  const daysLeft = lease.endDate ? daysUntil(lease.endDate) : Infinity;
  const nearExpiry =
    lease.status === "ACTIVE" && daysLeft <= 30 && daysLeft >= 0;

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors duration-100
        ${
          selected
            ? "bg-secondary/8 border-l-2 border-l-secondary"
            : nearExpiry
              ? "bg-secondary/4 border-l-2 border-l-secondary/40 hover:bg-secondary/8"
              : "hover:bg-primary/3 border-l-2 border-l-transparent"
        }`}
    >
      <td className="px-5 py-3.5">
        <p className="text-[13px] font-medium text-primary truncate">
          {tenantName}
        </p>
        <p className="text-[11px] text-primary/40">{unitLabel}</p>
      </td>
      <td className="px-4 py-3.5 text-[13px] tabular-nums text-primary/80">
        {formatXOF(Number(lease.monthlyRent))}
      </td>
      <td className="px-4 py-3.5 text-[12px] text-primary/50">
        {lease.periodicity
          ? (FREQ_LABELS[lease.periodicity] ?? lease.periodicity)
          : "-"}
      </td>
      <td className="px-4 py-3.5 text-[12px] text-primary/50 tabular-nums whitespace-nowrap">
        {formatDate(lease.startDate)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <p
          className={`text-[12px] tabular-nums ${nearExpiry ? "text-secondary font-semibold" : "text-primary/50"}`}
        >
          {lease.endDate ? formatDate(lease.endDate) : "—"}
        </p>
        {nearExpiry && (
          <p className="text-[11px] text-secondary/80">{daysLeft}j restants</p>
        )}
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </td>
      <td className="px-3 py-3.5">
        <LeaseRowActions
          lease={lease}
          onViewDetails={onClick}
          onTerminate={onTerminate}
          onDownload={onDownload}
        />
      </td>
    </tr>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  meta,
  onPage,
}: {
  meta: PaginationMeta;
  onPage: (p: number) => void;
}) {
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border-custom bg-surface shrink-0">
      <p className="text-[12px] text-primary/40 tabular-nums">
        {from}–{to} sur {total} contrat{total > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-3 text-[13px] font-medium text-primary tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Status filter pills ──────────────────────────────────────────────────────

const FILTER_OPTIONS: { value: LeaseStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "ARCHIVED", label: "Archivé" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "EXPIRED", label: "Expiré" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "TERMINATED", label: "Clôturé" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

export function LeasesClient() {
  const { toast } = useToast();

  const [leases, setLeases] = useState<Lease[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<LeaseStatus | "all">("all");
  const [selected, setSelected] = useState<Lease | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lease | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<Lease | null>(null);
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaseService.getAll({
        page,
        limit: PAGE_LIMIT,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedQ || undefined,
      });
      // Normalise la réponse : gère les cas { data: [...] } et { data: { items: [...] } }
      const list: Lease[] = Array.isArray(res.data)
        ? res.data
        : ((res as unknown as { data: { data: Lease[] } }).data?.data ?? []);
      const meta =
        res.meta ??
        (res as unknown as { pagination: typeof res.meta }).pagination ??
        null;
      setLeases(list);
      setPagination(meta);

      // Warning toast — affiché une seule fois par session de page
      if (!toastShown) {
        const expiring = list.filter((l) => {
          if (l.status !== "ACTIVE") return false;
          if (!l.endDate) return false;
          const d = daysUntil(l.endDate);
          return d >= 0 && d <= 30;
        });
        if (expiring.length > 0) {
          toast({
            variant: "warning",
            title: `${expiring.length} contrat${expiring.length > 1 ? "s" : ""} expire${expiring.length > 1 ? "nt" : ""} bientôt`,
            description: `${expiring.length > 1 ? `${expiring.length} baux expirent` : `${expiring[0].tenant?.fullName ?? "Un bail"} expire`} dans moins de 30 jours.`,
            duration: 8000,
          });
          setToastShown(true);
        }
      }
    } catch {
      setError("Impossible de charger les contrats.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(l: Lease) {
    setLeases((prev) => {
      const idx = prev.findIndex((x) => x.id === l.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = l;
        return n;
      }
      return [l, ...prev];
    });
    if (selected?.id === l.id) setSelected(l);
    setFormOpen(false);
    setEditTarget(null);
    load();
  }

  function handleTerminated(l: Lease) {
    setLeases((prev) => prev.map((x) => (x.id === l.id ? l : x)));
    if (selected?.id === l.id) setSelected(l);
    setTerminateTarget(null);
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-custom shrink-0">
            <div>
              <h1 className="font-semibold text-[20px] text-primary">
                Contrats de bail
              </h1>
              {pagination && !loading && (
                <p className="text-[12px] text-primary/40 mt-0.5">
                  {pagination.total} contrat{pagination.total > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35 pointer-events-none"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="pl-9 pr-4 h-9 w-48 rounded-lg border border-border-custom bg-white text-[13px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors"
              >
                <Plus size={15} /> Nouveau contrat
              </button>
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-border-custom bg-surface shrink-0 overflow-x-auto">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap
                  ${
                    statusFilter === opt.value
                      ? "bg-primary text-white"
                      : "bg-primary/6 text-primary/60 hover:bg-primary/10 hover:text-primary"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger shrink-0">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={22} className="animate-spin text-primary/30" />
              </div>
            ) : leases.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={FileText}
                  title="Aucun contrat"
                  description={
                    statusFilter !== "all"
                      ? "Aucun contrat pour ce statut."
                      : "Créez votre premier contrat de bail."
                  }
                  actionLabel={
                    statusFilter === "all" ? "Nouveau contrat" : undefined
                  }
                  onAction={
                    statusFilter === "all"
                      ? () => {
                          setEditTarget(null);
                          setFormOpen(true);
                        }
                      : undefined
                  }
                />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-neutral">
                  <tr className="border-b border-border-custom">
                    {[
                      "Locataire / Local",
                      "Loyer",
                      "Frequence",
                      "Debut",
                      "Fin",
                      "Statut",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom bg-surface">
                  {leases.map((l) => (
                    <LeaseRow
                      key={l.id}
                      lease={l}
                      selected={selected?.id === l.id}
                      onClick={() =>
                        setSelected((p) => (p?.id === l.id ? null : l))
                      }
                      onTerminate={() => setTerminateTarget(l)}
                      onDownload={() => {
                        toast({
                          variant: "warning",
                          title: "Telechargement en cours...",
                          duration: 3000,
                        });
                        leaseService
                          .downloadContractPdf(l.id)
                          .then((blob) => {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `contrat-${l.id}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          })
                          .catch(() =>
                            toast({
                              variant: "danger",
                              title: "Echec du telechargement",
                              duration: 4000,
                            }),
                          );
                      }}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <PaginationBar meta={pagination} onPage={setPage} />
          )}
        </div>

        {selected && (
          <LeaseDetailPanel
            lease={selected}
            onClose={() => setSelected(null)}
            onEdit={(l) => {
              setEditTarget(l);
              setFormOpen(true);
            }}
            onTerminate={(l) => setTerminateTarget(l)}
            onUpdated={handleSaved}
          />
        )}
      </div>

      <LeaseFormModal
        isOpen={formOpen}
        lease={editTarget}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
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
