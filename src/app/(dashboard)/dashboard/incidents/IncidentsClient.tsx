"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
  Droplets,
  Zap,
  Building,
  Bug,
  Shield,
  Wrench,
  MoreHorizontal,
} from "lucide-react";
import { incidentService } from "@/lib/services/incident.service";
import { IncidentFormModal } from "@/components/features/incidents/IncidentFormModal";
import { Badge } from "@/components/ui/Badge";
import type {
  Incident,
  IncidentStatus,
  IncidentPriority,
  IncidentCategory,
  IncidentStats,
} from "@/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  OPEN: { label: "Ouvert", variant: "danger" },
  IN_PROGRESS: { label: "En cours", variant: "warning" },
  RESOLVED: { label: "Résolu", variant: "success" },
  CLOSED: { label: "Fermé", variant: "neutral" },
  CANCELLED: { label: "Annulé", variant: "neutral" },
};

const PRIORITY_CONFIG: Record<
  IncidentPriority,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "neutral";
    style?: React.CSSProperties;
  }
> = {
  LOW: { label: "Faible", variant: "success" },
  MEDIUM: { label: "Moyen", variant: "warning" },
  HIGH: { label: "Élevé", variant: "danger" },
  CRITICAL: { label: "Critique", variant: "danger" },
};

const CATEGORY_CONFIG: Record<
  IncidentCategory,
  {
    label: string;
    Icon: React.ElementType;
    bg: string;
    color: string;
    barColor: string;
  }
> = {
  PLUMBING: {
    label: "Plomberie",
    Icon: Droplets,
    bg: "#E1F5EE",
    color: "#0F6E56",
    barColor: "#1D9E75",
  },
  ELECTRICAL: {
    label: "Électricité",
    Icon: Zap,
    bg: "#FAEEDA",
    color: "#854F0B",
    barColor: "#BA7517",
  },
  STRUCTURAL: {
    label: "Structure",
    Icon: Building,
    bg: "#FCEBEB",
    color: "#A32D2D",
    barColor: "#E24B4A",
  },
  SECURITY: {
    label: "Sécurité",
    Icon: Shield,
    bg: "#EEEDFE",
    color: "#3C3489",
    barColor: "#534AB7",
  },
  CLEANING: {
    label: "Nettoyage",
    Icon: Bug,
    bg: "#EAF3DE",
    color: "#3B6D11",
    barColor: "#5A9B22",
  },
  APPLIANCE: {
    label: "Équipements",
    Icon: Wrench,
    bg: "#E8F0FE",
    color: "#1A56A8",
    barColor: "#3B82F6",
  },
  OTHER: {
    label: "Autre",
    Icon: MoreHorizontal,
    bg: "#F0F0F0",
    color: "#666",
    barColor: "#999",
  },
};

