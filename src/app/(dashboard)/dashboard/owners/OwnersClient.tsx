"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Download,
  Loader2,
  UserRound,
  Link2Off,
  Trash2,
  AlertTriangle,
  Building2,
  TrendingUp,
  Wallet,
  Clock,
  Banknote,
} from "lucide-react";
import { ownerService } from "@/lib/services/owner.service";
import { OwnerFormModal } from "@/components/features/owners/OwnerFormModal";
import { AttachPropertyModal } from "@/components/features/owners/AttachPropertyModal";
import { AttachUnitModal } from "@/components/features/owners/AttachUnitModal";
import { OwnerAccountPanel } from "@/components/features/owners/OwnerAccountPanel";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Owner, OwnerReport } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodMode = "year" | "semester" | "month";

const MONTH_NAMES_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function PeriodChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={active ? "ep-chip active" : "ep-chip"} style={{ fontSize: 12 }}>
      {children}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNumber = new Intl.NumberFormat("fr-FR");

function fmtAmount(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null || raw === "") return "—";
  const n = Number(raw);
  if (isNaN(n)) return "—";
  if (n >= 1_000_000)
    return `${fmtNumber.format(+(n / 1_000_000).toFixed(2))}M`;
  if (n >= 1_000) return `${fmtNumber.format(+(n / 1_000).toFixed(1))}K`;
  return fmtNumber.format(n);
}

// ─── KPI Card — même pattern que DashboardHomeClient ─────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: "default" | "success" | "warning" | "danger";
}) {
  const iconCls = {
    default: "bg-primary/6 text-primary/50",
    success: "bg-success/10 text-success",
    warning: "bg-secondary/10 text-secondary",
    danger: "bg-danger/10 text-danger",
  }[accent];

  return (
    <div
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--paper-line)",
        borderRadius: "var(--r-md)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--ink-soft)",
          }}
        >
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}
        >
          <Icon size={14} aria-hidden="true" />
        </div>
      </div>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Owner list item ──────────────────────────────────────────────────────────

