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
      <div className="flex items-start justify-between px-6 py-4 bg-surface border-b border-border-custom shrink-0">
        <div>
          <h1 className="font-semibold text-[20px] text-primary">
            Ajustements
          </h1>
          {!loading && (
            <p className="text-[12px] text-primary/40 mt-0.5">
              {total} ajustement{total > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors">
          <Plus size={15} /> Nouvel ajustement
        </button>
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
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${typeFilter === f.value ? "bg-primary text-white" : "bg-primary/6 text-primary/60 hover:bg-primary/10"}`}
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
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger shrink-0">
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
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-neutral">
              <tr className="border-b border-border-custom">
                {[
                  "Date",
                  "Type",
                  "Libelle",
                  "Echeance liee",
                  "Montant",
                  "Raison",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
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
                  className="hover:bg-primary/3 transition-colors duration-100"
                >
                  <td className="px-4 py-3 text-[13px] tabular-nums text-primary/60 whitespace-nowrap">
                    {formatDate(a.appliedDate)}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={a.type} />
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-primary max-w-45 truncate">
                    {a.label || a.reason}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-primary/50">
                    {a.scheduleId ? `#${a.scheduleId.slice(-6)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AmountCell type={a.type} amount={a.amount} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-primary/50 max-w-40 truncate">
                    {a.reason}
                  </td>
                  <td className="px-3 py-3">
                    <RowActions adj={a} onDeleted={load} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-custom bg-surface shrink-0">
          <p className="text-[12px] text-primary/40 tabular-nums">
            {(page - 1) * PAGE_LIMIT + 1}–
            {Math.min(page * PAGE_LIMIT, pagination.total)} sur{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 text-[13px] font-medium text-primary tabular-nums">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
