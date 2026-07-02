"use client";

import { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Building2,
  DoorOpen,
  Calendar,
  Pencil,
  Trash2,
  Hash,
  Layers,
} from "lucide-react";
import { unitService } from "@/lib/services/unit.service";
import { Badge } from "@/components/ui/Badge";
import type { Property, Unit, UnitStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  Apartment: "Appartement",
  House: "Maison",
  Commercial: "Commercial",
  Office: "Bureau",
  Warehouse: "Entrepôt",
  Other: "Autre",
};

const UNIT_STATUS_CONFIG: Record<
  UnitStatus,
  { label: string; variant: "success" | "neutral" | "danger" | "warning" }
> = {
  OCCUPIED: { label: "Occupé", variant: "success" },
  AVAILABLE: { label: "Vacant", variant: "warning" },
  SUSPENDED: { label: "Maintenance", variant: "danger" },
  ARCHIVED: { label: "Maintenance", variant: "neutral" },
};

const UNIT_TYPE_LABELS: Record<string, string> = {
  Studio: "Studio",
  Apartment: "Appart.",
  House: "Maison",
  Office: "Bureau",
  Shop: "Boutique",
  Warehouse: "Entrepôt",
  Other: "Autre",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatXOF(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n) + " XOF";
}

// ─── Detail row ───────────────────────────────────────────────────────────────

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

// ─── Unit row ────────────────────────────────────────────────────────────────

function UnitRow({ unit }: { unit: Unit }) {
  const config = UNIT_STATUS_CONFIG[unit.status];
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-custom last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
        <Hash size={13} className="text-primary/40" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-primary">
          Local {unit.unitNumber}
          <span className="ml-1.5 text-[11px] font-normal text-primary/40">
            {UNIT_TYPE_LABELS[unit.type!] ?? unit.type}
            {unit.area ? ` · ${unit.area} m²` : ""}
          </span>
        </p>
        <p className="text-[12px] text-primary/45 tabular-nums">
          {formatXOF(unit.baseRent)} / mois
        </p>
      </div>
      <Badge variant={config.variant}>{config.label}</Badge>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "details" | "units";

type Props = {
  property: Property;
  onClose: () => void;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
};

export function PropertyDetailPanel({
  property,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  // const [units, setUnits] = useState<Unit[]>([]);
  // const [loadingU, setLoadingU] = useState(false);
  // const [unitError, setUnitError] = useState<string | null>(null);

  // Reload units when switching to units tab or when property changes
  useEffect(() => {
    if (activeTab !== "units") return;
    // setLoadingU(true);
    // setUnitError(null);
    // unitService
    //   .getAll({ property: property.id, limit: 100 })
    //   .then((res) => setUnits(res.data))
    //   .catch(() => setUnitError("Impossible de charger les locaux."))
    //   .finally(() => setLoadingU(false));
  }, [activeTab, property.id]);

  // Reset tab on property change
  useEffect(() => {
    setActiveTab("details");
  }, [property.id]);

  const occupiedCount = property.units.filter(
    (u) => u.status === "OCCUPIED",
  ).length;

  return (
    <aside
      className="flex flex-col w-105 shrink-0 bg-surface border-l border-border-custom h-screen sticky top-0 overflow-hidden"
      aria-label={`Détails : ${property.name}`}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border-custom shrink-0">
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Building2
                size={15}
                className="text-primary/60"
                aria-hidden="true"
              />
            </div>
            <Badge variant="neutral">
              {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
            </Badge>
          </div>
          <h2 className="font-semibold text-[18px] text-primary leading-snug truncate">
            {property.name}
          </h2>
          <p className="text-[12px] text-primary/40 mt-0.5 truncate">
            {property.address}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/6 transition-colors duration-150 shrink-0"
          aria-label="Fermer"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-custom shrink-0">
        <button
          onClick={() => onEdit(property)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-primary border border-border-custom hover:border-primary/30 hover:bg-primary/4 transition-colors duration-150"
        >
          <Pencil size={13} aria-hidden="true" />
          Modifier
        </button>
        <button
          onClick={() => onDelete(property)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-danger border border-danger/20 hover:border-danger/40 hover:bg-danger/5 transition-colors duration-150"
        >
          <Trash2 size={13} aria-hidden="true" />
          Supprimer
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border-custom shrink-0">
        {(["details", "units"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[13px] font-medium transition-colors duration-150
              ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-primary/40 hover:text-primary"
              }`}
          >
            {tab === "details" ? (
              "Détails"
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Locaux
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full
                  ${activeTab === "units" ? "bg-primary text-white" : "bg-primary/8 text-primary/60"}`}
                >
                  {property.units.length}
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Details tab */}
        {activeTab === "details" && (
          <div className="px-5">
            <DetailRow icon={MapPin} label="Adresse" value={property.address} />
            <DetailRow
              icon={Building2}
              label="Type"
              value={PROPERTY_TYPE_LABELS[property.type] ?? property.type}
            />
            <DetailRow
              icon={Layers}
              label="Quartier"
              value={
                property.neighborhood ? (
                  property.neighborhood.name
                ) : (
                  <span className="text-primary/30">—</span>
                )
              }
            />
            <DetailRow
              icon={DoorOpen}
              label="Locaux"
              value={`${property.units.length} local${property.units.length! > 1 ? "aux" : ""} au total`}
            />
            <DetailRow
              icon={Calendar}
              label="Créé le"
              value={formatDate(property.createdAt)}
            />
            <DetailRow
              icon={Calendar}
              label="Modifié le"
              value={formatDate(property.updatedAt)}
            />
            {property.description && (
              <div className="py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-2">
                  Description
                </p>
                <p className="text-[13px] text-primary/70 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Units tab */}
        {activeTab === "units" && (
          <div className="px-5">
            {
              // loadingU ? (
              //   <div className="space-y-1 pt-2">
              //     {Array.from({ length: 4 }).map((_, i) => (
              //       <div
              //         key={i}
              //         className="flex items-center gap-3 py-3 border-b border-border-custom"
              //       >
              //         <div className="w-8 h-8 rounded-lg bg-primary/6 animate-pulse shrink-0" />
              //         <div className="flex-1 space-y-1.5">
              //           <div className="h-3 bg-primary/8 rounded w-2/3 animate-pulse" />
              //           <div className="h-3 bg-primary/5 rounded w-1/3 animate-pulse" />
              //         </div>
              //       </div>
              //     ))}
              //   </div>
              // ) :
              // : unitError ? (
              //   <p className="text-[13px] text-danger py-6 text-center">
              //     {unitError}
              //   </p>
              // )
              property.units.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/6 flex items-center justify-center mb-3">
                    <DoorOpen
                      size={18}
                      className="text-primary/30"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-[13px] font-medium text-primary/50">
                    Aucun local
                  </p>
                  <p className="text-[12px] text-primary/30 mt-0.5">
                    Aucun local n&apos;est rattaché à ce bien.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="flex items-center gap-4 py-3 mb-1">
                    <span className="text-[12px] text-primary/45">
                      <span className="font-semibold text-success">
                        {occupiedCount}
                      </span>{" "}
                      occupé{occupiedCount > 1 ? "s" : ""}
                    </span>
                    <span className="text-[12px] text-primary/45">
                      <span className="font-semibold text-secondary">
                        {property.units.length - occupiedCount}
                      </span>{" "}
                      vacant
                      {property.units.length - occupiedCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  {property.units.map((u) => (
                    <UnitRow key={u.id} unit={u} />
                  ))}
                </>
              )
            }
          </div>
        )}
      </div>
    </aside>
  );
}
