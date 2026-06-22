"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { profitabilityService } from "@/lib/services/profitability.service";
import type { ProfitabilityItem } from "@/types";

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

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-surface border border-border-custom rounded-xl px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-primary/50 mb-1.5">{label}</p>
      <p className="text-[22px] font-medium" style={{ color: valueColor ?? "var(--color-text-primary)" }}>
        {value}
      </p>
      {sub && <p className="text-[11px] mt-1 text-primary/40">{sub}</p>}
    </div>
  );
}

// ─── Double bar chart (collecté vs attendu) ───────────────────────────────────

function PropertyBarChart({ items }: { items: ProfitabilityItem[] }) {
  if (items.length === 0) {
    return <p className="text-[12px] text-primary/40 py-8 text-center">Aucune donnée</p>;
  }

  const maxExpected = Math.max(...items.map((i) => i.revenue.totalRentExpected), 1);

  return (
    <div className="space-y-3">
      {/* Légende */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#1D9E75" }} />
          <span className="text-[11px] text-primary/50">Collecté</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#E36B45" }} />
          <span className="text-[11px] text-primary/50">Attendu</span>
        </div>
      </div>

      {items.map((item) => {
        const collected = item.revenue.totalRentCollected;
        const expected = item.revenue.totalRentExpected;
        const collectedPct = Math.min((collected / Math.max(expected, 1)) * 100, 100);
        const expectedPct = Math.min((expected / maxExpected) * 100, 100);

        return (
          <div key={item.propertyId} className="flex items-center gap-2.5">
            <span className="text-[11px] text-primary/60 w-24 shrink-0 truncate">
              {item.propertyName}
            </span>
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-2 rounded bg-border-custom overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                  style={{ width: `${collectedPct}%`, background: "#1D9E75" }}
                />
              </div>
              <div className="h-2 rounded bg-border-custom overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                  style={{ width: `${expectedPct}%`, background: "#E36B45" }}
                />
              </div>
            </div>
            <span className="text-[11px] text-primary/40 w-20 text-right shrink-0">
              {fmt(collected)} / {fmt(expected)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Monthly bar chart (depuis monthlyBreakdown de l'item sélectionné) ────────

function MonthlyChart({ item }: { item: ProfitabilityItem | null }) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <p className="text-[12px] text-primary/40">Cliquez sur une propriété pour voir le détail mensuel</p>
      </div>
    );
  }

  const breakdown = item.monthlyBreakdown ?? [];
  const maxVal = Math.max(...breakdown.map((m) => Math.max(m.expected, m.collected)), 1);
  const currentMonth = new Date().getMonth() + 1;

  const best = [...breakdown].sort((a, b) => b.collected - a.collected)[0];
  const totalCollected = breakdown.reduce((s, m) => s + m.collected, 0);
  const monthsWithData = breakdown.filter((m) => m.collected > 0).length || 1;
  const avg = totalCollected / monthsWithData;

  return (
    <div>
      <div className="flex items-end gap-1.5 h-20 mb-3">
        {breakdown.map((m) => {
          const collectedH = Math.max(Math.round((m.collected / maxVal) * 56), m.collected > 0 ? 4 : 0);
          const isCurrent = m.month === currentMonth;
          const hasData = m.collected > 0 || m.expected > 0;

          return (
            <div key={m.month} className="flex flex-col items-center gap-1 flex-1 min-w-0" title={`${MONTH_NAMES[m.month - 1]} : ${fmt(m.collected, false)} FCFA collecté`}>
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${collectedH}px`,
                  background: isCurrent ? "#E36B45" : hasData ? "#1D9E75" : "var(--color-border-custom)",
                  minHeight: hasData ? "3px" : "0",
                }}
              />
              <span
                className="text-[9px] truncate w-full text-center"
                style={{ color: isCurrent ? "#E36B45" : "var(--color-text-secondary)", fontWeight: isCurrent ? 500 : 400 }}
              >
                {MONTH_NAMES[m.month - 1]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border-custom pt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[11px] text-primary/40">Meilleur mois</p>
          <p className="text-[14px] font-medium text-primary mt-0.5">
            {best?.collected > 0 ? MONTH_NAMES[best.month - 1] : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-primary/40">Moyenne/mois</p>
          <p className="text-[14px] font-medium text-primary mt-0.5">{fmt(avg, false)} FCFA</p>
        </div>
      </div>
    </div>
  );
}

// ─── Detail table ─────────────────────────────────────────────────────────────

function DetailTable({ items, onSelect, selectedId }: {
  items: ProfitabilityItem[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <div className="bg-surface border border-border-custom rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border-custom">
        <p className="text-[13px] font-medium text-primary">Tableau de rentabilité détaillé</p>
      </div>
      <div className="overflow-x-auto">
        {/* Header */}
        <div
          className="grid gap-2 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-primary/40 border-b border-border-custom"
          style={{ gridTemplateColumns: "1fr 110px 110px 100px 80px" }}
        >
          <div>Propriété</div>
          <div className="text-right">Attendu</div>
          <div className="text-right">Collecté</div>
          <div className="text-right">Charges</div>
          <div className="text-right">Collecte</div>
        </div>

        {items.map((item) => {
          const { revenue, charges, occupancy, profitability } = item;
          const mb = marginBadge(revenue.collectionRate);
          const isSelected = selectedId === item.propertyId;

          return (
            <div
              key={item.propertyId}
              onClick={() => onSelect(item.propertyId)}
              className={[
                "grid gap-2 px-5 py-3 border-b border-border-custom last:border-0 cursor-pointer transition-colors",
                isSelected ? "bg-primary/4" : "hover:bg-primary/2",
              ].join(" ")}
              style={{ gridTemplateColumns: "1fr 110px 110px 100px 80px" }}
            >
              <div>
                <p className="text-[13px] font-medium text-primary">{item.propertyName}</p>
                <p className="text-[11px] text-primary/40">
                  {occupancy.occupiedUnits} / {occupancy.totalUnits} local{occupancy.totalUnits > 1 ? "aux" : ""}
                  {" · "}{pct(occupancy.occupancyRate)} occupé
                </p>
              </div>
              <div className="text-right text-[13px] text-primary self-center">
                {fmt(revenue.totalRentExpected, false)}
              </div>
              <div className="text-right text-[13px] font-medium self-center" style={{ color: "#0F6E56" }}>
                {fmt(revenue.totalRentCollected, false)}
              </div>
              <div
                className="text-right text-[13px] self-center"
                style={{ color: charges.totalCharges > 0 ? "#A32D2D" : "var(--color-text-secondary)" }}
              >
                {charges.totalCharges > 0 ? fmt(charges.totalCharges, false) : "0"}
              </div>
              <div className="text-right self-center">
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: mb.bg, color: mb.color }}
                >
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
            <div
              className="grid gap-2 px-5 py-3 bg-primary/3 border-t-2 border-border-custom"
              style={{ gridTemplateColumns: "1fr 110px 110px 100px 80px" }}
            >
              <div className="text-[12px] font-semibold text-primary">Total</div>
              <div className="text-right text-[12px] font-semibold text-primary">{fmt(totalExpected, false)}</div>
              <div className="text-right text-[12px] font-semibold" style={{ color: "#0F6E56" }}>{fmt(totalCollected, false)}</div>
              <div className="text-right text-[12px] font-semibold" style={{ color: totalCharges > 0 ? "#A32D2D" : "var(--color-text-secondary)" }}>
                {totalCharges > 0 ? fmt(totalCharges, false) : "0"}
              </div>
              <div className="text-right">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: mb.bg, color: mb.color }}>
                  {pct(avgCollection)}
                </span>
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
  const [year, setYear] = useState(currentYear);
  const [items, setItems] = useState<ProfitabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    profitabilityService
      .getAll({ year })
      .then((res) => setItems(res.data ?? []))
      .catch(() => setError("Impossible de charger les données."))
      .finally(() => setLoading(false));
  }, [year]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const selectedItem = items.find((i) => i.propertyId === selectedId) ?? null;

  // KPIs agrégés
  const totalExpected = items.reduce((s, i) => s + i.revenue.totalRentExpected, 0);
  const totalCollected = items.reduce((s, i) => s + i.revenue.totalRentCollected, 0);
  const totalCharges = items.reduce((s, i) => s + i.charges.totalCharges, 0);
  const netIncome = items.reduce((s, i) => s + i.profitability.netIncome, 0);
  const collectRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  const margin = totalCollected > 0 ? ((netIncome / totalCollected) * 100) : 0;

  return (
    <div className="min-h-full bg-bg">
      {/* Topbar */}
      <div className="bg-surface border-b border-border-custom px-4 py-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <TrendingUp size={17} className="text-primary" />
          </div>
          <h1 className="text-[17px] font-medium text-primary">Rentabilité par propriété</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-border-custom bg-surface text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {years.map((y) => (
              <option key={y} value={y}>Année {y}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary/30" size={26} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle size={26} className="text-danger/50" />
          <p className="text-[13px] text-primary/50">{error}</p>
        </div>
      ) : (
        <div className="px-4 py-5 lg:px-6 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Revenus attendus"
              value={fmt(totalExpected) + " FCFA"}
              sub={`Année ${year}`}
            />
            <KpiCard
              label="Revenus collectés"
              value={fmt(totalCollected) + " FCFA"}
              sub={`↑ ${pct(collectRate)} taux collecte`}
              valueColor="#0F6E56"
            />
            <KpiCard
              label="Charges totales"
              value={fmt(totalCharges) + " FCFA"}
              sub="Maintenance + ajustements"
              valueColor={totalCharges > 0 ? "#A32D2D" : undefined}
            />
            <KpiCard
              label="Bénéfice net"
              value={fmt(netIncome) + " FCFA"}
              sub={`Marge : ${pct(margin)}`}
              valueColor="#0F6E56"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Comparatif */}
            <div className="bg-surface border border-border-custom rounded-xl p-4">
              <div className="mb-3">
                <p className="text-[13px] font-medium text-primary">Comparatif par propriété</p>
                <p className="text-[11px] text-primary/40 mt-0.5">Collecté vs attendu · {year}</p>
              </div>
              <PropertyBarChart items={items} />
            </div>

            {/* Mensuel */}
            <div className="bg-surface border border-border-custom rounded-xl p-4">
              <div className="mb-3">
                <p className="text-[13px] font-medium text-primary">Revenus mensuels</p>
                <p className="text-[11px] text-primary/40 mt-0.5">
                  {selectedItem
                    ? `${selectedItem.propertyName} · ${year}`
                    : `Collecté par mois · ${year}`}
                </p>
              </div>
              <MonthlyChart item={selectedItem} />
            </div>
          </div>

          {/* Tableau détaillé */}
          <DetailTable items={items} onSelect={setSelectedId} selectedId={selectedId} />
        </div>
      )}
    </div>
  );
}
