"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ownerService } from "@/lib/services/owner.service";
import type { OwnerPayout } from "@/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  onSaved: (payout: OwnerPayout) => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ResetAccountModal({ isOpen, onClose, ownerId, onSaved }: Props) {
  const [asOfDate, setAsOfDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAsOfDate(todayIso());
    setReason("");
    setError(null);
    setSubmitting(false);
  }, [isOpen]);

  async function handleSubmit() {
    if (!asOfDate) {
      setError("La date d'arrêté est obligatoire.");
      return;
    }
    if (!reason.trim()) {
      setError("Merci d'indiquer un motif — utile en cas de contrôle ultérieur.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await ownerService.resetAccount(ownerId, {
        asOfDate: new Date(asOfDate).toISOString(),
        reason: reason.trim(),
      });
      onSaved(res.data);
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
      title="Remettre le compte à zéro"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="ep-btn ep-btn-ghost">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="ep-btn"
            style={{ background: "var(--rouge)", color: "white", border: "none", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Confirmer la remise à zéro
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
            background: "var(--rouge-soft)",
            border: "1px solid rgba(168,67,47,0.2)",
            borderRadius: "var(--r-md)",
          }}
        >
          <AlertTriangle size={15} style={{ color: "var(--rouge)", marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
            Les écritures antérieures à cette date ne seront plus comptées dans le solde courant,
            mais <strong>rien n&apos;est supprimé</strong> — elles restent consultables via
            « Voir tout l&apos;historique ».
          </p>
        </div>

        <Input
          label="Compte arrêté au"
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          required
        />

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
            Motif
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="ex : reprise d'antériorité, solde arrêté d'un commun accord..."
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
          />
        </div>

        {error && <p style={{ fontSize: 12, color: "var(--rouge)" }}>{error}</p>}
      </div>
    </Modal>
  );
}
