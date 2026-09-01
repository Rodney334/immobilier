"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  DoorOpen,
  Calendar,
  Wallet,
  CreditCard,
  Pencil,
  XCircle,
  Trash2,
  FileDown,
  RefreshCw,
  Loader2,
  FileCode,
  ChevronDown,
  UserPlus,
  Clock,
} from "lucide-react";
import { leaseService } from "@/lib/services/lease.service";
import { contractTemplateService } from "@/lib/services/contract-template.service";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { GuarantorFormModal } from "@/components/features/guarantors/GuarantorFormModal";
import type { Lease, LeaseStatus, LeasePeriodicity, LeaseEvent, ContractTemplate, Guarantor } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  LeaseStatus,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "neutral" | "info";
  }
> = {
  ACTIVE: { label: "Actif", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "warning" },
  DRAFT: { label: "Brouillon", variant: "neutral" },
  EXPIRED: { label: "Expiré", variant: "neutral" },
  SUSPENDED: { label: "Suspendu", variant: "warning" },
  TERMINATED: { label: "Clôturé", variant: "neutral" },
};

const FREQ_LABELS: Record<LeasePeriodicity, string> = {
  DAILY: "Quotidien",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Le back réutilise TERMINATED aussi bien pour une résiliation que pour une
// annulation (/void) — seule la description les distingue ("ANNULÉ").
const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info" }
> = {
  CREATED: { label: "Création", variant: "success" },
  RENT_REVISED: { label: "Loyer révisé", variant: "info" },
  TERMINATED: { label: "Résilié", variant: "danger" },
  TRANSFERRED: { label: "Transféré", variant: "warning" },
  NOTE_ADDED: { label: "Modifié", variant: "neutral" },
};
function getEventCfg(ev: LeaseEvent) {
  if (ev.eventType === "TERMINATED" && ev.description?.toUpperCase().includes("ANNULÉ")) {
    return { label: "Annulé", variant: "warning" as const };
  }
  return EVENT_TYPE_CONFIG[ev.eventType] ?? { label: ev.eventType, variant: "neutral" as const };
}
function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " XOF";
}
function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-custom last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-primary/50" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-0.5">
          {label}
        </p>
        <div className="text-[13px] text-primary">{value}</div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  loading,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium
                 transition-colors disabled:opacity-50
                 ${
                   variant === "danger"
                     ? "text-danger hover:bg-danger/5 border border-danger/20 hover:border-danger/40"
                     : "text-primary hover:bg-primary/4 border border-border-custom hover:border-primary/30"
                 }`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Icon size={14} />
      )}
      {label}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

// ─── Composant : Générer PDF avec sélecteur de template ──────────────────────

function GeneratePdfAction({ leaseId }: { leaseId: string }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  async function loadTemplates() {
    if (loaded) { setOpen(o => !o); return; }
    try {
      const res = await contractTemplateService.list();
      const list = Array.isArray(res.data) ? res.data : [];
      setTemplates(list);
      // Ne pas pré-sélectionner : selectedId reste "" → templateId omis → backend choisit automatiquement
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les modèles de contrat.";
      toast({ variant: "danger", title: msg });
    } finally {
      setLoaded(true);
      setOpen(true);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const blob = await contractTemplateService.downloadPdf(leaseId, selectedId || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrat-${leaseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de la génération du PDF.";
      toast({ variant: "danger", title: msg });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <button
        onClick={loadTemplates}
        className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium
                   transition-colors text-primary hover:bg-primary/4 border border-border-custom hover:border-primary/30`}
      >
        <FileCode size={14} />
        <span style={{ flex: 1 }}>Générer le contrat PDF</span>
        <ChevronDown size={13} style={{
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          opacity: 0.5,
        }} />
      </button>

      {open && (
        <div style={{
          marginTop: 4, padding: "10px 12px",
          background: "var(--paper-raised, #f8f6f1)",
          border: "1px solid var(--paper-line, rgba(0,0,0,0.1))",
          borderRadius: "var(--r-sm, 6px)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div>
            <label style={{
              display: "block", fontSize: 11,
              textTransform: "uppercase", letterSpacing: "0.06em",
              color: "var(--ink-soft)", marginBottom: 4, fontWeight: 500,
            }}>
              Template
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{
                width: "100%", height: 34, padding: "0 8px",
                borderRadius: "var(--r-sm, 6px)",
                border: "1px solid var(--paper-line, rgba(0,0,0,0.12))",
                background: "var(--paper)", fontSize: 12,
                outline: "none",
              }}
            >
              <option value="">— Automatique (selon le type de bail) —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.isDefault ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
            style={{
              background: "var(--terracotta, #c1622d)",
              color: "white", border: "none", cursor: "pointer",
              opacity: generating ? 0.7 : 1,
            }}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
            {generating ? "Génération…" : "Télécharger le PDF"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type Tab = "details" | "actions" | "history";

type Props = {
  lease: Lease;
  onClose: () => void;
  onEdit: (l: Lease) => void;
  onTerminate: (l: Lease) => void;
  onVoid: (l: Lease) => void;
  onDeleted: (l: Lease) => void;
  onUpdated: (l: Lease) => void;
};

export function LeaseDetailPanel({
  lease,
  onClose,
  onEdit,
  onTerminate,
  onVoid,
  onDeleted,
  onUpdated,
}: Props) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [generatingScheds, setGeneratingScheds] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [guarantorModalOpen, setGuarantorModalOpen] = useState(false);
  const [events, setEvents] = useState<LeaseEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const cfg = STATUS_CONFIG[lease.status];
  const tenantName =
    lease.tenant?.fullName ??
    (lease.tenant
      ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
      : lease.tenantId);
  const unitLabel = lease.unit
    ? `Local ${lease.unit.unitNumber}`
    : lease.unitId;
  const daysLeft = lease.endDate ? daysUntil(lease.endDate) : Infinity;
  const isActive = lease.status === "ACTIVE";
  const isTerminated = lease.status === "TERMINATED";

  useEffect(() => {
    setEvents([]);
    setEventsLoaded(false);
  }, [lease.id]);

  useEffect(() => {
    if (activeTab !== "history" || eventsLoaded) return;
    setEventsLoading(true);
    leaseService
      .getEvents(lease.id)
      .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Impossible de charger l'historique.";
        toast({ variant: "danger", title: msg });
      })
      .finally(() => {
        setEventsLoading(false);
        setEventsLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, eventsLoaded, lease.id]);

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const blob = await leaseService.downloadContractPdf(lease.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrat-${lease.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec du téléchargement du PDF.";
      toast({ variant: "danger", title: msg });
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleGenerateSchedules() {
    setGeneratingScheds(true);
    try {
      await leaseService.generateSchedules(lease.id);
      toast({ variant: "success", title: "Échéances générées." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de la génération des échéances.";
      toast({ variant: "danger", title: msg });
    } finally {
      setGeneratingScheds(false);
    }
  }

  // Un seul bouton "Supprimer" plutôt que de précalculer si le contrat a des
  // échéances/paiements : on tente la suppression, et si le back refuse à
  // cause de dépendances, on bascule automatiquement vers l'annulation
  // (PATCH /void), qui elle demande un motif.
  async function handleDelete() {
    if (
      !confirm(
        `Supprimer définitivement le contrat de ${tenantName} ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await leaseService.delete(lease.id);
      toast({ variant: "success", title: "Contrat supprimé." });
      onDeleted(lease);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
      if (msg.includes("dépendances")) {
        toast({
          variant: "warning",
          title: "Ce contrat a déjà des échéances liées — utilisez l'annulation à la place.",
          duration: 6000,
        });
        onVoid(lease);
      } else {
        toast({ variant: "danger", title: msg });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <aside
      className="flex flex-col w-105 shrink-0 bg-surface border-l border-border-custom h-screen sticky top-0 overflow-hidden"
      aria-label={`Contrat : ${tenantName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border-custom shrink-0">
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {isActive && daysLeft <= 30 && (
              <Badge variant="warning" dot>
                {daysLeft}j restants
              </Badge>
            )}
          </div>
          <h2 className="font-semibold text-[17px] text-primary truncate">
            {tenantName}
          </h2>
          <p className="text-[12px] text-primary/40 mt-0.5">{unitLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/6 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-custom shrink-0">
        {(["details", "history", "actions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[13px] font-medium transition-colors
              ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-primary/40 hover:text-primary"}`}
          >
            {tab === "details" ? "Détails" : tab === "history" ? "Historique" : "Actions"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5">
        {/* Details tab */}
        {activeTab === "details" && (
          <>
            <DetailRow icon={User} label="Locataire" value={tenantName} />
            <DetailRow icon={DoorOpen} label="Local" value={unitLabel} />
            <DetailRow
              icon={Wallet}
              label="Loyer mensuel"
              value={
                <span className="tabular-nums">
                  {formatXOF(Number(lease.monthlyRent))}
                </span>
              }
            />
            {lease.depositAmount != null && (
              <DetailRow
                icon={CreditCard}
                label="Caution"
                value={
                  <span className="tabular-nums">
                    {formatXOF(Number(lease.depositAmount))}
                  </span>
                }
              />
            )}
            <DetailRow
              icon={RefreshCw}
              label="Périodicité"
              value={lease.periodicity ? (FREQ_LABELS[lease.periodicity] ?? lease.periodicity) : "-"}
            />
            <DetailRow
              icon={Calendar}
              label="Début"
              value={formatDate(lease.startDate)}
            />
            <DetailRow
              icon={Calendar}
              label="Fin"
              value={
                <span
                  className={
                    isActive && daysLeft <= 30
                      ? "text-secondary font-semibold"
                      : ""
                  }
                >
                  {lease.endDate ? formatDate(lease.endDate) : '—'}
                  {isActive && daysLeft > 0 && daysLeft !== Infinity && ` (${daysLeft} j)`}
                </span>
              }
            />
            {lease.terminationDate && (
              <DetailRow
                icon={XCircle}
                label="Résilié le"
                value={formatDate(lease.terminationDate)}
              />
            )}
            {lease.terminationReason && (
              <div className="py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-1.5">
                  Motif de résiliation
                </p>
                <p className="text-[13px] text-primary/70">
                  {lease.terminationReason}
                </p>
              </div>
            )}
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div className="py-4">
            {eventsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-primary/40" />
              </div>
            )}
            {!eventsLoading && eventsLoaded && events.length === 0 && (
              <p className="text-[13px] text-primary/40 text-center py-8">
                Aucun événement enregistré.
              </p>
            )}
            {!eventsLoading && events.length > 0 && (
              <div>
                {events.map((ev) => {
                  const evCfg = getEventCfg(ev);
                  return (
                    <div
                      key={ev._id ?? ev.id}
                      className="flex items-start gap-3 py-3 border-b border-border-custom last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={14} className="text-primary/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={evCfg.variant}>{evCfg.label}</Badge>
                          <span className="text-[11px] text-primary/40">
                            {formatDateTime(ev.eventDate)}
                          </span>
                        </div>
                        <p className="text-[13px] text-primary/80 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions tab */}
        {activeTab === "actions" && (
          <div className="py-4 space-y-2.5">
            <ActionButton
              icon={Pencil}
              label="Modifier le contrat"
              onClick={() => onEdit(lease)}
            />
            <ActionButton
              icon={FileDown}
              label="Télécharger le PDF"
              onClick={handleDownloadPdf}
              loading={downloadingPdf}
            />
            <GeneratePdfAction leaseId={lease.id} />
            <ActionButton
              icon={RefreshCw}
              label="Générer les échéances"
              onClick={handleGenerateSchedules}
              loading={generatingScheds}
            />
            <ActionButton
              icon={UserPlus}
              label="Ajouter un garant"
              onClick={() => setGuarantorModalOpen(true)}
            />
            {isActive && (
              <ActionButton
                icon={XCircle}
                label="Résilier le contrat"
                onClick={() => onTerminate(lease)}
                variant="danger"
              />
            )}
            {!isActive && !isTerminated && (
              <ActionButton
                icon={Trash2}
                label="Supprimer le contrat"
                onClick={handleDelete}
                variant="danger"
                loading={deleting}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal garant */}
      <GuarantorFormModal
        isOpen={guarantorModalOpen}
        onClose={() => setGuarantorModalOpen(false)}
        onSaved={(_g: Guarantor) => {
          setGuarantorModalOpen(false);
        }}
        leases={[lease]}
      />
    </aside>
  );
}
