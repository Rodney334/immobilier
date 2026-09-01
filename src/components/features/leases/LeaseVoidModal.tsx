"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { leaseService } from "@/lib/services/lease.service";
import type { Lease } from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  lease: Lease;
  isOpen: boolean;
  onClose: () => void;
  onDone: (l: Lease) => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      form="void-lease-form"
      disabled={pending}
      className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center gap-2"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      Annuler le contrat
    </button>
  );
}

export function LeaseVoidModal({ lease, isOpen, onClose, onDone }: Props) {
  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const reason = (formData.get("reason") as string).trim();

      if (!reason) {
        return { error: "Le motif d'annulation est obligatoire.", success: false };
      }

      try {
        const res = await leaseService.void(lease.id, { reason });
        onDone(res.data);
        return { error: null, success: true };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Une erreur est survenue.";
        return { error: msg, success: false };
      }
    },
    { error: null, success: false },
  );

  const tenantName =
    lease.tenant?.fullName ??
    (lease.tenant
      ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
      : lease.tenantId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Annuler le contrat"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
          >
            Retour
          </button>
          <SubmitButton />
        </div>
      }
    >
      <form id="void-lease-form" action={formAction} className="space-y-4">
        <div className="px-4 py-3 rounded-lg bg-danger/5 border border-danger/15">
          <p className="text-[13px] text-danger leading-relaxed">
            Le contrat de <span className="font-semibold">{tenantName}</span>{" "}
            a déjà des échéances générées. Il ne sera pas effacé : il passera
            au statut Clôturé et ses échéances seront annulées, mais il
            restera consultable dans l&apos;historique. Utilisez cette action
            uniquement si le contrat a été émis par erreur.
          </p>
        </div>

        {state.error && (
          <div
            role="alert"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger"
          >
            <AlertTriangle size={14} /> {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Motif de l&apos;annulation
            <span className="text-danger ml-1">*</span>
          </label>
          <textarea
            name="reason"
            rows={3}
            required
            placeholder="Ex : Contrat créé sur le mauvais local…"
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
          />
        </div>
      </form>
    </Modal>
  );
}
