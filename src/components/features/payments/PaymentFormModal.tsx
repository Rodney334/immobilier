"use client";

import { useEffect, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { paymentService } from "@/lib/services/payment.service";
import type { Lease, Payment, PaymentMethod } from "@/types";
import { leaseService } from "@/lib/services/lease.service";

type FormState = { error: string | null; success: boolean };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (p: Payment) => void;
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Especes" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CHECK", label: "Cheque" },
  { value: "OTHER", label: "Autre" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium
                 hover:bg-[#263447] disabled:opacity-60 disabled:cursor-not-allowed
                 transition-colors duration-150 flex items-center gap-2"
    >
      {pending && (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      )}
      Enregistrer le paiement
    </button>
  );
}

export function PaymentFormModal({ isOpen, onClose, onSaved }: Props) {
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
      const leaseId = formData.get("leaseId") as string;
      const amountStr = (formData.get("amount") as string).trim();
      const paymentDate = (formData.get("paymentDate") as string).trim();
      const paymentMethod = formData.get("paymentMethod") as PaymentMethod | "";
      const reference = (formData.get("reference") as string).trim();

      if (!leaseId) {
        return { error: "Veuillez selectionner un locataire.", success: false };
      }

      const amount = parseFloat(amountStr);
      if (!amountStr || isNaN(amount) || amount <= 0) {
        return { error: "Le montant doit etre superieur a 0.", success: false };
      }

      if (!paymentDate) {
        return { error: "La date de paiement est obligatoire.", success: false };
      }

      try {
        const res = await paymentService.autoAllocate({
          leaseId,
          amount,
          paymentDate,
          paymentMethod: paymentMethod || undefined,
          reference: reference || undefined,
        });
        onSaved(res.data);
        return { error: null, success: true };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Une erreur est survenue.";
        return { error: msg, success: false };
      }
    },
    { error: null, success: false },
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer un paiement">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Contrat <span className="text-danger">*</span>
          </label>
          {loadingLeases ? (
            <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-border-custom bg-white text-[13px] text-primary/40">
              <Loader2 size={13} className="animate-spin" />
              Chargement...
            </div>
          ) : (
            <select
              name="leaseId"
              required
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white
                         text-[14px] text-primary focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">Selectionner un contrat...</option>
              {leases.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Montant (XOF) <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <input
              name="amount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="ex : 150000"
              className="w-full h-11 px-3 pr-14 rounded-lg border border-border-custom bg-white
                         text-[14px] text-primary placeholder:text-primary/30
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40
                         transition-colors tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-primary/40 pointer-events-none">
              XOF
            </span>
          </div>
        </div>

        <Input
          name="paymentDate"
          type="date"
          label="Date de paiement *"
          defaultValue={today}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Methode de paiement
            </label>
            <select
              name="paymentMethod"
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white
                         text-[14px] text-primary focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">Non specifie</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            name="reference"
            label="Reference (optionnel)"
            placeholder="ex : VIR-2026-001"
          />
        </div>

        <p className="text-[12px] text-primary/40 leading-relaxed">
          Le paiement sera automatiquement alloue aux echeances impayees du
          locataire selectionne (ordre chronologique).
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border-custom">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60
                       hover:text-primary border border-border-custom hover:border-primary/30
                       transition-colors duration-150"
          >
            Annuler
          </button>
          <SubmitButton />
        </div>
      </form>
    </Modal>
  );
}
