"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Building2 } from "lucide-react";
import { propertyService } from "@/lib/services/property.service";
import { ownerService } from "@/lib/services/owner.service";
import { Modal } from "@/components/ui/Modal";
import type { Owner, Property } from "@/types";

type Props = {
  owner: Owner;
  isOpen: boolean;
  onClose: () => void;
  onAttached: (updatedOwner: Owner) => void;
};

export function AttachPropertyModal({ owner, isOpen, onClose, onAttached }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachedIds = new Set((owner.properties ?? []).map((p) => p.id));

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setSelected("");
    setError(null);
    setLoading(true);
    propertyService
      .getAll({ limit: 100 })
      .then((res) => {
        setProperties(res.data.filter((p) => !attachedIds.has(p.id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filtered = properties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.address ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAttach() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await ownerService.attachProperty(owner.id, selected);
      onAttached(res.data);
      onClose();
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
      title="Rattacher un bien"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="ep-btn ep-btn-ghost">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleAttach}
            disabled={!selected || submitting}
            className="ep-btn ep-btn-primary"
            style={{ opacity: !selected || submitting ? 0.6 : 1 }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Rattacher
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Subtitle */}
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -4 }}>
          Choisissez le bien à rattacher à{" "}
          <strong style={{ color: "var(--ink)" }}>{owner.fullName}</strong>.
        </p>

        {/* Search */}
        <div className="ep-search">
          <Search size={13} style={{ flexShrink: 0, opacity: 0.45 }} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un bien…"
          />
        </div>

        {/* Property list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "28px 0" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "var(--ink-soft)",
                opacity: 0.65,
                padding: "24px 0",
              }}
            >
              {search ? "Aucun résultat" : "Aucun bien disponible à rattacher"}
            </p>
          ) : (
            filtered.map((p) => {
              const isSelected = selected === p.id;
              const unitCount = p.units?.length ?? p.totalUnits ?? 0;
              return (
                <label
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: "var(--r-md)",
                    border: isSelected
                      ? "1px solid rgba(193,98,45,0.35)"
                      : "1px solid var(--paper-line)",
                    background: isSelected
                      ? "rgba(193,98,45,0.05)"
                      : "var(--paper-raised)",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <input
                    type="radio"
                    name="propertyId"
                    value={p.id}
                    checked={isSelected}
                    onChange={() => setSelected(p.id)}
                    style={{ flexShrink: 0, accentColor: "var(--terracotta)" }}
                  />
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "var(--r-md)",
                      background: isSelected
                        ? "rgba(193,98,45,0.1)"
                        : "rgba(28,43,39,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building2
                      size={13}
                      style={{ color: isSelected ? "var(--terracotta)" : "var(--ink-soft)" }}
                    />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                      {[
                        p.address,
                        `${unitCount} local${unitCount !== 1 ? "x" : ""}`,
                        !p.ownerId ? "sans propriétaire" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "var(--rouge)" }}>{error}</p>
        )}
      </div>
    </Modal>
  );
}
