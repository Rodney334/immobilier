"use client";

import { useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { tenantService } from "@/lib/services/tenant.service";
import { Badge } from "@/components/ui/Badge";
import type { Tenant, TenantStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TenantStatus,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  ACTIVE: { label: "Actif", variant: "success" },
  INACTIVE: { label: "Inactif", variant: "warning" },
  BLACKLISTED: { label: "Archivé", variant: "danger" },
};

const ID_TYPE_LABELS: Record<string, string> = {
  NationalId: "Carte d'identité",
  Passport: "Passeport",
  DriverLicense: "Permis de conduire",
  ResidencePermit: "Titre de séjour",
  Other: "Autre",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-custom last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-primary/50" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-0.5">
          {label}
        </p>
        <p className="text-[13px] text-primary">{value}</p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  tenant: Tenant;
  onClose: () => void;
  onEdit: (t: Tenant) => void;
  onDelete: (t: Tenant) => void;
  onStatusChange: (t: Tenant) => void;
};

export function TenantDetailPanel({
  tenant,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: Props) {
  const [archiving, setArchiving] = useState(false);

  const config = STATUS_CONFIG[tenant.status];
  const fullName = tenant.fullName ?? `${tenant.firstName} ${tenant.lastName}`;
  const initials =
    `${tenant.firstName![0]}${tenant.lastName![0]}`.toUpperCase();
  const isArchived = tenant.isArchived || tenant.status === "BLACKLISTED";

  async function handleArchiveToggle() {
    setArchiving(true);
    try {
      const res = isArchived
        ? await tenantService.restore(tenant.id)
        : await tenantService.archive(tenant.id);
      onStatusChange(res.data);
    } catch {
      // silencieux — l'erreur peut être affichée par le parent si besoin
    } finally {
      setArchiving(false);
    }
  }

  return (
    <aside
      className="flex flex-col w-105 shrink-0 bg-surface border-l border-border-custom h-screen sticky top-0 overflow-hidden"
      aria-label={`Détails : ${fullName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border-custom shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
          <div className="w-11 h-11 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
            <span className="text-[15px] font-semibold text-primary/60">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-semibold text-[18px] text-primary truncate">
                {fullName}
              </h2>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/6 transition-colors shrink-0"
          aria-label="Fermer"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border-custom shrink-0">
        <button
          onClick={() => onEdit(tenant)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-primary border border-border-custom hover:border-primary/30 hover:bg-primary/4 transition-colors"
        >
          <Pencil size={13} aria-hidden="true" /> Modifier
        </button>

        <button
          onClick={handleArchiveToggle}
          disabled={archiving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium
                     transition-colors disabled:opacity-50
                     ${
                       isArchived
                         ? "text-success border border-success/20 hover:bg-success/5"
                         : "text-secondary border border-secondary/20 hover:bg-secondary/5"
                     }`}
        >
          {archiving ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : isArchived ? (
            <RotateCcw size={13} aria-hidden="true" />
          ) : (
            <Archive size={13} aria-hidden="true" />
          )}
          {isArchived ? "Restaurer" : "Archiver"}
        </button>

        <button
          onClick={() => onDelete(tenant)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-danger border border-danger/20 hover:border-danger/40 hover:bg-danger/5 transition-colors"
        >
          <Trash2 size={13} aria-hidden="true" /> Supprimer
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-5">
        <DetailRow icon={User} label="Nom complet" value={fullName} />
        <DetailRow icon={Mail} label="Email" value={tenant.email} />
        <DetailRow icon={Phone} label="Téléphone" value={tenant.phone} />
        <DetailRow
          icon={CreditCard}
          label="Pièce d'identité"
          value={
            tenant.identityType
              ? `${ID_TYPE_LABELS[tenant.identityType] ?? tenant.identityType}${tenant.identityNumber ? ` · ${tenant.identityNumber}` : ""}`
              : undefined
          }
        />
        <DetailRow
          icon={MapPin}
          label="Adresse"
          value={[tenant.address].filter(Boolean).join(", ") || undefined}
        />
        <DetailRow
          icon={Calendar}
          label="Créé le"
          value={formatDate(tenant.createdAt)}
        />
        <DetailRow
          icon={Calendar}
          label="Modifié le"
          value={formatDate(tenant.updatedAt)}
        />
      </div>
    </aside>
  );
}
