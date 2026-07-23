"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ownerService } from "@/lib/services/owner.service";
import type { Owner, CreateOwnerPayload } from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  owner?: Owner | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (o: Owner) => void;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="ep-btn ep-btn-primary"
      style={{ opacity: pending ? 0.6 : 1 }}
    >
      {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {label}
    </button>
  );
}

export function OwnerFormModal({ owner, isOpen, onClose, onSaved }: Props) {
  const isEdit = !!owner;

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const fullName = (formData.get("fullName") as string).trim();
      const legalForm = (formData.get("legalForm") as string).trim();
      const managementFeePercentStr = (formData.get("managementFeePercent") as string).trim();
      const ifu = (formData.get("ifu") as string).trim();
      const rccm = (formData.get("rccm") as string).trim();
      const phone = (formData.get("phone") as string).trim();
      const email = (formData.get("email") as string).trim();
      const address = (formData.get("address") as string).trim();
      const bankName = (formData.get("bankName") as string).trim();
      const bankAccountNumber = (formData.get("bankAccountNumber") as string).trim();
      const notes = (formData.get("notes") as string).trim();

      if (!fullName) {
        return { error: "Le nom complet ou raison sociale est obligatoire.", success: false };
      }

      const managementFeePercent = managementFeePercentStr
        ? parseFloat(managementFeePercentStr)
        : undefined;

      const payload: CreateOwnerPayload = {
        fullName,
        legalForm: legalForm || undefined,
        managementFeePercent,
        ifu: ifu || undefined,
        rccm: rccm || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        bankName: bankName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
        notes: notes || undefined,
      };

      try {
        const res = isEdit
          ? await ownerService.update(owner!.id, payload)
          : await ownerService.create(payload);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier le propriétaire" : "Nouveau propriétaire"}
    >
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--rouge-soft)",
              border: "1px solid rgba(168,67,47,0.2)",
              fontSize: 13,
              color: "var(--rouge)",
              lineHeight: 1.5,
            }}
          >
            {state.error}
          </div>
        )}

        <Input
          name="fullName"
          label="Nom complet ou raison sociale"
          placeholder="ex : Appolinaire GODONOU"
          defaultValue={owner?.fullName}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="legalForm"
            label="Forme juridique (optionnel)"
            placeholder="ex : SARL"
            defaultValue={owner?.legalForm}
          />
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Commission agence
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                name="managementFeePercent"
                placeholder="ex : 10"
                defaultValue={owner?.managementFeePercent}
                min={0}
                max={100}
                step={0.1}
                className="flex-1 h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors duration-150"
              />
              <span style={{ fontSize: 13, color: "var(--ink-soft)", flexShrink: 0 }}>%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="ifu"
            label="IFU"
            placeholder="ex : 3202112345678"
            defaultValue={owner?.ifu}
          />
          <Input
            name="rccm"
            label="RCCM"
            placeholder="ex : RB/COT/24 B 1234"
            defaultValue={owner?.rccm}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="phone"
            label="Téléphone"
            placeholder="ex : 97 00 00 00"
            defaultValue={owner?.phone}
          />
          <Input
            name="email"
            label="Email"
            type="email"
            placeholder="proprietaire@email.com"
            defaultValue={owner?.email}
          />
        </div>

        <Input
          name="address"
          label="Adresse"
          placeholder="ex : Cotonou, Bénin"
          defaultValue={owner?.address}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="bankName"
            label="Banque (pour le reversement)"
            placeholder="ex : SONIBANK"
            defaultValue={owner?.bankName}
          />
          <Input
            name="bankAccountNumber"
            label="N° de compte"
            placeholder="ex : 00123456789"
            defaultValue={owner?.bankAccountNumber}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Notes (optionnel)
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={owner?.notes ?? ""}
            placeholder="Informations complémentaires..."
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors duration-150"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border-custom">
          <button
            type="button"
            onClick={onClose}
            className="ep-btn ep-btn-ghost"
          >
            Annuler
          </button>
          <SubmitButton label={isEdit ? "Enregistrer" : "Créer le propriétaire"} />
        </div>
      </form>
    </Modal>
  );
}
