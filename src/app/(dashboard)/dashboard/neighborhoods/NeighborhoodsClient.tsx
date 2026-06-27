"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  MapPin,
  Loader2,
  AlertTriangle,
  X,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { neighborhoodService } from "@/lib/services/neighborhood.service";
import { propertyService } from "@/lib/services/property.service";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
  Neighborhood,
  CreateNeighborhoodPayload,
  Property,
} from "@/types";

// ─── Form Modal ───────────────────────────────────────────────────────────────

function NeighborhoodFormModal({
  isOpen,
  neighborhood,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  neighborhood: Neighborhood | null;
  onClose: () => void;
  onSaved: (n: Neighborhood) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(neighborhood?.name ?? "");
      setDescription(neighborhood?.description ?? "");
      setError(null);
    }
  }, [isOpen, neighborhood]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload: CreateNeighborhoodPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
    };
    try {
      let saved: Neighborhood;
      if (neighborhood) {
        const res = await neighborhoodService.update(neighborhood.id, payload);
        saved = res.data;
        toast({
          variant: "success",
          title: "Quartier mis a jour",
          description: saved.name,
        });
      } else {
        const res = await neighborhoodService.create(payload);
        saved = res.data;
        toast({
          variant: "success",
          title: "Quartier cree",
          description: saved.name,
        });
      }
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={neighborhood ? "Modifier le quartier" : "Nouveau quartier"}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors duration-150 disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="nbh-form"
            disabled={submitting}
            className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {neighborhood ? "Enregistrer" : "Creer le quartier"}
          </button>
        </div>
      }
    >
      <form id="nbh-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Info banner */}
        {!neighborhood && (
          <div className="px-4 py-3 rounded-lg bg-primary/4 border border-primary/10 text-[12px] text-primary/60">
            Ordre de creation recommande : Quartier - Propriete - Local -
            Locataire - Bail
          </div>
        )}
        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/50 mb-1.5">
            Nom du quartier <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. AKPAKPA SODJEATINME"
            className="w-full h-10 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          />
          <p className="text-[11px] text-primary/40 mt-1">
            Le nom sera normalise automatiquement en majuscules.
          </p>
        </div>
        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/50 mb-1.5">
            Description (optionnel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Informations complementaires sur ce quartier..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors resize-none"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </form>
    </Modal>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  neighborhood,
  loadingProps,
  onEdit,
  onDelete,
  onClose,
}: {
  neighborhood: Neighborhood;
  loadingProps: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="w-72 shrink-0 border-l border-border-custom bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
        <h2 className="font-semibold text-[15px] text-primary truncate">
          {neighborhood.name}
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/6 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Code badge */}
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-mono bg-primary/6 text-primary/60 tracking-widest">
          {neighborhood.code}
        </span>

        {/* Info */}
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35">
            Info
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] text-primary/40">Code</p>
              <p className="text-[13px] font-medium text-primary">
                {neighborhood.code}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-primary/40">Description</p>
              <p className="text-[13px] text-primary">
                {neighborhood.description || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-primary/40">Cree le</p>
              <p className="text-[13px] text-primary tabular-nums">
                {formatDate(neighborhood.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35">
            Proprietes liees
          </p>
          {loadingProps ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-primary/4 animate-pulse"
                />
              ))}
            </div>
          ) : neighborhood.properties.length === 0 ? (
            <p className="text-[12px] text-primary/40 italic">
              Aucune propriete dans ce quartier.
            </p>
          ) : (
            <div className="space-y-2">
              {neighborhood.properties.map((p, i) => (
                <div
                  key={p.id + i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border-custom hover:border-primary/20 hover:bg-primary/3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-primary truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-primary/40">
                      {p.totalUnits} local
                      {p.totalUnits && p.totalUnits > 1 ? "aux" : ""}
                    </p>
                  </div>
                  <a
                    href={`/dashboard/properties`}
                    className="shrink-0 text-[11px] text-secondary hover:underline font-medium ml-2"
                  >
                    Voir
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-border-custom p-4 space-y-2">
        <button
          onClick={onEdit}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-lg border border-border-custom text-[13px] font-medium text-primary/70 hover:text-primary hover:border-primary/30 transition-colors"
        >
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-lg text-[13px] font-medium text-danger/70 hover:text-danger hover:bg-danger/6 transition-colors"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

// ─── Row actions ⋮ ────────────────────────────────────────────────────────────

function RowMenu({
  onEdit,
  onDelete,
  onViewProps,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onViewProps: () => void;
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
          <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]">
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors flex items-center gap-2"
            >
              Modifier
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onViewProps();
              }}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors flex items-center gap-2"
            >
              <ExternalLink size={12} /> Voir les proprietes
            </button>
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

// ─── Mobile card ─────────────────────────────────────────────────────────────

function NeighborhoodCard({
  neighborhood,
  onClick,
  onEdit,
  onDelete,
  onViewProps,
}: {
  neighborhood: Neighborhood;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewProps: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border-custom rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-primary/50" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-primary truncate">
              {neighborhood.name} - Propriétés liées :{" "}
              {neighborhood.properties.length}
            </p>
            <p className="text-[12px] text-primary/50 font-mono truncate">
              {neighborhood.code}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <RowMenu
            onEdit={onEdit}
            onDelete={onDelete}
            onViewProps={onViewProps}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="col-span-2">
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Description
          </p>
          <p className="text-[12px] text-primary/70 truncate">
            {neighborhood.description || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function NeighborhoodsClient() {
  const { toast } = useToast();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [filtered, setFiltered] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Neighborhood | null>(null);
  const [selectedProps, setSelectedProps] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Neighborhood | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Neighborhood | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await neighborhoodService.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setNeighborhoods(list);
      setFiltered(list);
    } catch {
      setError("Impossible de charger les quartiers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  console.log({ filtered });

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      !q
        ? neighborhoods
        : neighborhoods.filter(
            (n) =>
              n.name.toLowerCase().includes(q) ||
              n.code.toLowerCase().includes(q) ||
              (n.description ?? "").toLowerCase().includes(q),
          ),
    );
  }, [search, neighborhoods]);

  // Load linked properties when selecting a neighborhood
  useEffect(() => {
    if (!selected) {
      setSelectedProps([]);
      return;
    }
    setLoadingProps(true);
    propertyService
      .getAll({ neighborhood: selected.id, limit: 50 })
      .then((res) => setSelectedProps(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSelectedProps([]))
      .finally(() => setLoadingProps(false));
  }, [selected]);

  function handleSaved(n: Neighborhood) {
    setNeighborhoods((prev) => {
      const idx = prev.findIndex((x) => x.id === n.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = n;
        return next;
      }
      return [n, ...prev];
    });
    if (selected?.id === n.id) setSelected(n);
    setFormOpen(false);
    setEditTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await neighborhoodService.delete(deleteTarget.id);
      setNeighborhoods((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      toast({
        variant: "success",
        title: "Quartier supprime",
        description: deleteTarget.name,
      });
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer ce quartier.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="ep-topbar" style={{ paddingBottom: 20 }}>
            <div>
              <p className="ep-eyebrow">Parc immobilier</p>
              <h1 className="ep-page-title">Quartiers</h1>
            </div>
            <div className="ep-topbar-actions">
              <div className="ep-search">
                <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chercher un quartier..."
                />
              </div>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                className="ep-btn ep-btn-primary"
              >
                <Plus size={15} /> Nouveau quartier
              </button>
            </div>
          </div>

          {error && (
            <div style={{ margin: "0 32px 16px", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--rouge-soft)", border: "1px solid var(--rouge)", fontSize: 13, color: "var(--rouge)" }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={22} className="animate-spin text-primary/30" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={MapPin}
                  title={search ? "Aucun resultat" : "Aucun quartier"}
                  description={
                    search
                      ? `Aucun quartier ne correspond a "${search}".`
                      : "Creez votre premier quartier pour organiser vos biens."
                  }
                  actionLabel={search ? undefined : "Ajouter un quartier"}
                  onAction={
                    search
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
                          "Code",
                          "Nom",
                          "Description",
                          "Proprietes liees",
                          "",
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
                      {filtered.map((n) => (
                        <tr
                          key={n.id}
                          onClick={() =>
                            setSelected((p) => (p?.id === n.id ? null : n))
                          }
                          className="ep-tr"
                          style={selected?.id === n.id ? { background: "var(--secondary-soft)", borderLeft: "2px solid var(--secondary)" } : undefined}
                        >
                          <td className="ep-td">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-primary/6 text-primary/60 tracking-wider">
                              {n.code}
                            </span>
                          </td>
                          <td className="ep-td">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/6 flex items-center justify-center shrink-0">
                                <MapPin size={14} className="text-primary/50" />
                              </div>
                              <p className="text-[13px] font-medium text-primary truncate">
                                {n.name}
                              </p>
                            </div>
                          </td>
                          <td className="ep-td text-primary/50 max-w-50 truncate">
                            {n.description || "—"}
                          </td>
                          <td className="ep-td ep-mono text-primary/50">
                            {n.properties.length}
                          </td>
                          <td className="ep-td">
                            <RowMenu
                              onEdit={() => {
                                setEditTarget(n);
                                setFormOpen(true);
                              }}
                              onDelete={() => setDeleteTarget(n)}
                              onViewProps={() => {
                                setSelected(n);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                {/* Cards mobiles */}
                <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filtered.map((n) => (
                    <NeighborhoodCard
                      key={n.id}
                      neighborhood={n}
                      onClick={() =>
                        setSelected((p) => (p?.id === n.id ? null : n))
                      }
                      onEdit={() => {
                        setEditTarget(n);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleteTarget(n)}
                      onViewProps={() => setSelected(n)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <DetailPanel
            neighborhood={selected}
            loadingProps={loadingProps}
            onEdit={() => {
              setEditTarget(selected);
              setFormOpen(true);
            }}
            onDelete={() => setDeleteTarget(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      <NeighborhoodFormModal
        isOpen={formOpen}
        neighborhood={editTarget}
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
        title="Supprimer ce quartier ?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}{" "}
              Supprimer
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[14px] text-primary/70 leading-relaxed">
            Vous etes sur le point de supprimer{" "}
            <span className="font-semibold text-primary">
              "{deleteTarget?.name}"
            </span>
            . Cette action est irreversible. Si des proprietes sont liees a ce
            quartier, la suppression sera bloquee.
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
