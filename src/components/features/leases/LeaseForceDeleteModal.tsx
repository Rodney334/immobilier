"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { leaseService } from "@/lib/services/lease.service";
import type { Lease } from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  lease: Lease;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      form="force-delete-lease-form"
      disabled={pending || disabled}
      className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-semibold hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      Supprimer définitivement
    </button>
  );
}

export function LeaseForceDeleteModal({
  lease,
  isOpen,
  onClose,
  onDeleted,
}: Props) {
  const contractNumber = lease.contractNumber ?? "";
  const [confirmInput, setConfirmInput] = useState("");

  const tenantName =
    lease.tenant?.fullName ??
    (lease.tenant
      ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
      : lease.tenantId);

  const matches =
    confirmInput.trim().length > 0 && confirmInput.trim() === contractNumber.trim();

  const [state, formAction] = useActionState(
    async (_prev: FormState): Promise<FormState> => {
      if (!matches) {
        return {
          error: "Le numéro de contrat saisi ne correspond pas.",
          success: false,
        };
      }
      try {
        await leaseService.forceDelete(lease.id, confirmInput.trim());
        onDeleted();
        return { error: null, success: true };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Une erreur est survenue.";
        return { error: msg, success: false };
      }
    },
    { error: null, success: false },
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setConfirmInput("");
        onClose();
      }}
      title="Supprimer définitivement ce contrat"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setConfirmInput("");
              onClose();
            }}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
          >
            Annuler
          </button>
          <SubmitButton disabled={!matches} />
        </div>
      }
    >
      <form
        id="force-delete-lease-form"
        action={formAction}
        className="space-y-4"
      >
        <div className="px-4 py-4 rounded-lg bg-danger/8 border-2 border-danger/30">
          <div className="flex items-start gap-3">
            <ShieldAlert size={22} className="text-danger shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-[14px] font-bold text-danger">
                Action irréversible — aucune corbeille, aucun retour en
                arrière possible.
              </p>
              <p className="text-[13px] text-danger/90 leading-relaxed">
                Vous êtes sur le point de supprimer{" "}
                <span className="font-semibold">
                  TOUT ce qui est lié au contrat{" "}
                  {contractNumber || "(sans numéro)"}
                </span>{" "}
                de <span className="font-semibold">{tenantName}</span> :
              </p>
              <ul className="text-[13px] text-danger/90 leading-relaxed list-disc list-inside space-y-0.5">
                <li>tous les paiements enregistrés et leurs reçus</li>
                <li>toutes les échéances de loyer (passées et futures)</li>
                <li>tous les ajustements (remises, pénalités, corrections)</li>
                <li>les garants rattachés à ce contrat</li>
                <li>l&apos;historique du contrat</li>
              </ul>
              <p className="text-[13px] text-danger/90 leading-relaxed">
                Si vous voulez seulement arrêter ce contrat en gardant une
                trace, utilisez plutôt <em>Résilier</em> ou{" "}
                <em>Annuler le contrat</em> — pas cette option.
              </p>
            </div>
          </div>
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
            Pour confirmer, tapez exactement le numéro de contrat{" "}
            <span className="font-mono font-semibold text-primary">
              {contractNumber || "—"}
            </span>
            <span className="text-danger ml-1">*</span>
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={contractNumber || "Numéro de contrat"}
            autoComplete="off"
            spellCheck={false}
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] font-mono text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/40 transition-colors"
          />
        </div>
      </form>
    </Modal>
  );
}