function OwnerListItem({
  owner,
  selected,
  onClick,
}: {
  owner: Owner;
  selected: boolean;
  onClick: () => void;
}) {
  const propCount = owner.properties?.length ?? 0;
  const initials = owner.fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 12px",
        borderRadius: "var(--r-md)",
        background: selected ? "rgba(193,98,45,0.08)" : "transparent",
        border: selected
          ? "1px solid rgba(193,98,45,0.18)"
          : "1px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.background =
            "rgba(28,43,39,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: selected ? "rgba(193,98,45,0.15)" : "rgba(28,43,39,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 700,
          color: selected ? "var(--terracotta)" : "var(--ink-soft)",
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: selected ? 600 : 500,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {owner.fullName}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          {propCount === 0
            ? "Aucun bien"
            : `${propCount} bien${propCount > 1 ? "s" : ""}`}
        </p>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OwnersClient() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [report, setReport] = useState<OwnerReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Owner | null>(null);

  const [attachOpen, setAttachOpen] = useState(false);
  const [attachUnitOpen, setAttachUnitOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<"apercu" | "compte">("apercu");

  const [deleteOwner, setDeleteOwner] = useState<Owner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detachPropertyId, setDetachPropertyId] = useState<string | null>(null);
  const [detachPropertyName, setDetachPropertyName] = useState<string>("");
  const [detaching, setDetaching] = useState(false);

  // Period filter
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("year");
  const [month, setMonth] = useState(currentMonth);
  const [semester, setSemester] = useState<1 | 2>(currentMonth <= 6 ? 1 : 2);

  const reportParams = {
    year,
    ...(periodMode === "month" ? { month } : {}),
    ...(periodMode === "semester" ? { semester } : {}),
  };

  // ── Data ──────────────────────────────────────────────────────────────────

  const loadOwners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ownerService.getAll({ limit: 100 });
      setOwners(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  // Revenir à l'onglet Aperçu quand on change de propriétaire sélectionné
  useEffect(() => {
    setActiveTab("apercu");
  }, [selectedOwner?.id]);

  useEffect(() => {
    if (!selectedOwner) {
      setReport(null);
      return;
    }
    setReportLoading(true);
    ownerService
      .getReport(selectedOwner.id, reportParams)
      .then((res) => setReport(res.data))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwner, year, periodMode, month, semester]);

  const filteredOwners = owners.filter((o) =>
    o.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleOwnerSaved(saved: Owner) {
    setOwners((prev) => {
      const idx = prev.findIndex((o) => o.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setSelectedOwner(saved);
    setFormOpen(false);
    setEditTarget(null);
  }

  function handleAttached(updated: Owner) {
    // On garde selectedOwner comme base (données complètes garanties)
    // et on ne met à jour que les properties depuis la réponse API, dont
    // l'id peut être mal normalisé ou les champs partiellement absents.
    const knownId = selectedOwner?.id ?? updated.id;
    const merged: Owner = {
      ...(selectedOwner ?? updated),
      properties: updated?.properties ?? selectedOwner?.properties,
      id: knownId,
    };
    setOwners((prev) => prev.map((o) => (o.id === knownId ? merged : o)));
    setSelectedOwner(merged);
    setAttachOpen(false);
  }

  function handleAttachedUnits() {
    setAttachUnitOpen(false);
    if (!selectedOwner) return;
    // Le rattachement de locaux individuels ne change pas la liste des biens
    // de l'owner, mais modifie les chiffres du rapport/relevé — on recharge.
    setReportLoading(true);
    ownerService
      .getReport(selectedOwner.id, reportParams)
      .then((res) => setReport(res.data))
      .catch(() => {})
      .finally(() => setReportLoading(false));
  }

  async function handleDownloadPdf() {
    if (!selectedOwner) return;
    setDownloadingPdf(true);
    try {
      const blob = await ownerService.downloadReportPdf(selectedOwner.id, reportParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-proprietaire-${selectedOwner.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDeleteOwner() {
    if (!deleteOwner) return;
    setDeleting(true);
    try {
      await ownerService.delete(deleteOwner.id);
      setOwners((prev) => prev.filter((o) => o.id !== deleteOwner.id));
      if (selectedOwner?.id === deleteOwner.id) setSelectedOwner(null);
      setDeleteOwner(null);
    } catch {
      /* silent */
    } finally {
      setDeleting(false);
    }
  }

  async function handleDetachProperty() {
    if (!selectedOwner || !detachPropertyId) return;
    setDetaching(true);
    const knownId = selectedOwner.id;
    try {
      const res = await ownerService.detachProperty(knownId, detachPropertyId);
      // Même principe : selectedOwner est la base fiable, on ne met à jour
      // que les properties depuis la réponse API.
      const merged: Owner = {
        ...selectedOwner,
        properties: res.data?.properties ?? selectedOwner.properties,
        id: knownId,
      };
      setOwners((prev) => prev.map((o) => (o.id === knownId ? merged : o)));
      setSelectedOwner(merged);
      setDetachPropertyId(null);
    } catch {
      /* silent */
    } finally {
      setDetaching(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div
          style={{
            width: 268,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--paper-line)",
            background: "var(--paper-raised)",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "22px 16px 12px",
              borderBottom: "1px solid var(--paper-line)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <p className="ep-eyebrow" style={{ marginBottom: 2 }}>
                  Parc immobilier
                </p>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--ink)",
                    lineHeight: 1.2,
                  }}
                >
                  Propriétaires
                </h1>
              </div>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                className="ep-btn ep-btn-primary"
                style={{ padding: "6px 10px", fontSize: 12 }}
                title="Nouveau propriétaire"
              >
                <Plus size={13} aria-hidden="true" />
                Nouveau
              </button>
            </div>

            {/* Search */}
            <div className="ep-search">
              <Search
                size={13}
                style={{ flexShrink: 0, opacity: 0.45 }}
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
              />
            </div>
          </div>

          {/* Owner list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "32px 0",
                }}
              >
                <Loader2 size={18} className="animate-spin text-primary/30" />
              </div>
            ) : filteredOwners.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--ink-soft)",
                  opacity: 0.6,
                  padding: "32px 16px",
                }}
              >
                {search ? "Aucun résultat" : "Aucun propriétaire enregistré"}
              </p>
            ) : (
              filteredOwners.map((owner) => (
                <OwnerListItem
                  key={owner.id}
                  owner={owner}
                  selected={selectedOwner?.id === owner.id}
                  onClick={() => setSelectedOwner(owner)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            background: "var(--paper)",
          }}
        >
          {!selectedOwner ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <EmptyState
                icon={UserRound}
                title="Sélectionnez un propriétaire"
                description="Cliquez sur un propriétaire dans la liste pour afficher son rapport et ses biens."
              />
            </div>
          ) : (
            <>
              {/* ── Topbar ── */}
              {(() => {
                const periodLabel = report?.period?.label
                  ?? (periodMode === "month"
                    ? `${MONTH_NAMES_SHORT[month - 1]} ${year}`
                    : periodMode === "semester"
                    ? `S${semester} ${year}`
                    : String(year));
                return (
                  <div className="ep-topbar" style={{ paddingBottom: 24, flexWrap: "wrap", gap: 14 }}>
                    <div>
                      <p className="ep-eyebrow" style={{ marginBottom: 2 }}>
                        Propriétaire · <span style={{ color: "var(--terracotta)" }}>{periodLabel}</span>
                      </p>
                      <h2
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 28,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          color: "var(--ink)",
                          lineHeight: 1.15,
                        }}
                      >
                        {selectedOwner.fullName}
                      </h2>
                      {(selectedOwner.phone || selectedOwner.managementFeePercent != null) && (
                        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 3 }}>
                          {[
                            selectedOwner.phone,
                            selectedOwner.managementFeePercent != null
                              ? `Commission ${Number(selectedOwner.managementFeePercent)}%`
                              : null,
                          ].filter(Boolean).join("  ·  ")}
                        </p>
                      )}
                    </div>
                    <div className="ep-topbar-actions" style={{ flexWrap: "wrap", gap: 6 }}>
                      {/* Année */}
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="ep-chip"
                        style={{ height: 30, paddingLeft: 10, paddingRight: 10, cursor: "pointer", fontSize: 12 }}
                      >
                        {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>

                      {/* Mode période */}
                      <div style={{ display: "flex", gap: 3 }}>
                        <PeriodChip active={periodMode === "year"} onClick={() => setPeriodMode("year")}>Année</PeriodChip>
                        <PeriodChip active={periodMode === "semester"} onClick={() => setPeriodMode("semester")}>Semestre</PeriodChip>
                        <PeriodChip active={periodMode === "month"} onClick={() => setPeriodMode("month")}>Mois</PeriodChip>
                      </div>

                      {/* Sous-sélecteur */}
                      {periodMode === "semester" && (
                        <div style={{ display: "flex", gap: 3 }}>
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
                          style={{ height: 30, paddingLeft: 10, paddingRight: 10, cursor: "pointer", fontSize: 12 }}
                        >
                          {MONTH_NAMES_SHORT.map((name, i) => (
                            <option key={i + 1} value={i + 1}>{name}</option>
                          ))}
                        </select>
                      )}

                      <div style={{ width: 1, background: "var(--paper-line)", height: 20, alignSelf: "center" }} />

                      <button
                        onClick={() => { setEditTarget(selectedOwner); setFormOpen(true); }}
                        className="ep-btn ep-btn-ghost"
                      >
                        <Edit size={14} aria-hidden="true" />
                        Modifier
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="ep-btn ep-btn-ghost"
                        style={{ opacity: downloadingPdf ? 0.6 : undefined }}
                      >
                        {downloadingPdf ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} aria-hidden="true" />
                        )}
                        Rapport PDF
                      </button>
                      <button
                        onClick={() => setDeleteOwner(selectedOwner)}
                        className="ep-btn"
                        style={{ border: "1px solid rgba(168,67,47,0.25)", color: "var(--rouge)", background: "transparent" }}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── Tabs ── */}
              <div style={{ padding: "0 32px", display: "flex", gap: 4, borderBottom: "1px solid var(--paper-line)", marginBottom: 24 }}>
                {([
                  { key: "apercu" as const, label: "Aperçu" },
                  { key: "compte" as const, label: "Compte" },
                ]).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: "10px 4px",
                      marginRight: 20,
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === t.key ? "2px solid var(--terracotta)" : "2px solid transparent",
                      color: activeTab === t.key ? "var(--ink)" : "var(--ink-soft)",
                      fontWeight: activeTab === t.key ? 600 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === "compte" ? (
                <div style={{ padding: "0 32px 40px" }}>
                  <OwnerAccountPanel ownerId={selectedOwner.id} />
                </div>
              ) : (
              <div style={{ padding: "0 32px 40px" }}>
                {/* ── KPI cards ── */}
                {reportLoading ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: 96,
                          background: "var(--paper-raised)",
                          border: "1px solid var(--paper-line)",
                          borderRadius: "var(--r-md)",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    ))}
                  </div>
                ) : report ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <KpiCard
                        label="Biens gérés"
                        value={report.summary.propertiesCount}
                        icon={Building2}
                        accent="default"
                      />
                      <KpiCard
                        label="Occupation"
                        value={`${Math.round(report.summary.occupancyRate)}%`}
                        icon={TrendingUp}
                        accent="success"
                      />
                      <KpiCard
                        label="Loyers encaissés"
                        value={fmtAmount(report.summary.totalRentCollected)}
                        icon={Wallet}
                        accent="warning"
                      />
                      <KpiCard
                        label="Reste à recouvrer"
                        value={fmtAmount(report.summary.totalOutstanding)}
                        icon={Clock}
                        accent="danger"
                      />
                    </div>

                    {/* Net à reverser banner */}
                    <div
                      style={{
                        background: "var(--sauge-soft, #E0E8DD)",
                        border: "1px solid rgba(91,123,98,0.25)",
                        borderRadius: "var(--r-md)",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 28,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--r-md)",
                            background: "rgba(91,123,98,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Banknote
                            size={16}
                            style={{ color: "var(--sauge)" }}
                          />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--sauge)",
                            }}
                          >
                            Net à reverser au propriétaire
                          </p>
                          <p
                            style={{
                              fontSize: 11.5,
                              color: "var(--sauge)",
                              opacity: 0.75,
                            }}
                          >
                            Après charges et commission d&apos;agence
                          </p>
                        </div>
                      </div>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 24,
                          fontWeight: 600,
                          color: "var(--sauge)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {fmtAmount(report.summary.netPayableToOwner)} FCFA
                      </p>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      padding: "14px 18px",
                      background: "var(--paper-raised)",
                      border: "1px solid var(--paper-line)",
                      borderRadius: "var(--r-md)",
                      fontSize: 13,
                      color: "var(--ink-soft)",
                      marginBottom: 28,
                    }}
                  >
                    Rapport financier non disponible pour ce propriétaire.
                  </div>
                )}

                {/* ── Biens rattachés ── */}
                <div>
                  <div className="ep-section-label">Biens rattachés</div>

                  {(report?.properties ?? []).length === 0 ? (
                    <div
                      style={{
                        padding: "28px 0",
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--ink-soft)",
                        opacity: 0.65,
                      }}
                    >
                      Aucun bien rattaché à ce propriétaire.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 14,
                      }}
                    >
                      {(report?.properties ?? []).map((p) => {
                        const unitCount = p.unitsCount ?? 0;
                        return (
                          <div
                            key={p.propertyId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              background: "var(--paper-raised)",
                              border: "1px solid var(--paper-line)",
                              borderRadius: "var(--r-md)",
                              boxShadow: "var(--shadow-card)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "var(--r-md)",
                                  background: "rgba(28,43,39,0.05)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Building2
                                  size={14}
                                  style={{ color: "var(--ink-soft)" }}
                                />
                              </div>
                              <div>
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "var(--ink)",
                                  }}
                                >
                                  {p.propertyName}
                                </p>
                                {p.propertyCode && (
                                  <p
                                    style={{
                                      fontSize: 11.5,
                                      color: "var(--ink-soft)",
                                    }}
                                  >
                                    {p.propertyCode}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 11,
                                  color: "var(--ink-soft)",
                                }}
                              >
                                {unitCount} loca{unitCount > 1 ? "ux" : "l"}
                              </span>
                              <button
                                onClick={() => {
                                  setDetachPropertyId(p.propertyId);
                                  setDetachPropertyName(p.propertyName);
                                }}
                                className="ep-icon-btn"
                                title="Détacher ce bien"
                                style={{ color: "var(--ink-soft)" }}
                              >
                                <Link2Off size={13} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setAttachOpen(true)}
                      className="ep-btn ep-btn-ghost"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Rattacher un bien
                    </button>
                    <button
                      onClick={() => setAttachUnitOpen(true)}
                      className="ep-btn ep-btn-ghost"
                      title="Rattacher des locaux individuels — cas de copropriété"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Rattacher des locaux
                    </button>
                  </div>
                </div>

                {/* ── Informations complémentaires ── */}
                {(selectedOwner.email ||
                  selectedOwner.address ||
                  selectedOwner.bankName ||
                  selectedOwner.notes) && (
                  <div style={{ marginTop: 28 }}>
                    <div className="ep-section-label">Informations</div>
                    <div
                      className="ep-side-card"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px 24px",
                      }}
                    >
                      {selectedOwner.email && (
                        <div>
                          <p
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: "var(--ink-soft)",
                              marginBottom: 3,
                            }}
                          >
                            Email
                          </p>
                          <p style={{ fontSize: 13, color: "var(--ink)" }}>
                            {selectedOwner.email}
                          </p>
                        </div>
                      )}
                      {selectedOwner.address && (
                        <div>
                          <p
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: "var(--ink-soft)",
                              marginBottom: 3,
                            }}
                          >
                            Adresse
                          </p>
                          <p style={{ fontSize: 13, color: "var(--ink)" }}>
                            {selectedOwner.address}
                          </p>
                        </div>
                      )}
                      {selectedOwner.bankName && (
                        <div>
                          <p
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: "var(--ink-soft)",
                              marginBottom: 3,
                            }}
                          >
                            Banque
                          </p>
                          <p style={{ fontSize: 13, color: "var(--ink)" }}>
                            {selectedOwner.bankName}
                            {selectedOwner.bankAccountNumber && (
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 12,
                                  color: "var(--ink-soft)",
                                  marginLeft: 6,
                                }}
                              >
                                {selectedOwner.bankAccountNumber}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {selectedOwner.ifu && (
                        <div>
                          <p
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: "var(--ink-soft)",
                              marginBottom: 3,
                            }}
                          >
                            IFU / RCCM
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "var(--ink)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {selectedOwner.ifu}
                            {selectedOwner.rccm && (
                              <span style={{ marginLeft: 8, opacity: 0.6 }}>
                                {selectedOwner.rccm}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {selectedOwner.notes && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <p
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: "var(--ink-soft)",
                              marginBottom: 3,
                            }}
                          >
                            Notes
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "var(--ink)",
                              lineHeight: 1.55,
                            }}
                          >
                            {selectedOwner.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      <OwnerFormModal
        isOpen={formOpen}
        owner={editTarget}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSaved={handleOwnerSaved}
      />

      {selectedOwner && (
        <AttachPropertyModal
          isOpen={attachOpen}
          owner={selectedOwner}
          onClose={() => setAttachOpen(false)}
          onAttached={handleAttached}
        />
      )}

      {selectedOwner && (
        <AttachUnitModal
          isOpen={attachUnitOpen}
          owner={selectedOwner}
          onClose={() => setAttachUnitOpen(false)}
          onAttached={handleAttachedUnits}
        />
      )}

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteOwner}
        onClose={() => setDeleteOwner(null)}
        title="Supprimer ce propriétaire"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteOwner(null)}
              className="ep-btn ep-btn-ghost"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDeleteOwner}
              disabled={deleting}
              className="ep-btn"
              style={{
                background: "var(--rouge)",
                color: "white",
                border: "none",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Supprimer définitivement
            </button>
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 16px",
            background: "var(--rouge-soft)",
            border: "1px solid rgba(168,67,47,0.2)",
            borderRadius: "var(--r-md)",
          }}
        >
          <AlertTriangle
            size={15}
            style={{ color: "var(--rouge)", marginTop: 1, flexShrink: 0 }}
          />
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
            La suppression de <strong>{deleteOwner?.fullName}</strong> est
            irréversible. Les biens rattachés ne seront pas supprimés.
          </p>
        </div>
      </Modal>

      {/* Detach confirm */}
      <Modal
        isOpen={!!detachPropertyId}
        onClose={() => setDetachPropertyId(null)}
        title="Détacher ce bien"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDetachPropertyId(null)}
              className="ep-btn ep-btn-ghost"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDetachProperty}
              disabled={detaching}
              className="ep-btn ep-btn-primary"
              style={{ opacity: detaching ? 0.6 : 1 }}
            >
              {detaching && <Loader2 size={14} className="animate-spin" />}
              Confirmer
            </button>
          </div>
        }
      >
        <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
          Voulez-vous détacher <strong>{detachPropertyName}</strong> de{" "}
          <strong>{selectedOwner?.fullName}</strong> ?
          <br />
          <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>
            Le bien ne sera pas supprimé.
          </span>
        </p>
      </Modal>
    </>
  );
}
