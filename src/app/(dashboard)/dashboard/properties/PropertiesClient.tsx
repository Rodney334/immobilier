"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Building2,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { propertyService } from "@/lib/services/property.service";
import { PropertyDetailPanel } from "@/components/features/properties/PropertyDetailPanel";
import { PropertyFormModal } from "@/components/features/properties/PropertyFormModal";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Property, PaginationMeta } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  Apartment: "Appartement",
  House: "Maison",
  Commercial: "Commercial",
  Office: "Bureau",
  Warehouse: "Entrepôt",
  Other: "Autre",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Table row ────────────────────────────────────────────────────────────────

function PropertyRow({
  property,
  selected,
  onClick,
}: {
  property: Property;
  selected: boolean;
  onClick: () => void;
}) {
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
            <Building2
              size={14}
              className="text-primary/50"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-primary truncate">
              {property.name}
            </p>
            {property.neighborhood && (
              <p className="text-[11px] text-primary/40 truncate">
                {property.neighborhood.name}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant="neutral">
          {TYPE_LABELS[property.type] ?? property.type}
        </Badge>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-primary/70 tabular-nums">
        {property.totalUnits}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-primary/50 max-w-50 truncate">
        {property.address}
      </td>
      <td className="px-4 py-3.5 text-[12px] text-primary/40 tabular-nums whitespace-nowrap">
        {formatDate(property.createdAt)}
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
        {from}–{to} sur {total} bien{total > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft size={15} aria-hidden="true" />
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
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

export function PropertiesClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Property | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Debounce search → reset to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await propertyService.getAll({
        page,
        limit: PAGE_LIMIT,
        search: debouncedQ || undefined,
      });
      setProperties(res.data);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les biens immobiliers.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Handlers ──

  function handleSaved(p: Property) {
    setProperties((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [p, ...prev];
    });
    if (selected?.id === p.id) setSelected(p);
    setFormOpen(false);
    setEditTarget(null);
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await propertyService.delete(deleteTarget.id);
      setProperties((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteError("Impossible de supprimer ce bien. Veuillez réessayer.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ──

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {/* List column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-custom shrink-0">
            <div>
              <h1 className="font-semibold text-[20px] text-primary">
                Biens immobiliers
              </h1>
              {pagination && !loading && (
                <p className="text-[12px] text-primary/40 mt-0.5">
                  {pagination.total} bien{pagination.total > 1 ? "s" : ""}{" "}
                  enregistré{pagination.total > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="pl-9 pr-4 h-9 w-56 rounded-lg border border-border-custom bg-white text-[13px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors duration-150"
                />
              </div>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors duration-150"
              >
                <Plus size={15} aria-hidden="true" />
                Ajouter une propriété
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger shrink-0">
              <AlertTriangle size={14} aria-hidden="true" /> {error}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2
                  size={22}
                  className="animate-spin text-primary/30"
                  aria-hidden="true"
                />
              </div>
            ) : properties.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Building2}
                  title="Aucun bien immobilier"
                  description={
                    debouncedQ
                      ? `Aucun résultat pour « ${debouncedQ} ». Essayez un autre terme.`
                      : "Commencez par ajouter votre premier bien immobilier."
                  }
                  actionLabel={debouncedQ ? undefined : "Ajouter un bien"}
                  onAction={
                    debouncedQ
                      ? undefined
                      : () => {
                          setEditTarget(null);
                          setFormOpen(true);
                        }
                  }
                />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-neutral">
                  <tr className="border-b border-border-custom">
                    {["Bien", "Type", "Locaux", "Adresse", "Créé le"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom bg-surface">
                  {properties.map((p) => (
                    <PropertyRow
                      key={p.id}
                      property={p}
                      selected={selected?.id === p.id}
                      onClick={() =>
                        setSelected((prev) => (prev?.id === p.id ? null : p))
                      }
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

        {/* Right panel */}
        {selected && (
          <PropertyDetailPanel
            property={selected}
            onClose={() => setSelected(null)}
            onEdit={(p) => {
              setEditTarget(p);
              setFormOpen(true);
            }}
            onDelete={(p) => setDeleteTarget(p)}
          />
        )}
      </div>

      <PropertyFormModal
        key={formOpen ? (editTarget?.id ?? "new") : "closed"}
        isOpen={formOpen}
        property={editTarget}
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
        title="Supprimer ce bien ?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors duration-150"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium hover:bg-danger/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
            >
              {deleting && (
                <Loader2
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              Supprimer définitivement
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[14px] text-primary/70 leading-relaxed">
            Vous êtes sur le point de supprimer{" "}
            <span className="font-semibold text-primary">
              « {deleteTarget?.name} »
            </span>
            . Cette action est irréversible.
          </p>
          {deleteError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger">
              <AlertTriangle size={14} aria-hidden="true" /> {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
