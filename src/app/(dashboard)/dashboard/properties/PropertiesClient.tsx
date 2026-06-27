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

// ─── Mobile card ─────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  onClick,
}: {
  property: Property;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border-custom rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-primary/50" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-primary truncate">
              {property.name}
            </p>
            <p className="text-[12px] text-primary/50 truncate">
              {property.neighborhood?.name ?? "—"}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Badge variant="neutral">
            {TYPE_LABELS[property.type] ?? property.type}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Type
          </p>
          <p className="text-[12px] text-primary/70">
            {TYPE_LABELS[property.type] ?? property.type}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Locaux liés
          </p>
          <p className="text-[12px] text-primary/70 tabular-nums">
            {property.units.length ?? "—"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Créé le
          </p>
          <p className="text-[12px] text-primary/70 tabular-nums">
            {formatDate(property.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
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
      className="ep-tr"
      style={selected ? { background: "var(--secondary-soft)", borderLeft: "2px solid var(--secondary)" } : undefined}
    >
      <td className="ep-td">
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
      <td className="ep-td">
        <Badge variant="neutral" stamp>
          {TYPE_LABELS[property.type] ?? property.type}
        </Badge>
      </td>
      <td className="ep-td ep-mono tabular-nums text-primary/70">
        {property.units.length}
      </td>
      <td className="ep-td text-primary/50 max-w-50 truncate">
        {property.address}
      </td>
      <td className="ep-td ep-mono text-primary/40 tabular-nums whitespace-nowrap">
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
    <div className="ep-pagination">
      <span>{from}–{to} sur {total} bien{total > 1 ? "s" : ""}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button className="ep-page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1}><ChevronLeft size={13} /></button>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "0 8px" }}>Page {page} / {totalPages}</span>
        <button className="ep-page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages}><ChevronRight size={13} /></button>
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
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* List column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="ep-topbar" style={{ paddingBottom: 20 }}>
            <div>
              <p className="ep-eyebrow">Parc immobilier</p>
              <h1 className="ep-page-title">Propriétés</h1>
            </div>
            <div className="ep-topbar-actions">
              <div className="ep-search">
                <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                />
              </div>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                className="ep-btn ep-btn-primary"
              >
                <Plus size={15} aria-hidden="true" />
                Ajouter une propriété
              </button>
            </div>
          </div>

          {error && (
            <div style={{ margin: "0 32px 16px", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--rouge-soft)", border: "1px solid var(--rouge)", fontSize: 13, color: "var(--rouge)" }}>
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
              <>
                {/* Table desktop */}
                <div className="hidden lg:block px-4 lg:px-6 py-3">
                  <div className="ep-panel">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border-custom">
                        {[
                          "Bien",
                          "Type",
                          "Locaux liés",
                          "Adresse",
                          "Créé le",
                        ].map((h) => (
                          <th
                            key={h}
                            className="ep-th"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom bg-surface">
                      {properties.map((p) => (
                        <PropertyRow
                          key={p.id}
                          property={p}
                          selected={selected?.id === p.id}
                          onClick={() =>
                            setSelected((prev) =>
                              prev?.id === p.id ? null : p,
                            )
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                {/* Cards mobiles */}
                <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onClick={() =>
                        setSelected((prev) => (prev?.id === p.id ? null : p))
                      }
                    />
                  ))}
                </div>
              </>
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
