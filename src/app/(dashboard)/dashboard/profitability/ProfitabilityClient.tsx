"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { profitabilityService } from "@/lib/services/profitability.service";
import type { ProfitabilityItem, ProfitabilityFilterParams } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number, compact = true): string {
  if (n === undefined || n === null) return "—";
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(n) >= 1_000) return Math.round(n / 1_000) + "K";
    return String(n);
  }
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

function pct(n?: number): string {
  if (n === undefined || n === null) return "—";
  return n.toFixed(1) + "%";
}

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function marginBadge(rate: number) {
  if (rate >= 90) return { bg: "#E1F5EE", color: "#0F6E56" };
  if (rate >= 75) return { bg: "#FAEEDA", color: "#854F0B" };
  return { bg: "#FCEBEB", color: "#A32D2D" };
}

type PeriodMode = "year" | "semester" | "month";

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: {
  label: string; value: string; sub?: string; valueColor?: string;
}) {
  return (
    <div
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--paper-line)",
        borderRadius: "var(--r-md)",
        padding: "14px 18px",
        boxShadow: "var(--shadow-card)",
      }}
    >
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

// ─── Chips de sélection de période ───────────────────────────────────────────

function PeriodChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={active ? "ep-chip active" : "ep-chip"}
    >
      {children}
    </button>
  );
}

// ─── Comparatif par propriété ─────────────────────────────────────────────────

