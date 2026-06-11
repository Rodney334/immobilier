"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  AlertTriangle,
  Plus,
  MoreVertical,
} from "lucide-react";
import { rentScheduleService } from "@/lib/services/rent-schedule.service";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import type { RentSchedule, RentScheduleStatus, PaginationMeta } from "@/types";

const MONTHS_FR = [
  "Janv",
  "Fevr",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aout",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

function formatXOF(n?: number) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(n);
}
function fmtMonthYear(y: number, m: number) {
  return `${MONTHS_FR[m - 1]} ${y}`;
}
function formatDueDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

// Statuts exacts retournes par l'API (enum backend en MAJUSCULES)
const STATUS_CFG: Record<
  RentScheduleStatus,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "neutral" | "info";
    rowCls: string;
  }
> = {
  PAID: { label: "Paye", variant: "success", rowCls: "" },
  PARTIALLY_PAID: { label: "Partiel", variant: "warning", rowCls: "" },
  PENDING: { label: "En attente", variant: "neutral", rowCls: "" },
  OVERDUE: {
    label: "En retard",
    variant: "danger",
    rowCls: "bg-danger/6 border-l-2 border-l-danger/60",
  },
  CANCELLED: { label: "Annule", variant: "info", rowCls: "opacity-50" },
};

const FILTERS: { value: RentScheduleStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "PAID", label: "Paye" },
  { value: "PARTIALLY_PAID", label: "Partiel" },
  { value: "OVERDUE", label: "En retard" },
  { value: "PENDING", label: "En attente" },
  { value: "CANCELLED", label: "Annule" },
];

const PAGE_LIMIT = 20;

function RowActions({
  schedule,
  onRefresh,
}: {
  schedule: RentSchedule;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  async function handleRecalculate() {
    setOpen(false);
    try {
      await rentScheduleService.recalculate(schedule.id);
      toast({ variant: "success", title: "Recalcule" });
      onRefresh();
    } catch {
      toast({ variant: "danger", title: "Erreur recalcul" });
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
          <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]">
            <button
              onClick={handleRecalculate}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors"
            >
              Recalculer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryFooter({ schedules }: { schedules: RentSchedule[] }) {
  const totalDue = schedules.reduce((s, r) => s + (r.amountDue ?? r.amount), 0);
  const totalPaid = schedules.reduce(
    (s, r) => s + (r.amountPaid ?? r.paidAmount ?? 0),
    0,
  );
  const totalRem = schedules.reduce(
    (s, r) =>
      s +
      (r.balance ??
        r.remainingAmount ??
        (r.amountDue ?? r.amount) - (r.amountPaid ?? r.paidAmount ?? 0)),
    0,
  );
  const rate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
  const items = [
    {
      label: "Total du ce mois",
      val: `${formatXOF(totalDue)} FCFA`,
      cls: "text-primary",
    },
    {
      label: "Total encaisse",
      val: `${formatXOF(totalPaid)} FCFA`,
      cls: "text-success",
    },
    {
      label: "Reste a percevoir",
      val: `${formatXOF(totalRem)} FCFA`,
      cls: "text-danger",
    },
    {
      label: "Taux",
      val: `${rate} %`,
      cls:
        rate >= 80
          ? "text-success"
          : rate >= 50
            ? "text-secondary"
            : "text-danger",
    },
  ];
  return (
    <div className="shrink-0 border-t border-border-custom bg-white px-6 py-3 flex items-center gap-6 flex-wrap">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-6">
          <div className="text-[12px]">
            <span className="text-primary/40 uppercase tracking-wider font-medium">
              {item.label}
            </span>
            <p
              className={`tabular-nums font-semibold text-[14px] mt-0.5 ${item.cls}`}
            >
              {item.val}
            </p>
          </div>
          {i < items.length - 1 && (
            <div className="w-px h-8 bg-border-custom" />
          )}
        </div>
      ))}
    </div>
  );
}

