"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  Users,
  AlertTriangle,
} from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import type {
  AnnualPerformanceReport,
  OutstandingBalancesReport,
  TenantPerformanceReport,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("fr-FR");

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function formatAmount(n: number) {
  return `${fmt.format(n)} XOF`;
}

function pct(n: number) {
  // API renvoie déjà en pourcentage (ex: 29.63), pas en décimal (0.2963)
  return `${n.toFixed(1)} %`;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color = "primary",
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: "primary" | "success" | "danger" | "secondary";
}) {
  const colorMap = {
    primary: "bg-primary/8 text-primary/60",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    secondary: "bg-secondary/10 text-secondary",
  };
  return (
    <div className="bg-surface border border-border-custom rounded-xl p-5">
      <div className="mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}
        >
          <Icon size={16} aria-hidden="true" />
        </div>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40 mb-1">
        {title}
      </p>
      <p className="text-[22px] font-bold text-primary tabular-nums leading-tight">
        {value}
      </p>
      {sub && <p className="text-[12px] text-primary/40 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function MonthlyBarChart({ report }: { report: AnnualPerformanceReport }) {
  const currentMonth = new Date().getMonth(); // 0-indexed
  const maxRevenue = Math.max(...report.months.map((b) => b.paidAmount), 1);

  return (
    <div className="bg-surface border border-border-custom rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-primary">
            Revenus encaissés — {report.year}
          </h3>
          <p className="text-[12px] text-primary/40 mt-0.5">
            Total : {formatAmount(report.totals.paidAmount)} / attendus{" "}
            {formatAmount(report.totals.expectedAmount)}
          </p>
        </div>
        <BarChart3 size={16} className="text-primary/30" />
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {MONTH_LABELS.map((label, i) => {
          const bar = report.months.find((b) => b.month === i + 1);
          const revenue = bar?.paidAmount ?? 0;
          const heightPct = (revenue / maxRevenue) * 100;
          const isCurrent = i === currentMonth;
          return (
            <div
              key={label}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div className="relative w-full flex items-end h-24">
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isCurrent
                      ? "bg-secondary"
                      : "bg-secondary/30 group-hover:bg-secondary/50"
                  }`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                  title={`${label} : ${formatAmount(revenue)}`}
                />
              </div>
              <span
                className={`text-[10px] ${
                  isCurrent ? "text-secondary font-semibold" : "text-primary/30"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Outstanding balances table ───────────────────────────────────────────────

function OutstandingTable({ report }: { report: OutstandingBalancesReport }) {
  return (
    <div className="bg-surface border border-border-custom rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
        <div>
          <h3 className="text-[14px] font-semibold text-primary">
            Soldes impayés
          </h3>
          <p className="text-[12px] text-primary/40 mt-0.5">
            {report.totalOutstandingSchedules} échéance
            {report.totalOutstandingSchedules > 1 ? "s" : ""} · Total :{" "}
            {formatAmount(report.totalOutstandingAmount)}
          </p>
        </div>
        <AlertCircle size={16} className="text-danger" />
      </div>
      {report.tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-primary/30">
          <TrendingUp size={28} className="mb-2 text-success/60" />
          <p className="text-[13px]">Aucun impayé — tout est à jour !</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-custom bg-neutral">
                {[
                  "Locataire",
                  "Bien / Local",
                  "1re échéance",
                  "Nbre éch.",
                  "Montant dû",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {report.tenants.map((t) => (
                <tr key={t.tenantId} className="hover:bg-primary/2">
                  <td className="px-4 py-3 text-[13px] font-medium text-primary">
                    {t.tenantName}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-primary/60">
                    {t.propertyName} · {t.unitNumber}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-primary/50">
                    {new Date(t.oldestDueDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-danger font-medium tabular-nums">
                    {t.schedulesCount}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-danger tabular-nums whitespace-nowrap">
                    {formatAmount(t.outstandingAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tenant performance table ─────────────────────────────────────────────────

const CLASSIFICATION_LABELS: Record<string, { label: string; color: string }> =
  {
    EXCELLENT: { label: "Excellent", color: "text-success" },
    BON: { label: "Bon", color: "text-success" },
    MOYEN: { label: "Moyen", color: "text-secondary" },
    A_RISQUE: { label: "À risque", color: "text-danger" },
  };

function TenantPerformanceTable({ data }: { data: TenantPerformanceReport[] }) {
  return (
    <div className="bg-surface border border-border-custom rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
        <h3 className="text-[14px] font-semibold text-primary">
          Performance des locataires
        </h3>
        <Users size={16} className="text-primary/30" />
      </div>
      {data.length === 0 ? (
        <p className="text-[13px] text-primary/40 text-center py-8">
          Aucune donnée.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-custom bg-neutral">
                {[
                  "Locataire",
                  "Bien / Local",
                  "Payé",
                  "Attendu",
                  "Taux recouvrement",
                  "Classification",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {data.map((t) => {
                const cls = CLASSIFICATION_LABELS[t.classification] ?? {
                  label: t.classification,
                  color: "text-primary/60",
                };
                return (
                  <tr
                    key={t.tenantId + t.leaseId}
                    className="hover:bg-primary/2"
                  >
                    <td className="px-4 py-3 text-[13px] font-medium text-primary">
                      {t.tenantName}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-primary/60">
                      {t.propertyName} · {t.unitNumber}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-primary/70 tabular-nums whitespace-nowrap">
                      {formatAmount(t.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-primary/60 tabular-nums whitespace-nowrap">
                      {formatAmount(t.expectedAmount)}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold tabular-nums text-primary/70">
                      {pct(t.recoveryRate)}
                    </td>
                    <td
                      className={`px-4 py-3 text-[12px] font-semibold ${cls.color}`}
                    >
                      {cls.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReportsClient() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [annual, setAnnual] = useState<AnnualPerformanceReport | null>(null);
  const [outstanding, setOutstanding] =
    useState<OutstandingBalancesReport | null>(null);
  const [tenantPerf, setTenantPerf] = useState<TenantPerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [annualRes, outstandingRes, tenantRes] = await Promise.allSettled([
        reportService.getAnnualPerformance({ year }),
        reportService.getOutstandingBalances(),
        reportService.getTenantPerformance({ period: "annual" }),
      ]);
      if (annualRes.status === "fulfilled") setAnnual(annualRes.value.data);
      if (outstandingRes.status === "fulfilled")
        setOutstanding(outstandingRes.value.data);
      if (tenantRes.status === "fulfilled")
        setTenantPerf(tenantRes.value.data ?? []);
      if (
        annualRes.status === "rejected" &&
        outstandingRes.status === "rejected" &&
        tenantRes.status === "rejected"
      ) {
        setError("Impossible de charger les rapports.");
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const blob = await reportService.downloadFullPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-Estate Mangement-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencieux
    } finally {
      setDownloading(false);
    }
  }

  const recoveryColor = !annual
    ? "primary"
    : annual.totals.recoveryRate >= 90
      ? "success"
      : annual.totals.recoveryRate >= 70
        ? "secondary"
        : "danger";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-custom shrink-0">
        <div>
          <h1 className="font-semibold text-[20px] text-primary">Rapports</h1>
          <p className="text-[12px] text-primary/40 mt-0.5">
            Analyse de performance — {year}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-border-custom bg-white text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-custom text-primary/50 hover:text-primary hover:bg-primary/4 disabled:opacity-50 transition-colors"
            aria-label="Actualiser"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || loading}
            className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] disabled:opacity-60 transition-colors"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary/30" />
          </div>
        ) : (
          <>
            {annual && (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                  title="Revenus encaissés"
                  value={formatAmount(annual.totals.paidAmount)}
                  sub={`Attendus : ${formatAmount(annual.totals.expectedAmount)}`}
                  icon={BarChart3}
                  color="primary"
                />
                <KpiCard
                  title="Taux de recouvrement"
                  value={pct(annual.totals.recoveryRate)}
                  sub={`Paiements à temps : ${pct(annual.totals.onTimeRate)}`}
                  icon={TrendingUp}
                  color={
                    recoveryColor as
                      | "primary"
                      | "success"
                      | "danger"
                      | "secondary"
                  }
                />
                <KpiCard
                  title="Impayés cumulés"
                  value={formatAmount(annual.totals.outstandingAmount)}
                  sub={`${annual.totals.unpaidCount} échéance${annual.totals.unpaidCount > 1 ? "s" : ""} impayée${annual.totals.unpaidCount > 1 ? "s" : ""}`}
                  icon={
                    annual.totals.outstandingAmount > 0
                      ? TrendingDown
                      : TrendingUp
                  }
                  color={
                    annual.totals.outstandingAmount > 0 ? "danger" : "success"
                  }
                />
                <KpiCard
                  title="Soldes impayés"
                  value={
                    outstanding
                      ? formatAmount(outstanding.totalOutstandingAmount)
                      : "—"
                  }
                  sub={
                    outstanding
                      ? `${outstanding.tenants.length} locataire${outstanding.tenants.length > 1 ? "s" : ""} concerné${outstanding.tenants.length > 1 ? "s" : ""}`
                      : undefined
                  }
                  icon={AlertCircle}
                  color={
                    !outstanding || outstanding.totalOutstandingAmount === 0
                      ? "success"
                      : "danger"
                  }
                />
              </div>
            )}

            {annual && <MonthlyBarChart report={annual} />}
            {outstanding && <OutstandingTable report={outstanding} />}
            {tenantPerf.length > 0 && (
              <TenantPerformanceTable data={tenantPerf} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