function PropertyBarChart({ items }: { items: ProfitabilityItem[] }) {
  if (items.length === 0) return <p style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center", padding: "32px 0" }}>Aucune donnée</p>;
  const maxExpected = Math.max(...items.map((i) => i.revenue.totalRentExpected), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 16 }}>
        {[{ color: "#1D9E75", label: "Collecté" }, { color: "#E36B45", label: "Attendu" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{label}</span>
          </div>
        ))}
      </div>
      {items.map((item) => {
        const collected = item.revenue.totalRentCollected;
        const expected = item.revenue.totalRentExpected;
        const collectedPct = Math.min((collected / Math.max(expected, 1)) * 100, 100);
        const expectedPct = Math.min((expected / maxExpected) * 100, 100);
        return (
          <div key={item.propertyId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--ink-soft)", width: 96, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.propertyName}
            </span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              {[{ pct: collectedPct, color: "#1D9E75" }, { pct: expectedPct, color: "#E36B45" }].map(({ pct: p, color }, idx) => (
                <div key={idx} style={{ height: 8, borderRadius: 4, background: "var(--paper-line)", overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${p}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: "var(--ink-soft)", width: 80, textAlign: "right", flexShrink: 0 }}>
              {fmt(collected)} / {fmt(expected)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Graphique mensuel ────────────────────────────────────────────────────────

function MonthlyChart({ item, filterMonth }: { item: ProfitabilityItem | null; filterMonth?: number }) {
  if (!item) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
        <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>Sélectionnez une propriété pour voir le détail</p>
      </div>
    );
  }

  const breakdown = (item.monthlyBreakdown ?? []).filter((m) =>
    filterMonth ? m.month === filterMonth : true,
  );
  const maxVal = Math.max(...breakdown.map((m) => Math.max(m.expected, m.collected)), 1);
  const currentMonth = new Date().getMonth() + 1;
  const totalCollected = breakdown.reduce((s, m) => s + m.collected, 0);
  const monthsWithData = breakdown.filter((m) => m.collected > 0).length || 1;
  const avg = totalCollected / monthsWithData;
  const best = [...breakdown].sort((a, b) => b.collected - a.collected)[0];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginBottom: 8 }}>
        {breakdown.map((m) => {
          const h = Math.max(Math.round((m.collected / maxVal) * 56), m.collected > 0 ? 4 : 0);
          const isCurrent = m.month === currentMonth;
          const hasData = m.collected > 0 || m.expected > 0;
          return (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
              title={`${MONTH_NAMES[m.month - 1]} : ${fmt(m.collected, false)} FCFA`}>
              <div style={{ width: "100%", height: `${h}px`, background: isCurrent ? "#E36B45" : hasData ? "#1D9E75" : "var(--paper-line)", borderRadius: "3px 3px 0 0", transition: "height 0.5s", minHeight: hasData ? 3 : 0 }} />
              <span style={{ fontSize: 9, color: isCurrent ? "#E36B45" : "var(--ink-soft)", fontWeight: isCurrent ? 600 : 400 }}>
                {MONTH_NAMES[m.month - 1]}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: "1px solid var(--paper-line)", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--ink-soft)" }}>Meilleur mois</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{best?.collected > 0 ? MONTH_NAMES[best.month - 1] : "—"}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--ink-soft)" }}>Moyenne/mois</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{fmt(avg, false)} FCFA</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tableau mensuel détaillé ─────────────────────────────────────────────────

function MonthlyBreakdownTable({ item, semesterFilter }: {
  item: ProfitabilityItem | null;
  semesterFilter?: number;
}) {
  if (!item) return null;

  // Regroupement semestriel : S1 = mois 1-6, S2 = mois 7-12
  const breakdown = item.monthlyBreakdown ?? [];

  // Vue par semestre : agrège les 6 mois de chaque semestre
  function buildSemesterRows() {
    const semesters = [
      { label: "S1 (Jan–Juin)", months: [1, 2, 3, 4, 5, 6] },
      { label: "S2 (Juil–Déc)", months: [7, 8, 9, 10, 11, 12] },
    ];
    return semesters.map(({ label, months }) => {
      const rows = breakdown.filter((m) => months.includes(m.month));
      const expected = rows.reduce((s, m) => s + m.expected, 0);
      const collected = rows.reduce((s, m) => s + m.collected, 0);
      const delta = rows.reduce((s, m) => s + m.delta, 0);
      return { label, expected, collected, delta };
    });
  }

  const monthRows = semesterFilter
    ? breakdown.filter((m) => {
        const s1 = [1, 2, 3, 4, 5, 6];
        const s2 = [7, 8, 9, 10, 11, 12];
        return semesterFilter === 1 ? s1.includes(m.month) : s2.includes(m.month);
      })
    : breakdown;

  const semRows = buildSemesterRows();

  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--paper-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Ventilation — {item.propertyName}</p>
          <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
            {item.period?.label ?? String(item.year)}
          </p>
        </div>
      </div>

      {/* Vue par mois */}
      <div>
        <div style={{ padding: "8px 18px", background: "rgba(28,43,39,0.03)", borderBottom: "1px solid var(--paper-line)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-soft)" }}>Par mois</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--paper-line)" }}>
                {["Mois", "Attendu", "Collecté", "Écart"].map((h, i) => (
                  <th key={h} style={{ padding: "8px 18px", textAlign: i === 0 ? "left" : "right", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthRows.map((m) => {
                const isPos = m.delta >= 0;
                return (
                  <tr key={m.month} style={{ borderBottom: "1px solid var(--paper-line)" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(28,43,39,0.02)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                    <td style={{ padding: "9px 18px", color: "var(--ink)", fontWeight: 500 }}>{MONTH_NAMES[m.month - 1]}</td>
                    <td style={{ padding: "9px 18px", textAlign: "right", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>{fmt(m.expected, false)}</td>
                    <td style={{ padding: "9px 18px", textAlign: "right", color: "#0F6E56", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{fmt(m.collected, false)}</td>
                    <td style={{ padding: "9px 18px", textAlign: "right", color: isPos ? "#0F6E56" : "#A32D2D", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                      {m.delta !== 0 ? (isPos ? "+" : "") + fmt(m.delta, false) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vue par semestre */}
      <div style={{ borderTop: "2px solid var(--paper-line)" }}>
        <div style={{ padding: "8px 18px", background: "rgba(28,43,39,0.03)", borderBottom: "1px solid var(--paper-line)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-soft)" }}>Par semestre</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            {semRows.map((row) => {
              const isPos = row.delta >= 0;
              return (
                <tr key={row.label} style={{ borderBottom: "1px solid var(--paper-line)" }}>
                  <td style={{ padding: "10px 18px", color: "var(--ink)", fontWeight: 600, width: "40%" }}>{row.label}</td>
                  <td style={{ padding: "10px 18px", textAlign: "right", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>{fmt(row.expected, false)}</td>
                  <td style={{ padding: "10px 18px", textAlign: "right", color: "#0F6E56", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{fmt(row.collected, false)}</td>
                  <td style={{ padding: "10px 18px", textAlign: "right", color: isPos ? "#0F6E56" : "#A32D2D", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                    {row.delta !== 0 ? (isPos ? "+" : "") + fmt(row.delta, false) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tableau de rentabilité ───────────────────────────────────────────────────

function DetailTable({ items, onSelect, selectedId }: {
  items: ProfitabilityItem[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--paper-line)" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Tableau de rentabilité détaillé</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 100px 80px", gap: 8, padding: "8px 18px", borderBottom: "1px solid var(--paper-line)" }}>
          {["Propriété", "Attendu", "Collecté", "Charges", "Collecte"].map((h, i) => (
            <div key={h} style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
          ))}
        </div>

        {items.map((item) => {
          const { revenue, charges, occupancy } = item;
          const mb = marginBadge(revenue.collectionRate);
          const isSelected = selectedId === item.propertyId;
          return (
            <div
              key={item.propertyId}
              onClick={() => onSelect(item.propertyId)}
              style={{
                display: "grid", gridTemplateColumns: "1fr 110px 110px 100px 80px", gap: 8,
                padding: "12px 18px", borderBottom: "1px solid var(--paper-line)",
                cursor: "pointer", background: isSelected ? "rgba(193,98,45,0.04)" : undefined,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(28,43,39,0.02)"; }}
              onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{item.propertyName}</p>
                <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
                  {occupancy.occupiedUnits}/{occupancy.totalUnits} local{occupancy.totalUnits > 1 ? "aux" : ""} · {pct(occupancy.occupancyRate)} occupé
                </p>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: "var(--ink)", alignSelf: "center" }}>{fmt(revenue.totalRentExpected, false)}</div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#0F6E56", alignSelf: "center" }}>{fmt(revenue.totalRentCollected, false)}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: charges.totalCharges > 0 ? "#A32D2D" : "var(--ink-soft)", alignSelf: "center" }}>
                {charges.totalCharges > 0 ? fmt(charges.totalCharges, false) : "0"}
              </div>
              <div style={{ textAlign: "right", alignSelf: "center" }}>
                <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: mb.bg, color: mb.color }}>
                  {pct(revenue.collectionRate)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Totaux */}
        {items.length > 1 && (() => {
          const totalExpected = items.reduce((s, i) => s + i.revenue.totalRentExpected, 0);
          const totalCollected = items.reduce((s, i) => s + i.revenue.totalRentCollected, 0);
          const totalCharges = items.reduce((s, i) => s + i.charges.totalCharges, 0);
          const avgCollection = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
          const mb = marginBadge(avgCollection);
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 100px 80px", gap: 8, padding: "12px 18px", background: "rgba(28,43,39,0.03)", borderTop: "2px solid var(--paper-line)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>Total</div>
              <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{fmt(totalExpected, false)}</div>
              <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: "#0F6E56" }}>{fmt(totalCollected, false)}</div>
              <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: totalCharges > 0 ? "#A32D2D" : "var(--ink-soft)" }}>{totalCharges > 0 ? fmt(totalCharges, false) : "0"}</div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: mb.bg, color: mb.color }}>{pct(avgCollection)}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProfitabilityClient() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentSemester = currentMonth <= 6 ? 1 : 2;

  const [year, setYear] = useState(currentYear);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("year");
  const [month, setMonth] = useState(currentMonth);
  const [semester, setSemester] = useState<1 | 2>(currentSemester);

  const [items, setItems] = useState<ProfitabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Construit les params selon le mode actif
  const filterParams: ProfitabilityFilterParams = {
    year,
    ...(periodMode === "month" ? { month } : {}),
    ...(periodMode === "semester" ? { semester } : {}),
  };

  // Label de période — depuis l'API si disponible, sinon reconstruit
  const periodLabel = items[0]?.period?.label
    ?? (periodMode === "month" ? `${String(month).padStart(2, "0")}/${year}` : periodMode === "semester" ? `S${semester} ${year}` : String(year));

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    profitabilityService
      .getAll(filterParams)
      .then((res) => setItems(res.data ?? []))
      .catch(() => setError("Impossible de charger les données."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, periodMode, month, semester]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const selectedItem = items.find((i) => i.propertyId === selectedId) ?? null;

  const totalExpected = items.reduce((s, i) => s + i.revenue.totalRentExpected, 0);
  const totalCollected = items.reduce((s, i) => s + i.revenue.totalRentCollected, 0);
  const totalCharges = items.reduce((s, i) => s + i.charges.totalCharges, 0);
  const netIncome = items.reduce((s, i) => s + i.profitability.netIncome, 0);
  const collectRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  const margin = totalCollected > 0 ? (netIncome / totalCollected) * 100 : 0;

  return (
    <div style={{ minHeight: "100%", background: "var(--paper)" }}>
      {/* ── Topbar ── */}
      <div className="ep-topbar" style={{ paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(28,43,39,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={17} style={{ color: "var(--ink)" }} />
          </div>
          <div>
            <p className="ep-eyebrow" style={{ marginBottom: 1 }}>Suivi</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
              Rentabilité — {periodLabel}
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
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Mode période */}
          <div style={{ display: "flex", gap: 4 }}>
            <PeriodChip active={periodMode === "year"} onClick={() => setPeriodMode("year")}>Année complète</PeriodChip>
            <PeriodChip active={periodMode === "semester"} onClick={() => setPeriodMode("semester")}>Semestre</PeriodChip>
            <PeriodChip active={periodMode === "month"} onClick={() => setPeriodMode("month")}>Mois</PeriodChip>
          </div>

          {/* Sous-sélecteur selon mode */}
          {periodMode === "semester" && (
            <div style={{ display: "flex", gap: 4 }}>
              {([1, 2] as const).map((s) => (
                <PeriodChip key={s} active={semester === s} onClick={() => setSemester(s)}>S{s}</PeriodChip>
              ))}
            </div>
          )}
          {periodMode === "month" && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="ep-chip"
              style={{ height: 32, paddingLeft: 12, paddingRight: 12, cursor: "pointer" }}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={26} className="animate-spin" style={{ color: "var(--ink-soft)", opacity: 0.4 }} />
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 8 }}>
          <AlertTriangle size={26} style={{ color: "var(--rouge)", opacity: 0.5 }} />
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>{error}</p>
        </div>
      ) : (
        <div style={{ padding: "0 32px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <KpiCard label="Revenus attendus" value={fmt(totalExpected) + " FCFA"} sub={periodLabel} />
            <KpiCard label="Revenus collectés" value={fmt(totalCollected) + " FCFA"} sub={`↑ ${pct(collectRate)} taux collecte`} valueColor="#0F6E56" />
            <KpiCard label="Charges totales" value={fmt(totalCharges) + " FCFA"} sub="Maintenance + ajustements" valueColor={totalCharges > 0 ? "#A32D2D" : undefined} />
            <KpiCard label="Bénéfice net" value={fmt(netIncome) + " FCFA"} sub={`Marge : ${pct(margin)}`} valueColor="#0F6E56" />
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-card)", padding: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>Comparatif par propriété</p>
              <p style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 14 }}>Collecté vs attendu · {periodLabel}</p>
              <PropertyBarChart items={items} />
            </div>
            <div style={{ background: "var(--paper-raised)", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-card)", padding: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>Revenus mensuels</p>
              <p style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 14 }}>
                {selectedItem ? `${selectedItem.propertyName} · ${periodLabel}` : `Sélectionnez une propriété · ${periodLabel}`}
              </p>
              <MonthlyChart item={selectedItem} filterMonth={periodMode === "month" ? month : undefined} />
            </div>
          </div>

          {/* Tableau détaillé */}
          <DetailTable items={items} onSelect={setSelectedId} selectedId={selectedId} />

          {/* Tableau mensuel + semestriel — visible dès qu'une propriété est sélectionnée */}
          {selectedItem && (
            <MonthlyBreakdownTable
              item={selectedItem}
              semesterFilter={periodMode === "semester" ? semester : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
