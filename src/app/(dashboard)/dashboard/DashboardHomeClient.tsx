"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  DoorOpen,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Plus,
  CreditCard,
  UserPlus,
  Users,
  ChevronRight,
} from "lucide-react";
import { propertyService } from "@/lib/services/property.service";
import { unitService } from "@/lib/services/unit.service";
import { leaseService } from "@/lib/services/lease.service";
import { reportService } from "@/lib/services/report.service";
import { paymentService } from "@/lib/services/payment.service";
import { rentScheduleService } from "@/lib/services/rent-schedule.service";
import type {
  MonthlyPerformanceReport,
  AnnualPerformanceReport,
  Lease,
  Payment,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  "Jan","Fév","Mar","Avr","Mai","Jui",
  "Jul","Aoû","Sep","Oct","Nov","Déc",
];

function formatXOF(n: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n) + " FCFA"
  );
}

function daysUntil(d: string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function currentFrDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  loading?: boolean;
  accent?: "default" | "success" | "warning" | "danger";
};

function KpiCard({ label, value, sub, icon, loading, accent = "default" }: KpiCardProps) {
  const cls = {
    default: "bg-primary/6 text-primary/50",
    success:  "bg-success/10 text-success",
    warning:  "bg-secondary/10 text-secondary",
    danger:   "bg-danger/10 text-danger",
  }[accent];
  return (
    <div className="bg-surface rounded-xl border border-border-custom p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls}`}>
          {icon}
        </div>
        <ArrowUpRight size={14} className="text-primary/25" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-3/4 bg-primary/8 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-primary/5 rounded animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="font-semibold text-[28px] text-primary tracking-tight tabular-nums leading-none">
            {value}
          </p>
          {sub && <p className="mt-1 text-[12px] text-primary/45">{sub}</p>}
        </div>
      )}
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-primary/40">
        {label}
      </p>
    </div>
  );
}

// ─── Revenue Chart ─────────────────────────────────────────────────────────────

