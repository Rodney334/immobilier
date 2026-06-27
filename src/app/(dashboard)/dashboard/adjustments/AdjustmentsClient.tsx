"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
} from "lucide-react";
import { adjustmentService } from "@/lib/services/adjustment.service";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Adjustment, AdjustmentType, PaginationMeta } from "@/types";

function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.abs(n));
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Types exacts retournes par l'API (enum backend en MAJUSCULES)
const TYPE_CFG: Record<
  AdjustmentType,
  { label: string; color: string; bg: string }
> = {
  DISCOUNT: { label: "Remise", color: "#2A9D8F", bg: "#2A9D8F1A" },
  PENALTY: { label: "Penalite", color: "#E76F51", bg: "#E76F511A" },
  CORRECTION: { label: "Correction", color: "#374151", bg: "#37415114" },
  RENT_REVISION: { label: "Loyer revise", color: "#D4A373", bg: "#D4A3731A" },
  WAIVER: { label: "Dispense", color: "#9CA3AF", bg: "#9CA3AF1A" },
};

function TypeBadge({ type }: { type: AdjustmentType }) {
  const cfg = TYPE_CFG[type] ?? {
    label: type,
    color: "#6B7280",
    bg: "#6B72801A",
  };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function AmountCell({
  type,
  amount,
}: {
  type: AdjustmentType;
  amount: number;
}) {
  const color =
    type === "DISCOUNT" || type === "WAIVER"
      ? "#2A9D8F"
      : type === "PENALTY"
        ? "#E76F51"
        : "#374151";
  const prefix = type === "PENALTY" ? "+" : type === "CORRECTION" ? "+/-" : "-";
  return (
    <span className="tabular-nums font-semibold text-[13px]" style={{ color }}>
      {prefix}
      {formatXOF(amount)} FCFA
    </span>
  );
}

const TYPE_FILTERS: { value: AdjustmentType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "DISCOUNT", label: "Remise" },
  { value: "PENALTY", label: "Penalite" },
  { value: "CORRECTION", label: "Correction" },
  { value: "RENT_REVISION", label: "Revision" },
  { value: "WAIVER", label: "Dispense" },
];

const PAGE_LIMIT = 20;

function RowActions({
  adj,
  onDeleted,
}: {
  adj: Adjustment;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  async function handleDelete() {
    setOpen(false);
    try {
      await adjustmentService.delete(adj.id);
      toast({ variant: "success", title: "Ajustement supprime" });
      onDeleted();
    } catch {
      toast({ variant: "danger", title: "Impossible de supprimer" });
    }
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded-md flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/6 transition-colors"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]">
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 hover:bg-danger/6 text-danger transition-colors"
            >
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function AdjustmentCard({
  adj,
  onDeleted,
}: {
  adj: Adjustment;
  onDeleted: () => void;
}) {
  return (
    <div className="bg-surface border border-border-custom rounded-xl p-4 transition-all duration-150">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-primary truncate">
            {adj.label || adj.reason || "—"}
          </p>
          <p className="text-[12px] text-primary/50 truncate">
            {/* {adj.scheduleId ? `#${adj.scheduleId.slice(-6)}` : "—"} */}
            {adj.lease ? `#${adj.lease.contractNumber}` : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TypeBadge type={adj.type} />
          <RowActions adj={adj} onDeleted={onDeleted} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Montant
          </p>
          <AmountCell type={adj.type} amount={adj.amount} />
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Date
          </p>
          <p className="text-[12px] text-primary/70 tabular-nums">
            {formatDate(adj.createdAt)}
          </p>
        </div>
        {adj.reason && (
          <div className="col-span-2">
            <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
              Raison
            </p>
            <p className="text-[12px] text-primary/70 truncate">{adj.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdjustmentsClient() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<AdjustmentType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adjustmentService.getAll({
        page,
        limit: PAGE_LIMIT,
        type: typeFilter === "all" ? undefined : typeFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setAdjustments(Array.isArray(res.data) ? res.data : []);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les ajustements.");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [typeFilter, dateFrom, dateTo]);

  const countByType: Partial<Record<AdjustmentType, number>> = {};
  adjustments.forEach((a) => {
    countByType[a.type] = (countByType[a.type] ?? 0) + 1;
  });
  const total = pagination?.total ?? adjustments.length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="ep-topbar" style={{ paddingBottom: 20 }}>
        <div>
          <p className="ep-eyebrow">Gestion locative</p>
          <h1 className="ep-page-title">Ajustements</h1>
        </div>
        <div className="ep-topbar-actions">
          <button className="ep-btn ep-btn-primary">
            <Plus size={15} /> Nouvel ajustement
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border-custom bg-surface shrink-0 space-y-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((f) => {
            const count =
              f.value !== "all" ? (countByType[f.value] ?? 0) : undefined;
            return (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className="ep-chip"
                data-active={typeFilter === f.value ? "true" : "false"}
              >
                {f.label}
                {count != null && count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-primary/40 font-medium uppercase tracking-wider">
            De
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border-custom text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          />
          <span className="text-[12px] text-primary/40 font-medium uppercase tracking-wider">
            A
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border-custom text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="text-[12px] text-primary/40 hover:text-primary transition-colors"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ margin: "0 32px 16px", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--rouge-soft)", border: "1px solid var(--rouge)", fontSize: 13, color: "var(--rouge)" }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={22} className="animate-spin text-primary/30" />
          </div>
        ) : adjustments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={SlidersHorizontal}
              title="Aucun ajustement"
              description="Aucun ajustement pour les filtres selectionnes."
            />
          </div>
        ) : (
          <>
            {/* Table desktop */}
            <div className="hidden lg:block px-4 lg:px-6 py-3">
              <div className="ep-panel">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border-custom">
                      {[
                        "Date",
                        "Type",
                        "Libelle",
                        "Contrat lié",
                        "Montant",
                        "Raison",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="ep-th"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom bg-surface">
                    {adjustments.map((a) => (
                      <tr
                        key={a.id}
                        className="ep-tr"
                      >
                        <td className="ep-td ep-mono tabular-nums text-primary/60 whitespace-nowrap">
                          {formatDate(a.createdAt)}
                        </td>
                        <td className="ep-td">
                          <TypeBadge type={a.type} />
                        </td>
                        <td className="ep-td font-medium text-primary max-w-45 truncate">
                          {a.label || a.reason}
                        </td>
                        <td className="ep-td text-primary/50">
                          {/* {a.scheduleId ? `#${a.scheduleId.slice(-6)}` : "—"} */}
                          {a.lease ? `#${a.lease.contractNumber}` : "—"}
                        </td>
                        <td className="ep-td">
                          <AmountCell type={a.type} amount={a.amount} />
                        </td>
                        <td className="ep-td text-primary/50 max-w-40 truncate">
                          {a.reason}
                        </td>
                        <td className="ep-td">
                          <RowActions adj={a} onDeleted={load} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Cards mobiles */}
            <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {adjustments.map((a) => (
                <AdjustmentCard key={a.id} adj={a} onDeleted={load} />
              ))}
            </div>
          </>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="ep-pagination">
          <span>{(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, pagination.total)} sur {pagination.total} ajustements</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button className="ep-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}><ChevronLeft size={13} /></button>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "0 8px" }}>Page {page} / {pagination.totalPages}</span>
            <button className="ep-page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}><ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
