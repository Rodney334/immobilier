"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  DoorOpen,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { unitService } from "@/lib/services/unit.service";
import { UnitDetailPanel } from "@/components/features/units/UnitDetailPanel";
import { UnitFormModal } from "@/components/features/units/UnitFormModal";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Unit, UnitStatus, PaginationMeta } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  UnitStatus,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  OCCUPIED: { label: "Occupé", variant: "success" },
  AVAILABLE: { label: "Vacant", variant: "neutral" },
  SUSPENDED: { label: "Maintenance", variant: "warning" },
  ARCHIVED: { label: "Archivé", variant: "danger" },
};

const TYPE_LABELS: Record<string, string> = {
  Studio: "Studio",
  Apartment: "Appartement",
  House: "Maison",
  Office: "Bureau",
  Shop: "Commerce",
  Warehouse: "Entrepôt",
  Other: "Autre",
};

const STATUS_FILTERS: { label: string; value: UnitStatus | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "Occupé", value: "OCCUPIED" },
  { label: "Vacant", value: "AVAILABLE" },
  { label: "Maintenance", value: "SUSPENDED" },
  { label: "Archivé", value: "ARCHIVED" },
];

const fmt = new Intl.NumberFormat("fr-FR");

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function UnitRowActions({
  unit,
  onEdit,
  onMarkVacant,
  onDelete,
}: {
  unit: Unit;
  onEdit: () => void;
  onMarkVacant: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded-md flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/6 transition-colors"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]">
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors"
            >
              Modifier
            </button>
            {unit.status === "OCCUPIED" && (
              <button
                onClick={() => {
                  setOpen(false);
                  onMarkVacant();
                }}
                className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors"
              >
                Marquer vacant
              </button>
            )}
            <div className="my-1 border-t border-border-custom" />
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full text-left px-4 py-2 hover:bg-danger/6 text-danger transition-colors"
            >
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function UnitRow({
  unit,
  selected,
  onClick,
  onEdit,
  onMarkVacant,
  onDelete,
}: {
  unit: Unit;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onMarkVacant: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CONFIG[unit.status];

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors duration-100
        ${
          selected
            ? "bg-secondary/8 border-l-2 border-l-secondary"
            : "hover:bg-primary/3 border-l-2 border-l-transparent"
        }`}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/6 flex items-center justify-center shrink-0">
            <DoorOpen
              size={14}
              className="text-primary/50"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-primary truncate">
              Local {unit.unitNumber}
            </p>
            {unit.property && (
              <p className="text-[11px] text-primary/40 truncate">
                {unit.property.name}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant="neutral">{TYPE_LABELS[unit.type!] ?? unit.type}</Badge>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-primary/60">
        {unit.area ? `${unit.area} m²` : "—"}
      </td>
      <td className="px-4 py-3.5 text-[13px] font-medium text-primary tabular-nums whitespace-nowrap">
        {fmt.format(Number(unit.baseRent))} XOF
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </td>
      <td className="px-4 py-3.5 text-[12px] text-primary/40 tabular-nums whitespace-nowrap">
        {formatDate(unit.createdAt)}
      </td>
      <td className="px-3 py-3.5">
        <UnitRowActions
          unit={unit}
          onEdit={onEdit}
          onMarkVacant={onMarkVacant}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

function PaginationBar({
  meta,
  onPage,
}: {
  meta: PaginationMeta;
  onPage: (p: number) => void;
}) {
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border-custom bg-surface shrink-0">
      <p className="text-[12px] text-primary/40 tabular-nums">
        {from}–{to} sur {total} local{total > 1 ? "x" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-3 text-[13px] font-medium text-primary tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

export function UnitsClient() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Unit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await unitService.getAll({
        page,
        limit: PAGE_LIMIT,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setUnits(res.data);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les locaux.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(u: Unit) {
    setUnits((prev) => {
      const idx = prev.findIndex((x) => x.id === u.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = u;
        return n;
      }
      return [u, ...prev];
    });
    if (selected?.id === u.id) setSelected(u);
    setFormOpen(false);
    setEditTarget(null);
    load();
  }

  function handleStatusChange(u: Unit) {
    setUnits((prev) => prev.map((x) => (x.id === u.id ? u : x)));
    if (selected?.id === u.id) setSelected(u);
  }

  async function handleMarkVacant(u: Unit) {
    try {
      const res = await unitService.update(u.id, { status: "AVAILABLE" });
      handleStatusChange(res.data);
    } catch {
      // silencieux
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await unitService.delete(deleteTarget.id);
      setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteError("Impossible de supprimer ce local.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-custom shrink-0">
            <div>
              <h1 className="font-semibold text-[20px] text-primary">Locaux</h1>
              {pagination && !loading && (
                <p className="text-[12px] text-primary/40 mt-0.5">
                  {pagination.total} local{pagination.total > 1 ? "x" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors"
              >
                <Plus size={15} /> Nouveau local
              </button>
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border-custom bg-surface shrink-0">
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors
                  ${
                    statusFilter === opt.value
                      ? "bg-primary text-white"
                      : "bg-primary/6 text-primary/60 hover:bg-primary/10"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger shrink-0">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={22} className="animate-spin text-primary/30" />
              </div>
            ) : units.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={DoorOpen}
                  title="Aucun local"
                  description={
                    statusFilter !== "all"
                      ? "Aucun local avec ce statut."
                      : "Commencez par créer votre premier local."
                  }
                  actionLabel={
                    statusFilter === "all" ? "Nouveau local" : undefined
                  }
                  onAction={
                    statusFilter === "all"
                      ? () => {
                          setEditTarget(null);
                          setFormOpen(true);
                        }
                      : undefined
                  }
                />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-neutral">
                  <tr className="border-b border-border-custom">
                    {[
                      "Local",
                      "Type",
                      "Surface",
                      "Loyer",
                      "Statut",
                      "Créé le",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom bg-surface">
                  {units.map((u) => (
                    <UnitRow
                      key={u.id}
                      unit={u}
                      selected={selected?.id === u.id}
                      onClick={() =>
                        setSelected((prev) => (prev?.id === u.id ? null : u))
                      }
                      onEdit={() => {
                        setEditTarget(u);
                        setFormOpen(true);
                      }}
                      onMarkVacant={() => handleMarkVacant(u)}
                      onDelete={() => setDeleteTarget(u)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <PaginationBar meta={pagination} onPage={setPage} />
          )}
        </div>

        {selected && (
          <UnitDetailPanel
            unit={selected}
            onClose={() => setSelected(null)}
            onEdit={(u) => {
              setEditTarget(u);
              setFormOpen(true);
            }}
            onDelete={(u) => setDeleteTarget(u)}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      <UnitFormModal
        key={formOpen ? (editTarget?.id ?? "new") : "closed"}
        isOpen={formOpen}
        unit={editTarget}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSaved={handleSaved}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        title="Supprimer ce local ?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Supprimer définitivement
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[14px] text-primary/70 leading-relaxed">
            Vous êtes sur le point de supprimer{" "}
            <span className="font-semibold text-primary">
              Local {deleteTarget?.unitNumber}
            </span>
            . Cette action est irréversible.
          </p>
          {deleteError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger">
              <AlertTriangle size={14} /> {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
