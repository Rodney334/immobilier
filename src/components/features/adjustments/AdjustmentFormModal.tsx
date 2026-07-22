"use client";

import { useEffect, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { adjustmentService } from "@/lib/services/adjustment.service";
import { leaseService } from "@/lib/services/lease.service";
import type { Adjustment, AdjustmentType, AdjustmentValueMode, Lease } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = { error: string | null; success: boolean };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (a: Adjustment) => void;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string }[] = [
  { value: "DISCOUNT",      label: "Remise" },
  { value: "PENALTY",       label: "Pénalité" },
  { value: "CORRECTION",    label: "Correction" },
  { value: "RENT_REVISION", label: "Révision de loyer" },
  { value: "WAIVER",        label: "Dispense" },
];

const VALUE_MODES: { value: AdjustmentValueMode; label: string }[] = [
  { value: "FIXED",      label: "Montant fixe (XOF)" },
  { value: "PERCENTAGE", label: "Pourcentage (%)" },
];

// ─── Submit button ─────────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      Enregistrer
    </button>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AdjustmentFormModal({ isOpen, onClose, onSaved }: Props) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loadingLeases, setLoadingLeases] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingLeases(true);
    leaseService
      .getAll({ limit: 200, status: "ACTIVE" })
      .then((res) => setLeases(res.data))
      .catch(() => {})
      .finally(() => setLoadingLeases(false));
  }, [isOpen]);

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const leaseId       = (formData.get("leaseId") as string).trim();
      const type          = formData.get("type") as AdjustmentType | "";
      const label         = (formData.get("label") as string).trim();
      const valueMode     = formData.get("valueMode") as AdjustmentValueMode | "";
      const amountStr     = (formData.get("amount") as string).trim();
      const reason        = (formData.get("reason") as string).trim();
      const effectiveDateRaw = (formData.get("effectiveDate") as string).trim();

      if (!type) {
        return { error: "Le type d'ajustement est obligatoire.", success: false };
      }
      if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
        return { error: "Le montant doit être supérieur à 0.", success: false };
      }
      if (!reason) {
        return { error: "La raison est obligatoire.", success: false };
      }
      if (!effectiveDateRaw) {
        return { error: "La date d'effet est obligatoire.", success: false };
      }

      // Convertir la date locale en ISO datetime (minuit UTC)
      const effectiveDate = new Date(effectiveDateRaw).toISOString();

      try {
        const res = await adjustmentService.create({
          leaseId:       leaseId || undefined,
          type,
          label:         label || undefined,
          valueMode:     valueMode || undefined,
          amount:        amountStr,
          reason,
          effectiveDate,
        });
        onSaved(res.data);
        onClose();
        return { error: null, success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
        return { error: msg, success: false };
      }
    },
    { error: null, success: false },
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvel ajustement">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger"
          >
            {state.error}
          </div>
        )}

        {/* Contrat lié (optionnel) */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Contrat lié{" "}
            <span className="text-primary/30 font-normal normal-case tracking-normal">(optionnel)</span>
          </label>
          <select
            name="leaseId"
            disabled={loadingLeases}
            className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 disabled:bg-neutral transition-colors"
          >
            <option value="">
              {loadingLeases ? "Chargement..." : "Aucun contrat sélectionné"}
            </option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.contractNumber
                  ? `#${l.contractNumber}`
                  : `#${(l.id ?? "").slice(-8).toUpperCase()}`}
                {l.tenant
                  ? ` — ${l.tenant.fullName ?? `${l.tenant.firstName} ${l.tenant.lastName}`}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Type <span className="text-danger ml-1">*</span>
          </label>
          <select
            name="type"
            required
            defaultValue=""
            className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          >
            <option value="" disabled>Sélectionner un type</option>
            {ADJUSTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Libellé (optionnel) */}
        <Input
          name="label"
          type="text"
          label="Libellé"
          placeholder="ex : Remise commerciale"
          hint="Optionnel — titre court affiché dans la liste"
        />

        <div className="grid grid-cols-2 gap-3">
          {/* Montant */}
          <Input
            name="amount"
            type="number"
            label="Montant *"
            placeholder="ex : 10000"
            required
            min={1}
          />

          {/* Mode de valeur */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Mode
            </label>
            <select
              name="valueMode"
              defaultValue="FIXED"
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              {VALUE_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date d'effet */}
        <Input
          name="effectiveDate"
          type="date"
          label="Date d'effet *"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
        />

        {/* Raison */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Raison <span className="text-danger ml-1">*</span>
          </label>
          <textarea
            name="reason"
            required
            rows={3}
            placeholder="Décrivez la raison de cet ajustement..."
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border-custom">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors duration-150"
          >
            Annuler
          </button>
          <SubmitButton />
        </div>
      </form>
    </Modal>
  );
}
