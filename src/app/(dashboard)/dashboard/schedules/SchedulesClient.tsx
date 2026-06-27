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

// L'API peut retourner des montants en string ("25000.00") — on force en number
function toNum(v?: number | string | null): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

function formatXOF(n?: number | string | null) {
  const num = toNum(n);
  if (num === 0 && n == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(num);
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

// ─── Mobile card ─────────────────────────────────────────────────────────────

function ScheduleCard({
  schedule,
  onRefresh,
}: {
  schedule: RentSchedule;
  onRefresh: () => void;
}) {
  const cfg = STATUS_CFG[schedule.status] ?? STATUS_CFG["PENDING"];
  const tenant = schedule.lease?.tenant;
  const tenantName = tenant
    ? (tenant.fullName ?? `${tenant.firstName} ${tenant.lastName}`)
    : null;
  const due = toNum(schedule.amountDue ?? schedule.amount);
  const paid = toNum(schedule.amountPaid ?? schedule.paidAmount);
  const remain = toNum(schedule.balance ?? schedule.remainingAmount ?? (due - paid));

  return (
    <div className={`bg-surface border border-border-custom rounded-xl p-4 transition-all duration-150 ${cfg.rowCls}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-primary truncate">
            {tenantName ?? formatDueDate(schedule.dueDate)}
          </p>
          <p className="text-[12px] text-primary/50">{formatDueDate(schedule.dueDate)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <RowActions schedule={schedule} onRefresh={onRefresh} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Montant dû</p>
          <p className="text-[12px] font-semibold text-primary tabular-nums">{formatXOF(due)} FCFA</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Payé</p>
          <p className="text-[12px] text-primary/70 tabular-nums">{paid > 0 ? `${formatXOF(paid)} FCFA` : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Solde</p>
          <p className={`text-[12px] font-medium tabular-nums ${remain > 0 ? "text-danger" : "text-primary/70"}`}>
            {remain > 0 ? `${formatXOF(remain)} FCFA` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Échéance</p>
          <p className="text-[12px] text-primary/70 tabular-nums">{formatDueDate(schedule.dueDate)}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryFooter({ schedules }: { schedules: RentSchedule[] }) {
  const totalDue = schedules.reduce((s, r) => s + toNum(r.amountDue ?? r.amount), 0);
  const totalPaid = schedules.reduce(
    (s, r) => s + toNum(r.amountPaid ?? r.paidAmount),
    0,
  );
  const totalRem = schedules.reduce((s, r) => {
    const due = toNum(r.amountDue ?? r.amount);
    const paid = toNum(r.amountPaid ?? r.paidAmount);
    return s + toNum(r.balance ?? r.remainingAmount ?? (due - paid));
  }, 0);
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
      <div className="ep-topbar" style={{ paddingBottom: 20 }}>
        <div>
          <p className="ep-eyebrow">Gestion locative</p>
          <h1 className="ep-page-title">Echeances de loyer</h1>
        </div>
        <div className="ep-topbar-actions">
          <button
            onClick={handleMarkOverdue}
            disabled={marking}
            className="ep-btn ep-btn-ghost"
          >
            {marking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Clock size={14} />
            )}
            Marquer les retards
          </button>
          {/* <button className="ep-btn ep-btn-primary">
            <Plus size={15} /> Creer une echeance
          </button> */}
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
              className="ep-chip"
              data-active={status === f.value ? "true" : "false"}
            >
              {f.label}
            </button>
          ))}
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
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Clock size={32} className="text-primary/20 mb-3" />
            <p className="text-[14px] font-medium text-primary/50">
              Aucune echeance pour {fmtMonthYear(year, month)}
            </p>
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
                        className="ep-th"
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
                    const due = toNum(s.amountDue ?? s.amount);
                    const paid = toNum(s.amountPaid ?? s.paidAmount);
                    const remain = toNum(s.balance ?? s.remainingAmount ?? (due - paid));
                    return (
                      <tr
                        key={s.id}
                        className={`ep-tr ${cfg.rowCls}`}
                      >
                        <td className="ep-td tabular-nums text-primary/80 whitespace-nowrap font-medium">
                          {formatDueDate(s.dueDate)}
                        </td>
                        <td className="ep-td text-primary">
                          {tenant ? (
                            (tenant.fullName ??
                            `${tenant.firstName} ${tenant.lastName}`)
                          ) : (
                            <span className="text-primary/30">—</span>
                          )}
                        </td>
                        <td className="ep-td text-primary/70">
                          {unit ? (
                            unit.unitNumber
                          ) : (
                            <span className="text-primary/30">—</span>
                          )}
                        </td>
                        <td className="ep-td ep-mono ep-amount">
                          {formatXOF(due)}
                        </td>
                        <td className="ep-td ep-mono tabular-nums text-primary/70">
                          {paid > 0 ? formatXOF(paid) : "—"}
                        </td>
                        <td className="ep-td ep-mono tabular-nums">
                          {remain > 0 ? (
                            <span className="text-danger font-medium">
                              {formatXOF(remain)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="ep-td">
                          <Badge variant={cfg.variant} stamp>{cfg.label}</Badge>
                        </td>
                        <td className="ep-td">
                          <RowActions schedule={s} onRefresh={load} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
            {/* Cards mobiles */}
            <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {schedules.map((s) => (
                <ScheduleCard key={s.id} schedule={s} onRefresh={load} />
              ))}
            </div>
          </>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="ep-pagination">
          <span>{(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, pagination.total)} sur {pagination.total} écheances</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button className="ep-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}><ChevronLeft size={13} /></button>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "0 8px" }}>Page {page} / {pagination.totalPages}</span>
            <button className="ep-page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}><ChevronRight size={13} /></button>
          </div>
        </div>
      )}

      {!loading && schedules.length > 0 && (
        <SummaryFooter schedules={schedules} />
      )}
    </div>
  );
}