export function SchedulesClient() {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState<RentScheduleStatus | "all">("all");
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rentScheduleService.getAll({
        page,
        limit: PAGE_LIMIT,
        month,
        year,
        status: status === "all" ? undefined : status,
      });
      setSchedules(Array.isArray(res.data) ? res.data : []);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les echeances.");
    } finally {
      setLoading(false);
    }
  }, [page, month, year, status]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [month, year, status]);

  async function handleMarkOverdue() {
    setMarking(true);
    try {
      const res = await rentScheduleService.markOverdue();
      const count = res.data?.updated ?? 0;
      toast({
        variant: "success",
        title: `${count} echeance${count > 1 ? "s" : ""} marquees en retard`,
      });
      load();
    } catch {
      toast({ variant: "danger", title: "Erreur lors du marquage" });
    } finally {
      setMarking(false);
    }
  }

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const stats = {
    paid: schedules.filter((s) => s.status === "PAID").length,
    partial: schedules.filter((s) => s.status === "PARTIALLY_PAID").length,
    overdue: schedules.filter((s) => s.status === "OVERDUE").length,
    cancelled: schedules.filter((s) => s.status === "CANCELLED").length,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-start justify-between px-6 py-4 bg-surface border-b border-border-custom shrink-0">
        <div>
          <h1 className="font-semibold text-[20px] text-primary">
            Echeances de loyer
          </h1>
          {!loading && (
            <p className="text-[12px] text-primary/40 mt-0.5">
              {fmtMonthYear(year, month)} · {schedules.length} echeances
              {stats.paid > 0 && ` · ${stats.paid} payees`}
              {stats.partial > 0 && ` · ${stats.partial} partielles`}
              {stats.overdue > 0 && ` · ${stats.overdue} en retard`}
              {stats.cancelled > 0 && ` · ${stats.cancelled} annulees`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkOverdue}
            disabled={marking}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-secondary text-secondary text-[13px] font-medium hover:bg-secondary/6 disabled:opacity-50 transition-colors"
          >
            {marking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Clock size={14} />
            )}
            Marquer les retards
          </button>
          <button className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors">
            <Plus size={15} /> Creer une echeance
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-6 py-3 border-b border-border-custom bg-surface shrink-0 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-border-custom rounded-lg px-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center text-primary/40 hover:text-primary transition-colors rounded"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[13px] font-medium text-primary px-2 min-w-25 text-center">
            {fmtMonthYear(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center text-primary/40 hover:text-primary transition-colors rounded"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${status === f.value ? "bg-primary text-white" : "bg-primary/6 text-primary/60 hover:bg-primary/10"}`}
            >
              {f.label}
            </button>
          ))}
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
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Clock size={32} className="text-primary/20 mb-3" />
            <p className="text-[14px] font-medium text-primary/50">
              Aucune echeance pour {fmtMonthYear(year, month)}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-neutral">
              <tr className="border-b border-border-custom">
                {[
                  "Echeance",
                  "Locataire",
                  "Local",
                  "Montant du",
                  "Paye",
                  "Solde",
                  "Statut",
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
            <tbody className="divide-y divide-border-custom">
              {schedules.map((s) => {
                const cfg = STATUS_CFG[s.status] ?? STATUS_CFG["PENDING"];
                const tenant = s.lease?.tenant;
                const unit = s.lease?.unit;
                const due = s.amountDue ?? s.amount;
                const paid = s.amountPaid ?? s.paidAmount ?? 0;
                const remain = s.balance ?? s.remainingAmount ?? due - paid;
                return (
                  <tr
                    key={s.id}
                    className={`transition-colors duration-100 hover:bg-primary/3 ${cfg.rowCls}`}
                  >
                    <td className="px-4 py-3 text-[13px] tabular-nums text-primary/80 whitespace-nowrap font-medium">
                      {formatDueDate(s.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-primary">
                      {tenant ? (
                        (tenant.fullName ??
                        `${tenant.firstName} ${tenant.lastName}`)
                      ) : (
                        <span className="text-primary/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-primary/70">
                      {unit ? (
                        unit.unitNumber
                      ) : (
                        <span className="text-primary/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] tabular-nums text-primary font-medium">
                      {formatXOF(due)}
                    </td>
                    <td className="px-4 py-3 text-[13px] tabular-nums text-primary/70">
                      {paid > 0 ? formatXOF(paid) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] tabular-nums">
                      {remain > 0 ? (
                        <span className="text-danger font-medium">
                          {formatXOF(remain)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <RowActions schedule={s} onRefresh={load} />
                    </td>
                  </tr>
                );
              })}
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

      {!loading && schedules.length > 0 && (
        <SummaryFooter schedules={schedules} />
      )}
    </div>
  );
}
