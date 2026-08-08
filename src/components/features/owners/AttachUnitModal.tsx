"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Home } from "lucide-react";
import { unitService } from "@/lib/services/unit.service";
import { ownerService } from "@/lib/services/owner.service";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/types/api";
import type { Owner, Unit } from "@/types";

type Props = {
  owner: Owner;
  isOpen: boolean;
  onClose: () => void;
  onAttached: () => void;
};

// Rattachement en masse de locaux individuels — cas de copropriété : un
// immeuble appartient à un propriétaire, mais certains locaux (revendus)
// appartiennent à quelqu'un d'autre. Par défaut un local suit son immeuble ;
// on ne s'en sert que pour ce cas précis.
export function AttachUnitModal({ owner, isOpen, onClose, onAttached }: Props) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badIds, setBadIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setSelected(new Set());
    setError(null);
    setBadIds([]);
    setLoading(true);
    unitService
      .getAll({ limit: 500 })
      .then((res) => setUnits(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filtered = units.filter((u) => {
    const label = `${u.unitNumber} ${u.label ?? ""} ${u.property?.name ?? ""}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAttach() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    setBadIds([]);
    const ids = Array.from(selected);
    try {
      await ownerService.attachUnits(owner.id, ids);
      onAttached();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const missing = (err.data as { missing?: string[] } | undefined)?.missing;
        if (missing && missing.length > 0) {
          setBadIds(missing);
          setError(
            `${missing.length} local${missing.length > 1 ? "ux" : ""} introuvable${missing.length > 1 ? "s" : ""} — rien n'a été rattaché.`,
          );
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rattacher des locaux (copropriété)"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="ep-btn ep-btn-ghost">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleAttach}
            disabled={selected.size === 0 || submitting}
            className="ep-btn ep-btn-primary"
            style={{ opacity: selected.size === 0 || submitting ? 0.6 : 1 }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Rattacher {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -4 }}>
          À utiliser seulement quand un local appartient à un propriétaire différent de
          celui de son immeuble. Un local non rattaché ici suit automatiquement le
          propriétaire de son immeuble.
        </p>

        <div className="ep-search">
          <Search size={13} style={{ flexShrink: 0, opacity: 0.45 }} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un local (numéro, immeuble)…"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "28px 0" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", opacity: 0.65, padding: "24px 0" }}>
              {search ? "Aucun résultat" : "Aucun local disponible"}
            </p>
          ) : (
            filtered.map((u) => {
              const isSelected = selected.has(u.id);
              const isBad = badIds.includes(u.id);
              const alreadyOwner = u.ownerId === owner.id;
              return (
                <label
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: "var(--r-md)",
                    border: isBad
                      ? "1px solid rgba(168,67,47,0.4)"
                      : isSelected
                      ? "1px solid rgba(193,98,45,0.35)"
                      : "1px solid var(--paper-line)",
                    background: isBad
                      ? "var(--rouge-soft)"
                      : isSelected
                      ? "rgba(193,98,45,0.05)"
                      : "var(--paper-raised)",
                    cursor: alreadyOwner ? "default" : "pointer",
                    opacity: alreadyOwner ? 0.55 : 1,
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={alreadyOwner}
                    onChange={() => toggle(u.id)}
                    style={{ flexShrink: 0, accentColor: "var(--terracotta)" }}
                  />
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: "var(--r-md)",
                      background: isSelected ? "rgba(193,98,45,0.1)" : "rgba(28,43,39,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    <Home size={13} style={{ color: isSelected ? "var(--terracotta)" : "var(--ink-soft)" }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                      Local {u.unitNumber}{u.label ? ` — ${u.label}` : ""}
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                      {[
                        u.property?.name,
                        alreadyOwner ? "déjà rattaché à ce propriétaire" : null,
                        isBad ? "identifiant invalide" : null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {error && <p style={{ fontSize: 12, color: "var(--rouge)" }}>{error}</p>}
      </div>
    </Modal>
  );
}