function formatCurrency(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "K";
  return String(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-surface border border-border-custom rounded-xl px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-primary/50 mb-1.5">
        {label}
      </p>
      <p
        className="text-[22px] font-medium text-primary"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] mt-1 text-primary/40">{sub}</p>}
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1 rounded-full text-[12px] border transition-colors duration-150 whitespace-nowrap",
        active
          ? "bg-primary text-white border-primary"
          : "bg-surface text-primary/60 border-border-custom hover:text-primary hover:border-primary/30",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ─── Incident row ─────────────────────────────────────────────────────────────

function IncidentRow({
  incident,
  onEdit,
  onDelete,
  deleting,
}: {
  incident: Incident;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const cat = CATEGORY_CONFIG[incident.category] ?? CATEGORY_CONFIG.OTHER;
  const { Icon } = cat;
  const sc = STATUS_CONFIG[incident.status];
  const pc = PRIORITY_CONFIG[incident.priority];

  const isPriorityCritical = incident.priority === "CRITICAL";

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-custom bg-bg hover:bg-primary/2 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Icône catégorie */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cat.bg, color: cat.color }}
        >
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-primary truncate">
            {incident.title}
          </p>
          <p className="text-[11px] text-primary/50 truncate">
            {incident.unit
              ? `${incident.unit.property?.name ?? ""} · ${incident.unit.unitNumber}`
              : "—"}
            {incident.createdAt && ` · ${formatDate(incident.createdAt)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isPriorityCritical ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
            style={{ background: "#E24B4A" }}
          >
            Critique
          </span>
        ) : (
          <Badge variant={pc.variant}>{pc.label}</Badge>
        )}
        <Badge variant={sc.variant}>{sc.label}</Badge>

        {/* Actions */}
        <button
          onClick={onEdit}
          className="p-1 rounded text-primary/30 hover:text-primary hover:bg-primary/6 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1 rounded text-primary/30 hover:text-danger hover:bg-danger/6 transition-colors disabled:opacity-40"
        >
          {deleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Category bar ─────────────────────────────────────────────────────────────

function CategoryBars({ stats }: { stats: IncidentStats }) {
  const byCategory = stats.byCategory ?? {};
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1;

  const entries = (Object.keys(CATEGORY_CONFIG) as IncidentCategory[])
    .map((k) => ({ key: k, count: byCategory[k] ?? 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  if (entries.length === 0)
    return (
      <p className="text-[12px] text-primary/40 py-4 text-center">
        Aucune donnée
      </p>
    );

  return (
    <div className="space-y-2">
      {entries.map(({ key, count }) => {
        const cfg = CATEGORY_CONFIG[key];
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key} className="flex items-center gap-2.5">
            <span className="text-[11px] text-primary/50 w-20 shrink-0 truncate">
              {cfg.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-border-custom overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: cfg.barColor }}
              />
            </div>
            <span className="text-[11px] text-primary/40 w-4 text-right shrink-0">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Cost table ───────────────────────────────────────────────────────────────

// L'API retourne estimatedCost/actualCost en string ("25000.00") ou null
function parseCost(v?: string | null): number {
  return v ? parseFloat(v) : 0;
}

function CostTable({ incidents }: { incidents: Incident[] }) {
  const withCost = incidents
    .filter(
      (i) => parseCost(i.actualCost) > 0 || parseCost(i.estimatedCost) > 0,
    )
    .slice(0, 5);

  if (withCost.length === 0) {
    return (
      <p className="text-[12px] text-primary/40 py-3 text-center">
        Aucun coût enregistré
      </p>
    );
  }

  const total = withCost.reduce(
    (s, i) => s + (parseCost(i.actualCost) || parseCost(i.estimatedCost)),
    0,
  );

  return (
    <table className="w-full text-[12px]">
      <tbody>
        {withCost.map((inc) => {
          const cost =
            parseCost(inc.actualCost) || parseCost(inc.estimatedCost);
          return (
            <tr
              key={inc.id}
              className="border-b border-border-custom last:border-0"
            >
              <td className="py-1.5 text-primary/70 truncate max-w-35">
                {inc.title}
              </td>
              <td className="py-1.5 text-right font-medium text-primary">
                {new Intl.NumberFormat("fr-FR").format(cost)} FCFA
              </td>
            </tr>
          );
        })}
        <tr>
          <td className="pt-2 font-medium text-primary">Total</td>
          <td
            className="pt-2 text-right font-medium"
            style={{ color: "#0F6E56" }}
          >
            {new Intl.NumberFormat("fr-FR").format(total)} FCFA
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterChip = IncidentStatus | "CRITICAL" | "ALL";

export function IncidentsClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterChip>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incRes, statsRes] = await Promise.allSettled([
        incidentService.getAll({ limit: 100 }),
        incidentService.getStats(),
      ]);
      if (incRes.status === "fulfilled") setIncidents(incRes.value.data);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
    } catch {
      setError("Impossible de charger les incidents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filter chips
  const CHIPS: { key: FilterChip; label: string }[] = [
    { key: "ALL", label: "Tous" },
    { key: "OPEN", label: "Ouverts" },
    { key: "IN_PROGRESS", label: "En cours" },
    { key: "RESOLVED", label: "Résolus" },
    { key: "CRITICAL", label: "Critique" },
  ];

  const filtered = incidents.filter((i) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "CRITICAL") return i.priority === "CRITICAL";
    return i.status === activeFilter;
  });

  // Active incidents (open + in_progress) for the main list
  const activeIncidents = filtered.filter(
    (i) => i.status === "OPEN" || i.status === "IN_PROGRESS",
  );
  const showActive =
    activeFilter === "ALL" ||
    activeFilter === "CRITICAL" ||
    activeFilter === "OPEN" ||
    activeFilter === "IN_PROGRESS";

  const displayList = showActive ? activeIncidents : filtered;

  const handleSaved = (saved: Incident) => {
    setIncidents((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const c = [...prev];
        c[idx] = saved;
        return c;
      }
      return [saved, ...prev];
    });
    incidentService
      .getStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet incident ?")) return;
    setDeletingId(id);
    try {
      await incidentService.delete(id);
      setIncidents((prev) => prev.filter((i) => i.id !== id));
      incidentService
        .getStats()
        .then((r) => setStats(r.data))
        .catch(() => {});
    } catch {
      alert("Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  // Stats helpers — byStatus est partiel (seulement les statuts avec incidents)
  const openCount = stats?.byStatus?.OPEN ?? 0;
  const inProgressCount = stats?.byStatus?.IN_PROGRESS ?? 0;
  const resolvedCount = stats?.byStatus?.RESOLVED ?? 0;
  // byPriority n'existe pas dans l'API — on compte depuis la liste locale
  const criticalCount = incidents.filter(
    (i) => i.priority === "CRITICAL",
  ).length;
  const totalCost = incidents.reduce(
    (s, i) => s + (parseCost(i.actualCost) || parseCost(i.estimatedCost)),
    0,
  );

  return (
    <div className="min-h-full bg-bg">
      {/* Topbar */}
      <div className="bg-surface border-b border-border-custom px-4 py-4 lg:px-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[17px] font-medium text-primary">
            Incidents &amp; Maintenance
          </h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors shrink-0"
        >
          <Plus size={14} />
          Signaler un incident
        </button>
      </div>

      <div className="px-4 py-5 lg:px-6 space-y-4">
        {/* Page sub-header */}
        <div>
          <p className="text-[13px] font-medium text-primary">Incidents</p>
          <p className="text-[12px] text-primary/50">
            Suivi des pannes et travaux · {openCount + inProgressCount} incident
            {openCount + inProgressCount !== 1 ? "s" : ""} actif
            {openCount + inProgressCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Ouverts"
            value={openCount}
            sub={criticalCount > 0 ? `${criticalCount} critique` : undefined}
            valueColor="#A32D2D"
          />
          <KpiCard
            label="En cours"
            value={inProgressCount}
            sub="Assignés"
            valueColor="#854F0B"
          />
          <KpiCard
            label="Résolus"
            value={resolvedCount}
            sub="Total"
            valueColor="#0F6E56"
          />
          <KpiCard
            label="Coût total"
            value={formatCurrency(totalCost)}
            sub="FCFA (coûts enregistrés)"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-primary/50 shrink-0">
            Filtrer :
          </span>
          {CHIPS.map((c, i) => (
            <Chip
              key={c.key + i}
              label={c.label}
              active={activeFilter === c.key}
              onClick={() => setActiveFilter(c.key)}
            />
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary/30" size={26} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <AlertTriangle size={26} className="text-danger/50" />
            <p className="text-[13px] text-primary/50">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left — incident list */}
            <div className="bg-surface border border-border-custom rounded-xl p-4">
              <p className="text-[13px] font-medium text-primary mb-3">
                {showActive
                  ? "Incidents actifs"
                  : (STATUS_CONFIG[activeFilter as IncidentStatus]?.label ??
                    "Incidents")}
                {displayList.length > 0 && (
                  <span className="ml-1.5 text-[11px] font-normal text-primary/40">
                    ({displayList.length})
                  </span>
                )}
              </p>

              {displayList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <AlertTriangle size={24} className="text-primary/15" />
                  <p className="text-[12px] text-primary/40">
                    Aucun incident pour ce filtre
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayList.map((inc, i) => (
                    <IncidentRow
                      key={inc.id + i}
                      incident={inc}
                      onEdit={() => {
                        setEditing(inc);
                        setModalOpen(true);
                      }}
                      onDelete={() => handleDelete(inc.id)}
                      deleting={deletingId === inc.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right — stats */}
            <div className="flex flex-col gap-4">
              {/* Category bars */}
              <div className="bg-surface border border-border-custom rounded-xl p-4">
                <p className="text-[13px] font-medium text-primary mb-3">
                  Répartition par catégorie
                </p>
                {stats ? (
                  <CategoryBars stats={stats} />
                ) : (
                  <p className="text-[12px] text-primary/40 text-center py-4">
                    —
                  </p>
                )}
              </div>

              {/* Cost table */}
              <div className="bg-surface border border-border-custom rounded-xl p-4">
                <p className="text-[13px] font-medium text-primary mb-3">
                  Coûts de maintenance
                </p>
                <CostTable incidents={incidents} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <IncidentFormModal
        incident={editing}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