function RevenueChart({ annual, loading }: { annual: AnnualPerformanceReport | null; loading: boolean }) {
  const W = 560, H = 200, PAD = { top: 12, right: 8, bottom: 36, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const months = annual?.months ?? [];
  const maxVal = loading ? 1 : Math.max(...months.map((m) => m.paidAmount), 1);
  const barW = (innerW / 12) * 0.55;
  const gap = innerW / 12;
  const now = new Date();
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));
  return (
    <div className="bg-surface rounded-xl border border-border-custom p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-[16px] text-primary">Revenus mensuels</h2>
          <p className="text-[12px] text-primary/40" suppressHydrationWarning>{now.getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-secondary inline-block" />
          <span className="text-[12px] text-primary/50">Revenus encaissés</span>
        </div>
      </div>
      {loading ? (
        <div className="h-50 flex items-end gap-1 px-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 bg-primary/6 rounded-t animate-pulse" style={{ height: `${30 + ((i * 7) % 60)}%` }} />
          ))}
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="Graphique des revenus mensuels" suppressHydrationWarning>
          {ticks.map((tick, index) => {
            const y = PAD.top + innerH - (tick / maxVal) * innerH;
            return (
              <g key={index}>
                <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#1E2A38" opacity="0.35">
                  {tick >= 1_000_000 ? `${(tick / 1_000_000).toFixed(1)}M` : tick >= 1_000 ? `${(tick / 1_000).toFixed(0)}k` : tick}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const val = months.find((m) => m.month === i + 1)?.paidAmount ?? 0;
            const barH = val > 0 ? Math.max((val / maxVal) * innerH, 4) : 0;
            const x = PAD.left + i * gap + (gap - barW) / 2;
            const y = PAD.top + innerH - barH;
            const isCurrent = i + 1 === now.getMonth() + 1;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx="3" ry="3" fill={isCurrent ? "#D4A373" : "#D4A37366"} />
                <text x={x + barW / 2} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="10"
                  fill={isCurrent ? "#1E2A38" : "#1E2A3855"} fontWeight={isCurrent ? "600" : "400"}>
                  {MONTHS_FR[i]}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

// ─── Alert Item (baux expirant) ────────────────────────────────────────────────

function AlertItem({ lease }: { lease: Lease }) {
  const days = daysUntil(lease.endDate!);
  const urgent = days <= 14;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-custom last:border-0">
      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${urgent ? "bg-danger/10" : "bg-secondary/10"}`}>
        <Clock size={14} className={urgent ? "text-danger" : "text-secondary"} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-primary truncate">
          {lease.tenant?.fullName ?? lease.tenantId}
        </p>
        <p className="text-[12px] text-primary/45">
          Local {lease.unit?.unitNumber ?? lease.unitId} · expire dans{" "}
          <span className={`font-semibold ${urgent ? "text-danger" : "text-secondary"}`}>
            {days} jour{days > 1 ? "s" : ""}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Payment status badge ──────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; dot: string }> = {
    RECORDED:  { label: "Payé",     bg: "bg-success/10",   dot: "bg-success" },
    CANCELLED: { label: "Annulé",   bg: "bg-danger/10",    dot: "bg-danger" },
    REVERSED:  { label: "Inversé",  bg: "bg-primary/8",    dot: "bg-primary/30" },
    failed:    { label: "Échoué",   bg: "bg-danger/10",    dot: "bg-danger" },
  };
  const c = cfg[status] ?? { label: status, bg: "bg-primary/8", dot: "bg-primary/30" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
      {c.label}
    </span>
  );
}

// ─── Overdue tenant item ───────────────────────────────────────────────────────

type OverdueItem = {
  tenantId: string;
  tenantName: string;
  unitLabel: string;
  overdueMonths: number;
};

function OverdueTenantItem({ item }: { item: OverdueItem }) {
  const urgency = item.overdueMonths >= 3 ? "text-danger" : item.overdueMonths >= 2 ? "text-secondary" : "text-primary/50";
  const avatarBg = item.overdueMonths >= 3 ? "bg-danger" : item.overdueMonths >= 2 ? "bg-secondary" : "bg-primary/60";
  const initials = item.tenantName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${avatarBg}`}>
        <span className="text-[12px] font-bold text-white">{initials}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white truncate">{item.tenantName}</p>
        <p className="text-[11px] text-white/60 truncate">{item.unitLabel}</p>
        <p className={`text-[11px] font-medium ${urgency === "text-danger" ? "text-red-200" : urgency === "text-secondary" ? "text-orange-200" : "text-white/50"}`}>
          {item.overdueMonths} mois de retard
        </p>
      </div>
      <Link
        href={`/dashboard/tenants/${item.tenantId}`}
        className="shrink-0 text-[12px] font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
      >
        Relancer
      </Link>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type DashData = {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  monthly: MonthlyPerformanceReport | null;
  annual: AnnualPerformanceReport | null;
  expiringLeases: Lease[];
  recentPayments: Payment[];
  overdueItems: OverdueItem[];
};

const INITIAL: DashData = {
  totalProperties: 0,
  totalUnits: 0,
  occupiedUnits: 0,
  monthly: null,
  annual: null,
  expiringLeases: [],
  recentPayments: [],
  overdueItems: [],
};

export function DashboardHomeClient() {
  const [data, setData] = useState<DashData>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientDate, setClientDate] = useState<string | null>(null);
  const [clientTime, setClientTime] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setClientDate(currentFrDate());
    setClientTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const [
        propertiesRes,
        allUnitsRes,
        occupiedRes,
        monthlyRes,
        annualRes,
        leasesRes,
        paymentsRes,
        overdueSchRes,
      ] = await Promise.allSettled([
        propertyService.getAll({ limit: 1 }),
        unitService.getAll({ limit: 1 }),
        unitService.getAll({ status: "OCCUPIED", limit: 1 }),
        reportService.getMonthlyPerformance({ month: now.getMonth() + 1, year: now.getFullYear() }),
        reportService.getAnnualPerformance({ year: now.getFullYear() }),
        leaseService.getAll({ limit: 100 }),
        paymentService.getAll({ limit: 5 }),
        rentScheduleService.getAll({ status: "OVERDUE", limit: 50 }),
      ]);

      const allLeases =
        leasesRes.status === "fulfilled"
          ? Array.isArray(leasesRes.value.data) ? leasesRes.value.data : []
          : [];

      const expiring = allLeases
        .filter((l) => {
          if (!l.endDate) return false;
          const d = daysUntil(l.endDate);
          return d >= 0 && d <= 45;
        })
        .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime());

      // Recent payments
      const recentPayments =
        paymentsRes.status === "fulfilled"
          ? Array.isArray(paymentsRes.value.data) ? paymentsRes.value.data : []
          : [];

      // Overdue items: group schedules by leaseId, cross-ref with leases
      const overdueItems: OverdueItem[] = [];
      if (overdueSchRes.status === "fulfilled") {
        const schedules = Array.isArray(overdueSchRes.value.data) ? overdueSchRes.value.data : [];
        const countByLease: Record<string, number> = {};
        for (const s of schedules) {
          countByLease[s.leaseId] = (countByLease[s.leaseId] ?? 0) + 1;
        }
        const seen = new Set<string>();
        for (const [leaseId, count] of Object.entries(countByLease)) {
          const lease = allLeases.find((l) => l.id === leaseId);
          if (!lease || !lease.tenant) continue;
          const tenantId = lease.tenantId;
          if (seen.has(tenantId)) continue;
          seen.add(tenantId);
          overdueItems.push({
            tenantId,
            tenantName: lease.tenant.fullName || `${lease.tenant.firstName ?? ""} ${lease.tenant.lastName ?? ""}`.trim() || "—",
            unitLabel: lease.unit
              ? `${lease.unit.property?.name ? `${lease.unit.property.name} – ` : ""}Unité ${lease.unit.unitNumber}`
              : `Bail ${leaseId.slice(-6)}`,
            overdueMonths: count,
          });
        }
        overdueItems.sort((a, b) => b.overdueMonths - a.overdueMonths);
      }

      setData({
        totalProperties:
          propertiesRes.status === "fulfilled"
            ? (propertiesRes.value.meta?.total ?? propertiesRes.value.data?.length ?? 0) : 0,
        totalUnits:
          allUnitsRes.status === "fulfilled"
            ? (allUnitsRes.value.meta?.total ?? allUnitsRes.value.data?.length ?? 0) : 0,
        occupiedUnits:
          occupiedRes.status === "fulfilled"
            ? (occupiedRes.value.meta?.total ?? occupiedRes.value.data?.length ?? 0) : 0,
        monthly:   monthlyRes.status === "fulfilled" ? (monthlyRes.value.data ?? null) : null,
        annual:    annualRes.status === "fulfilled"  ? (annualRes.value.data  ?? null) : null,
        expiringLeases: expiring,
        recentPayments,
        overdueItems,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const occupancyRate = data.totalUnits > 0 ? Math.round((data.occupiedUnits / data.totalUnits) * 100) : 0;
  const monthly = data.monthly;
  const now = new Date();

  return (
    <div className="p-8 space-y-8 max-w-300">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-[24px] text-primary tracking-tight">
            Tableau de bord
          </h1>
          {clientDate && (
            <p className="text-[13px] text-primary/40 mt-0.5 capitalize">{clientDate}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Shortcut buttons */}
          <Link
            href="/dashboard/payments"
            className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors"
          >
            <CreditCard size={14} /> Enregistrer un paiement
          </Link>
          <Link
            href="/dashboard/tenants"
            className="flex items-center gap-2 h-9 px-4 border border-border-custom rounded-lg text-[13px] font-medium text-primary hover:bg-primary/4 transition-colors"
          >
            <UserPlus size={14} /> Nouveau locataire
          </Link>
          {/* Refresh */}
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-custom text-[13px] text-primary/60 hover:text-primary hover:border-primary/30 bg-surface transition-colors disabled:opacity-40"
            aria-label="Rafraîchir"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger">
          <AlertTriangle size={15} aria-hidden="true" />
          {error}
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Biens immobiliers"
          value={loading ? "—" : String(data.totalProperties)}
          sub={loading ? undefined : `${data.totalUnits} local${data.totalUnits > 1 ? "aux" : ""} au total`}
          icon={<Building2 size={18} aria-hidden="true" />}
          loading={loading}
        />
        <KpiCard
          label="Taux d'occupation"
          value={loading ? "—" : `${occupancyRate} %`}
          sub={loading ? undefined : `${data.occupiedUnits} / ${data.totalUnits} locaux occupés`}
          icon={<DoorOpen size={18} aria-hidden="true" />}
          loading={loading}
          accent={occupancyRate >= 75 ? "success" : occupancyRate >= 50 ? "warning" : "danger"}
        />
        <KpiCard
          label="Revenus du mois"
          value={loading || !monthly?.totals ? "—" : formatXOF(monthly.totals.paidAmount)}
          sub={monthly?.totals ? `Attendu : ${formatXOF(monthly.totals.expectedAmount)}` : undefined}
          icon={<Wallet size={18} aria-hidden="true" />}
          loading={loading}
          accent="success"
        />
        <KpiCard
          label="Taux de recouvrement"
          value={loading || !monthly?.totals ? "—" : `${Math.round(monthly.totals.recoveryRate)} %`}
          sub={monthly?.totals ? `${monthly.totals.onTimeCount} éch. à temps · ${monthly.totals.overdueCount} en retard` : undefined}
          icon={<TrendingUp size={18} aria-hidden="true" />}
          loading={loading}
          accent={monthly?.totals && monthly.totals.recoveryRate >= 80 ? "success" : monthly?.totals && monthly.totals.recoveryRate >= 50 ? "warning" : "danger"}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <RevenueChart annual={data.annual} loading={loading} />

        {/* Baux expirant bientôt */}
        <div className="bg-surface rounded-xl border border-border-custom p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-secondary" aria-hidden="true" />
            <h2 className="font-semibold text-[16px] text-primary">Baux expirant bientôt</h2>
            {!loading && data.expiringLeases.length > 0 && (
              <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                {data.expiringLeases.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/6 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-primary/8 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-primary/5 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.expiringLeases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-success" aria-hidden="true" />
              </div>
              <p className="text-[13px] font-medium text-primary">Tout est en ordre</p>
              <p className="text-[12px] text-primary/40 mt-1">
                Aucun bail n&apos;expire dans les 45 prochains jours.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {data.expiringLeases.map((lease) => (
                <AlertItem key={lease.id} lease={lease} />
              ))}
            </div>
          )}
          {!loading && data.expiringLeases.length > 0 && (
            <Link href="/dashboard/leases" className="mt-4 text-center text-[12px] font-medium text-secondary hover:underline block">
              Voir tous les contrats →
            </Link>
          )}
        </div>
      </div>

      {/* ── Bottom row: Paiements récents + Locataires en retard ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

        {/* Paiements récents */}
        <div className="bg-surface rounded-xl border border-border-custom overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
            <h2 className="font-semibold text-[16px] text-primary">Paiements récents</h2>
            <Link
              href="/dashboard/payments"
              className="flex items-center gap-1 text-[12px] font-medium text-secondary hover:underline"
            >
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border-custom">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="h-3 w-16 bg-primary/6 rounded animate-pulse shrink-0" />
                  <div className="h-3 flex-1 bg-primary/8 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-primary/6 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-primary/5 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : data.recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <CreditCard size={28} className="text-primary/15 mb-3" />
              <p className="text-[13px] text-primary/40">Aucun paiement enregistré.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-neutral">
                <tr className="border-b border-border-custom">
                  {["Date", "Locataire", "Montant", "Mois concerné", "Méthode", "Statut"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {data.recentPayments.map((p) => {
                  const tenantName = (
                    p.lease?.tenant?.fullName ||
                    `${p.lease?.tenant?.firstName ?? ""} ${p.lease?.tenant?.lastName ?? ""}`.trim()
                  ) || "—";
                  const date = p.paymentDate ? formatShortDate(p.paymentDate) : "—";
                  const moisConcerne = p.paymentDate ? formatMonthYear(p.paymentDate) : "—";
                  return (
                    <tr key={p.id} className="hover:bg-primary/2 transition-colors">
                      <td className="px-5 py-3.5 text-[12px] text-primary/50 tabular-nums whitespace-nowrap align-top">
                        {date}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-medium text-primary">{tenantName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-primary tabular-nums whitespace-nowrap">
                        {formatXOF(Number(p.amount))}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-secondary font-medium whitespace-nowrap">
                        {moisConcerne}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-primary/60">
                        {p.paymentMethod ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Locataires en retard */}
        <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #E8735A 0%, #D4604A 100%)" }}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white/80" />
              <h2 className="font-semibold text-[16px] text-white">Locataires en retard</h2>
              {!loading && data.overdueItems.length > 0 && (
                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {data.overdueItems.length}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-white/20 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/20 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-white/15 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data.overdueItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-3">
                  <TrendingUp size={18} className="text-white/70" />
                </div>
                <p className="text-[13px] font-medium text-white/90">Aucun retard en cours</p>
                <p className="text-[12px] text-white/50 mt-1">Tous les locataires sont à jour.</p>
              </div>
            ) : (
              <div>
                {data.overdueItems.map((item) => (
                  <OverdueTenantItem key={item.tenantId} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {clientTime && (
        <p className="text-[11px] text-primary/30 text-right">
          Données pour {MONTHS_FR[now.getMonth()]} {now.getFullYear()} · Actualisé à {clientTime}
        </p>
      )}
    </div>
  );
}
