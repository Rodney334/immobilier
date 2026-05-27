"use client";

import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { tenantService } from "@/lib/services/tenant.service";
import type { Tenant, IdType, CreateTenantPayload } from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  tenant?: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (t: Tenant) => void;
};

const ID_TYPES: { value: IdType; label: string }[] = [
  { value: "NationalId", label: "Carte d identite nationale" },
  { value: "Passport", label: "Passeport" },
  { value: "DriverLicense", label: "Permis de conduire" },
  { value: "ResidencePermit", label: "Titre de sejour" },
  { value: "Other", label: "Autre" },
];

function SubmitButton({ label }: { label: string }) {
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
      {label}
    </button>
  );
}

export function TenantFormModal({ tenant, isOpen, onClose, onSaved }: Props) {
  const isEdit = !!tenant;

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const firstName = (formData.get("firstName") as string).trim();
      const lastName = (formData.get("lastName") as string).trim();
      const email = (formData.get("email") as string).trim();
      const phoneNumber = (formData.get("phoneNumber") as string).trim();
      const idType = formData.get("idType") as IdType | "";
      const idNumber = (formData.get("idNumber") as string).trim();
      const address = (formData.get("address") as string).trim();
      const city = (formData.get("city") as string).trim();
      const country = (formData.get("country") as string).trim();

      if (!firstName || !lastName) {
        return {
          error: "Le prenom et le nom sont obligatoires.",
          success: false,
        };
      }

      const payload: CreateTenantPayload = {
        firstName,
        lastName,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        idType: idType || undefined,
        idNumber: idNumber || undefined,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
      };

      try {
        const res = isEdit
          ? await tenantService.update(tenant!.id, payload)
          : await tenantService.create(payload);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier le locataire" : "Nouveau locataire"}
    >
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger"
          >
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="firstName"
            label="Prenom"
            placeholder="Jean"
            defaultValue={tenant?.firstName}
            required
          />
          <Input
            name="lastName"
            label="Nom"
            placeholder="Dupont"
            defaultValue={tenant?.lastName}
            required
          />
        </div>

        <Input
          name="email"
          type="email"
          label="Email (optionnel)"
          placeholder="jean@exemple.com"
          defaultValue={tenant?.email}
          autoComplete="email"
        />

        <Input
          name="phoneNumber"
          type="tel"
          label="Telephone (optionnel)"
          placeholder="+229 01 23 45 67"
          defaultValue={tenant?.phoneNumber}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Type de piece d identite
            </label>
            <select
              name="idType"
              defaultValue={tenant?.idType ?? ""}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white
                         text-[14px] text-primary focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">Aucune</option>
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            name="idNumber"
            label="Numero de piece"
            placeholder="ex : AB123456"
            defaultValue={tenant?.idNumber}
          />
        </div>

        <Input
          name="address"
          label="Adresse (optionnel)"
          placeholder="ex : Rue des Manguiers"
          defaultValue={tenant?.address}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="city"
            label="Ville (optionnel)"
            placeholder="Cotonou"
            defaultValue={tenant?.city}
          />
          <Input
            name="country"
            label="Pays (optionnel)"
            placeholder="Benin"
            defaultValue={tenant?.country}
          />
        </div>

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
          <SubmitButton label={isEdit ? "Enregistrer" : "Creer le locataire"} />
        </div>
      </form>
    </Modal>
  );
}
