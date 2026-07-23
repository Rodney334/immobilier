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
  FileText,
} from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import type {
  AnnualPerformanceReport,
  SemesterPerformanceReport,
  OutstandingBalancesReport,
  TenantPerformanceReport,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNum = new Intl.NumberFormat("fr-FR");

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function formatAmount(n: number) {
  return `${fmtNum.format(n)} FCFA`;
}

function pct(n: number) {
  return `${n.toFixed(1)} %`;
}

type PeriodMode = "year" | "semester";

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: {
  label: string; value: string; sub?: string; valueColor?: string;
}) {
  return (
    <div style={{
      background: "var(--paper-raised)",
      border: "1px solid var(--paper-line)",
      borderRadius: "var(--r-md)",
      padding: "14px 18px",
      boxShadow: "var(--shadow-card)",
    }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-soft)", marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: valueColor ?? "var(--ink)", lineHeight: 1.1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, marginTop: 4, color: "var(--ink-soft)" }}>{sub}</p>}
    </div>
  );
}

// ─── Period chip ──────────────────────────────────────────────────────────────

function PeriodChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={active ? "ep-chip active" : "ep-chip"}>
      {children}
    </button>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function PerformanceBarChart({
  report,
  periodMode,
  semester,
  periodLabel,
}: {
  report: AnnualPerformanceReport | SemesterPerformanceReport;
  periodMode: PeriodMode;
  semester: 1 | 2;
  periodLabel: string;
}) {
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  // En mode semestre, on ne montre que les 6 mois du semestre
  const semesterMonths = semester === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
  const months = periodMode === "semester"
    ? report.months.filter((m) => semesterMonths.includes(m.month))
    : report.months;

  const maxRevenue = Math.max(...months.map((b) => b.paidAmount), 1);

  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-card)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Revenus encaissés — {periodLabel}
          </p>
          <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
            Total : {formatAmount(report.totals.paidAmount)} · Attendus : {formatAmount(report.totals.expectedAmount)}
          </p>
        </div>
        <BarChart3 size={15} style={{ color: "var(--ink-soft)", opacity: 0.4, marginTop: 2 }} />
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        {[{ color: "#1D9E75", label: "Encaissé" }, { color: "var(--paper-line)", label: "Non encaissé" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 96 }}>
        {months.map((bar) => {
          const h = Math.max((bar.paidAmount / maxRevenue) * 80, bar.paidAmount > 0 ? 3 : 0);
          const isCurrent = bar.month === currentMonth;
          return (
            <div key={bar.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
                title={`${MONTH_LABELS[bar.month - 1]} : ${formatAmount(bar.paidAmount)}`}>
                <div style={{
                  width: "100%",
                  height: `${h}px`,
                  background: isCurrent ? "#E36B45" : "#1D9E75",
                  borderRadius: "3px 3px 0 0",
                  transition: "height 0.5s",
                  opacity: isCurrent ? 1 : 0.75,
                }} />
              </div>
              <span style={{ fontSize: 9, color: isCurrent ? "#E36B45" : "var(--ink-soft)", fontWeight: isCurrent ? 600 : 400 }}>
                {MONTH_LABELS[bar.month - 1]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Meilleurs / pires mois — mode annuel seulement */}
      {periodMode === "year" && "bestMonths" in report && report.bestMonths && report.bestMonths.length > 0 && (
        <div style={{ borderTop: "1px solid var(--paper-line)", paddingTop: 10, marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--ink-soft)" }}>Meilleur mois</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0F6E56", marginTop: 2 }}>
              {MONTH_LABELS[(report.bestMonths[0]?.month ?? 1) - 1]} — {formatAmount(report.bestMonths[0]?.paidAmount ?? 0)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--ink-soft)" }}>Mois difficile</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#A32D2D", marginTop: 2 }}>
              {report.worstMonths && report.worstMonths.length > 0
                ? `${MONTH_LABELS[(report.worstMonths[0]?.month ?? 1) - 1]} — ${formatAmount(report.worstMonths[0]?.paidAmount ?? 0)}`
                : "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Outstanding balances table ───────────────────────────────────────────────

function OutstandingTable({ report }: { report: OutstandingBalancesReport }) {
  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--paper-line)" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Soldes impayés</p>
          <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
            {report.totalOutstandingSchedules} échéance{report.totalOutstandingSchedules > 1 ? "s" : ""} · Total : {formatAmount(report.totalOutstandingAmount)}
          </p>
        </div>
        <AlertCircle size={15} style={{ color: "#A32D2D", opacity: 0.7 }} />
      </div>
      {report.tenants.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 8 }}>
          <TrendingUp size={26} style={{ color: "#0F6E56", opacity: 0.4 }} />
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun impayé — tout est à jour !</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--paper-line)", background: "rgba(28,43,39,0.02)" }}>
                {["Locataire", "Bien / Local", "1re échéance", "Éch.", "Montant dû"].map((h, i) => (
                  <th key={h} style={{ padding: "8px 16px", textAlign: i < 2 ? "left" : i === 4 ? "right" : "center", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.tenants.map((t) => (
                <tr key={t.tenantId} style={{ borderBottom: "1px solid var(--paper-line)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(28,43,39,0.02)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                  <td style={{ padding: "10px 16px", fontWeight: 500, color: "var(--ink)" }}>{t.tenantName}</td>
                  <td style={{ padding: "10px 16px", color: "var(--ink-soft)" }}>{t.propertyName} · {t.unitNumber}</td>
                  <td style={{ padding: "10px 16px", textAlign: "center", color: "var(--ink-soft)", fontSize: 12 }}>
                    {new Date(t.oldestDueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center", color: "#A32D2D", fontWeight: 600 }}>{t.schedulesCount}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: "#A32D2D", fontWeight: 700, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
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

const CLS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EXCELLENT: { label: "Excellent", bg: "#E1F5EE", color: "#0F6E56" },
  BON: { label: "Bon", bg: "#E1F5EE", color: "#0F6E56" },
  MOYEN: { label: "Moyen", bg: "#FAEEDA", color: "#854F0B" },
  A_RISQUE: { label: "À risque", bg: "#FCEBEB", color: "#A32D2D" },
};

function TenantPerformanceTable({ data }: { data: TenantPerformanceReport[] }) {
  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--paper-line)" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Performance des locataires</p>
        <Users size={15} style={{ color: "var(--ink-soft)", opacity: 0.5 }} />
      </div>
      {data.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", padding: "32px 0" }}>Aucune donnée.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--paper-line)", background: "rgba(28,43,39,0.02)" }}>
                {["Locataire", "Bien / Local", "Payé", "Attendu", "Recouvrement", "Statut"].map((h, i) => (
                  <th key={h} style={{ padding: "8px 16px", textAlign: i < 2 ? "left" : i === 5 ? "center" : "right", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((t) => {
                const cls = CLS_MAP[t.classification] ?? { label: t.classification, bg: "rgba(28,43,39,0.06)", color: "var(--ink-soft)" };
                return (
                  <tr key={t.tenantId + t.leaseId} style={{ borderBottom: "1px solid var(--paper-line)" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(28,43,39,0.02)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                    <td style={{ padding: "10px 16px", fontWeight: 500, color: "var(--ink)" }}>{t.tenantName}</td>
                    <td style={{ padding: "10px 16px", color: "var(--ink-soft)" }}>{t.propertyName} · {t.unitNumber}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", color: "#0F6E56", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{formatAmount(t.paidAmount)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", color: "var(--ink-soft)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{formatAmount(t.expectedAmount)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "var(--ink)" }}>{pct(t.recoveryRate)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "center" }}>
                      <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: cls.bg, color: cls.color }}>
                        {cls.label}
                      </span>
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
  const currentMonth = new Date().getMonth() + 1;
  const currentSemester: 1 | 2 = currentMonth <= 6 ? 1 : 2;

  const [year, setYear] = useState(currentYear);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("year");
  const [semester, setSemester] = useState<1 | 2>(currentSemester);

  const [annualReport, setAnnualReport] = useState<AnnualPerformanceReport | SemesterPerformanceReport | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingBalancesReport | null>(null);
  const [tenantPerf, setTenantPerf] = useState<TenantPerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Label de période depuis l'API ou reconstruit
  const apiPeriodLabel = (annualReport as SemesterPerformanceReport)?.period?.label;
  const periodLabel = apiPeriodLabel
    ?? (periodMode === "semester" ? `S${semester} ${year}` : String(year));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const perfPromise = periodMode === "semester"
        ? reportService.getSemesterPerformance({ year, semester })
        : reportService.getAnnualPerformance({ year });

      const [perfRes, outstandingRes, tenantRes] = await Promise.allSettled([
        perfPromise,
        reportService.getOutstandingBalances(),
        reportService.getTenantPerformance({ period: "annual" }),
      ]);

      if (perfRes.status === "fulfilled") setAnnualReport(perfRes.value.data);
      else setAnnualReport(null);

      if (outstandingRes.status === "fulfilled") setOutstanding(outstandingRes.value.data);
      if (tenantRes.status === "fulfilled") setTenantPerf(tenantRes.value.data ?? []);

      if (perfRes.status === "rejected" && outstandingRes.status === "rejected" && tenantRes.status === "rejected") {
        setError("Impossible de charger les rapports.");
      }
    } finally {
      setLoading(false);
    }
  }, [year, periodMode, semester]);

  useEffect(() => { load(); }, [load]);

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const blob = await reportService.downloadFullPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silencieux */ }
    finally { setDownloading(false); }
  }

  const recoveryColor = !annualReport ? "var(--ink)"
    : annualReport.totals.recoveryRate >= 90 ? "#0F6E56"
    : annualReport.totals.recoveryRate >= 70 ? "#854F0B"
    : "#A32D2D";

  return (
    <div style={{ minHeight: "100%", background: "var(--paper)" }}>
      {/* ── Topbar ── */}
      <div className="ep-topbar" style={{ paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(28,43,39,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={17} style={{ color: "var(--ink)" }} />
          </div>
          <div>
            <p className="ep-eyebrow" style={{ marginBottom: 1 }}>Analyse</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
              Rapports — {periodLabel}
            </h1>
          </div>
        </div>

        <div className="ep-topbar-actions">
          {/* Année */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="ep-chip"
            style={{ height: 32, paddingLeft: 12, paddingRight: 12, cursor: "pointer" }}
          >
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Mode période */}
          <div style={{ display: "flex", gap: 4 }}>
            <PeriodChip active={periodMode === "year"} onClick={() => setPeriodMode("year")}>Année</PeriodChip>
            <PeriodChip active={periodMode === "semester"} onClick={() => setPeriodMode("semester")}>Semestre</PeriodChip>
          </div>

          {/* Sous-sélecteur semestre */}
          {periodMode === "semester" && (
            <div style={{ display: "flex", gap: 4 }}>
              {([1, 2] as const).map((s) => (
                <PeriodChip key={s} active={semester === s} onClick={() => setSemester(s)}>S{s}</PeriodChip>
              ))}
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={load}
            disabled={loading}
            className="ep-btn ep-btn-ghost"
            style={{ width: 34, height: 34, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Actualiser"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          {/* PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || loading}
            className="ep-btn ep-btn-primary"
            style={{ gap: 6 }}
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Exporter PDF
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {error && (
        <div style={{ margin: "0 32px 16px", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-md)", background: "#FCEBEB", border: "1px solid rgba(163,45,45,0.15)", fontSize: 13, color: "#A32D2D" }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={26} className="animate-spin" style={{ color: "var(--ink-soft)", opacity: 0.4 }} />
        </div>
      ) : (
        <div style={{ padding: "0 32px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* KPIs */}
          {annualReport && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <KpiCard
                label="Revenus encaissés"
                value={formatAmount(annualReport.totals.paidAmount)}
                sub={`Attendus : ${formatAmount(annualReport.totals.expectedAmount)}`}
              />
              <KpiCard
                label="Taux de recouvrement"
                value={pct(annualReport.totals.recoveryRate)}
                sub={`À temps : ${pct(annualReport.totals.onTimeRate)}`}
                valueColor={recoveryColor}
              />
              <KpiCard
                label="Impayés cumulés"
                value={formatAmount(annualReport.totals.outstandingAmount)}
                sub={`${annualReport.totals.unpaidCount} échéance${annualReport.totals.unpaidCount > 1 ? "s" : ""} impayée${annualReport.totals.unpaidCount > 1 ? "s" : ""}`}
                valueColor={annualReport.totals.outstandingAmount > 0 ? "#A32D2D" : "#0F6E56"}
              />
              <KpiCard
                label="Soldes impayés"
                value={outstanding ? formatAmount(outstanding.totalOutstandingAmount) : "—"}
                sub={outstanding ? `${outstanding.tenants.length} locataire${outstanding.tenants.length > 1 ? "s" : ""} concerné${outstanding.tenants.length > 1 ? "s" : ""}` : undefined}
                valueColor={!outstanding || outstanding.totalOutstandingAmount === 0 ? "#0F6E56" : "#A32D2D"}
              />
            </div>
          )}

          {/* Bar chart */}
          {annualReport && (
            <PerformanceBarChart
              report={annualReport}
              periodMode={periodMode}
              semester={semester}
              periodLabel={periodLabel}
            />
          )}

          {/* Comparaison N-1 — mode annuel seulement */}
          {periodMode === "year" && annualReport && (() => {
            const cmp = annualReport.comparisonWithPreviousYear;
            if (!cmp) return null;
            const items = [
              { label: "Revenus encaissés", delta: cmp.paidAmountDelta, fmt: (v: number) => formatAmount(Math.abs(v)) },
              { label: "Revenus attendus", delta: cmp.expectedAmountDelta, fmt: (v: number) => formatAmount(Math.abs(v)) },
              { label: "Taux à temps", delta: cmp.onTimeRateDelta, fmt: (v: number) => pct(Math.abs(v)) },
              { label: "Taux recouvrement", delta: cmp.overdueCountDelta, fmt: (v: number) => String(Math.abs(v)) + " dossier" + (Math.abs(v) > 1 ? "s" : "") },
            ];
            return (
              <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-card)", padding: "14px 18px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 12 }}>Évolution vs {year - 1}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {items.map(({ label, delta, fmt: fmtDelta }) => {
                    const isPos = delta >= 0;
                    const isZero = delta === 0;
                    return (
                      <div key={label}>
                        <p style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>{label}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {!isZero && (isPos
                            ? <TrendingUp size={13} style={{ color: "#0F6E56" }} />
                            : <TrendingDown size={13} style={{ color: "#A32D2D" }} />)}
                          <span style={{ fontSize: 14, fontWeight: 600, color: isZero ? "var(--ink-soft)" : isPos ? "#0F6E56" : "#A32D2D" }}>
                            {isZero ? "–" : (isPos ? "+" : "-") + fmtDelta(delta)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {outstanding && <OutstandingTable report={outstanding} />}
          {tenantPerf.length > 0 && <TenantPerformanceTable data={tenantPerf} />}
        </div>
      )}
    </div>
  );
}
