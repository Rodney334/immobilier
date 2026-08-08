"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ownerService } from "@/lib/services/owner.service";
import { OWNER_PAYOUT_METHODS } from "@/types";
import type { CreatePayoutPayload, OwnerPayout, OwnerStatement } from "@/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  statement: OwnerStatement | null;
  onSaved: (payout: OwnerPayout) => void;
};

const fmtFull = (n: number | undefined | null) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(n ?? 0))} FCFA`;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CreatePayoutModal({ isOpen, onClose, ownerId, statement, onSaved }: Props) {
  const netDue = statement?.summary.netDue ?? 0;

  const [periodEnd, setPeriodEnd] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [externalReference, setExternalReference] = useState("");
  const [notes, setNotes] = useState("");
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [paidAt, setPaidAt] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[] | null>(null); // null = tout le portefeuille

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<OwnerPayout | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCreated(null);
    setSubmitting(false);
    setSelectedPropertyIds(null);
    const defaultEnd = statement?.period?.to?.slice(0, 10) ?? todayIso();
    setPeriodEnd(defaultEnd);
    setPeriodStart(statement?.period?.from?.slice(0, 10) ?? "");
    setAmountPaid(netDue > 0 ? String(Math.round(netDue)) : "");
    setMethod("BANK_TRANSFER");
    setExternalReference("");
    setNotes("");
    setMarkAsPaid(true);
    setPaidAt(defaultEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function togglePropertyId(id: string) {
    setSelectedPropertyIds((prev) => {
      const base = prev ?? [];
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });
  }

  async function handleSubmit() {
    if (!periodEnd) {
      setError("La date de fin de période est obligatoire.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreatePayoutPayload = {
        periodEnd: new Date(periodEnd).toISOString(),
        periodStart: periodStart ? new Date(periodStart).toISOString() : undefined,
        propertyIds: selectedPropertyIds && selectedPropertyIds.length > 0 ? selectedPropertyIds : undefined,
        amountPaid: amountPaid ? Number(amountPaid) : undefined,
        method: method || undefined,
        externalReference: externalReference.trim() || undefined,
        markAsPaid,
        paidAt: markAsPaid && paidAt ? new Date(paidAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
      };
      const res = await ownerService.createPayout(ownerId, payload);
      setCreated(res.data);
      onSaved(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadReceipt() {
    if (!created) return;
    setDownloadingReceipt(true);
    try {
      const blob = await ownerService.downloadPayoutReceipt(created.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-${created.reference ?? created.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    } finally {
      setDownloadingReceipt(false);
    }
  }

  const byProperty = statement?.byProperty ?? [];

  // ── Écran de succès ─────────────────────────────────────────────────────────
  if (created) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Reversement enregistré"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="ep-btn ep-btn-ghost">
              Fermer
            </button>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              disabled={downloadingReceipt}
              className="ep-btn ep-btn-primary"
              style={{ opacity: downloadingReceipt ? 0.6 : 1 }}
            >
              {downloadingReceipt ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} aria-hidden="true" />
              )}
              Télécharger le reçu
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 16px",
              background: "var(--sauge-soft, #E0E8DD)",
              border: "1px solid rgba(91,123,98,0.25)",
              borderRadius: "var(--r-md)",
            }}
          >
            <CheckCircle2 size={16} style={{ color: "var(--sauge)", marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
              {created.status === "PAID"
                ? "Le versement a été confirmé. Le compte repart après cette date."
                : "Le versement a été enregistré en brouillon. Confirmez-le depuis l'historique une fois le paiement effectué."}
            </p>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            <p>Référence : <strong style={{ color: "var(--ink)" }}>{created.reference ?? created.id}</strong></p>
            <p>Montant : <strong style={{ color: "var(--ink)" }}>{fmtFull(Number(created.amountPaid))}</strong></p>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Formulaire ───────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer un reversement"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="ep-btn ep-btn-ghost">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="ep-btn ep-btn-primary"
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {markAsPaid ? "Confirmer le versement" : "Enregistrer en brouillon"}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -4 }}>
          Net dû sur la période affichée :{" "}
          <strong style={{ color: "var(--ink)" }}>{fmtFull(netDue)}</strong>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Période — du"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
          <Input
            label="Période — au"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>

        <Input
          label="Montant versé (FCFA)"
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          hint="Modifiable pour un acompte ou un rattrapage"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              Mode de règlement
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="ep-chip"
              style={{ width: "100%", height: 38, textAlign: "left", cursor: "pointer" }}
            >
              {OWNER_PAYOUT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Référence externe (optionnel)"
            value={externalReference}
            onChange={(e) => setExternalReference(e.target.value)}
            placeholder="ex : virement n°..."
          />
        </div>

        {byProperty.length > 1 && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              Biens concernés (optionnel — laisser vide pour tout le portefeuille)
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 140, overflowY: "auto", border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", padding: 8 }}>
              {byProperty.map((p) => (
                <label key={p.propertyId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedPropertyIds?.includes(p.propertyId) ?? false}
                    onChange={() => togglePropertyId(p.propertyId)}
                    style={{ accentColor: "var(--terracotta)" }}
                  />
                  {p.propertyName}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
          />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "var(--paper-raised)",
            border: "1px solid var(--paper-line)",
            borderRadius: "var(--r-md)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={markAsPaid}
            onChange={(e) => setMarkAsPaid(e.target.checked)}
            style={{ accentColor: "var(--terracotta)" }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Versement déjà effectué</p>
            <p style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
              Coché : confirmé immédiatement, le compte repart après cette période. Décoché : enregistré en brouillon, à confirmer plus tard.
            </p>
          </div>
        </label>

        {markAsPaid && (
          <Input
            label="Date du versement"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        )}

        {error && <p style={{ fontSize: 12, color: "var(--rouge)" }}>{error}</p>}
      </div>
    </Modal>
  );
}
