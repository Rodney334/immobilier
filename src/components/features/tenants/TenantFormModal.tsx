"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { tenantService } from "@/lib/services/tenant.service";
import type { Tenant, CreateTenantPayload, TenantType } from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  tenant?: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (t: Tenant) => void;
};

const ID_TYPES: { value: string; label: string }[] = [
  { value: "CIP",             label: "Carte d'identité nationale (CIP)" },
  { value: "Passport",        label: "Passeport" },
  { value: "DriverLicense",   label: "Permis de conduire" },
  { value: "ResidencePermit", label: "Titre de séjour" },
  { value: "Other",           label: "Autre" },
];

const LEASE_PURPOSE: { value: string; label: string }[] = [
  { value: "SHOP",       label: "Boutique" },
  { value: "OFFICE",     label: "Bureau" },
  { value: "STORAGE",    label: "Stockage" },
  { value: "HABITATION", label: "Habitation" },
  { value: "COMMERCE",   label: "Commerce" },
  { value: "OTHER",      label: "Autre" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
    >
      {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {label}
    </button>
  );
}

function SelectField({
  name, label, defaultValue, children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

export function TenantFormModal({ tenant, isOpen, onClose, onSaved }: Props) {
  const isEdit = !!tenant;
  const [tenantType, setTenantType] = useState<TenantType>(
    tenant?.tenantType ?? "INDIVIDUAL",
  );
  const isCompany = tenantType === "COMPANY";

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const type            = formData.get("tenantType") as TenantType;
      const email           = (formData.get("email") as string).trim();
      const phone           = (formData.get("phone") as string).trim();
      const secondaryPhone  = (formData.get("secondaryPhone") as string).trim();
      const emergencyContact= (formData.get("emergencyContact") as string).trim();
      const notes           = (formData.get("notes") as string).trim();
      const leasePurpose    = (formData.get("leasePurpose") as string).trim();
      const leasePurposeDetails = (formData.get("leasePurposeDetails") as string).trim();

      let payload: CreateTenantPayload;

      if (type === "COMPANY") {
        const fullName            = (formData.get("fullName") as string).trim();
        const companyLegalForm    = (formData.get("companyLegalForm") as string).trim();
        const companyRccm         = (formData.get("companyRccm") as string).trim();
        const companyIfu          = (formData.get("companyIfu") as string).trim();
        const representativeName  = (formData.get("representativeName") as string).trim();
        const representativeTitle = (formData.get("representativeTitle") as string).trim();

        if (!fullName) {
          return { error: "La raison sociale est obligatoire.", success: false };
        }

        payload = {
          tenantType:          "COMPANY",
          fullName,
          email:               email || undefined,
          phone:               phone || undefined,
          secondaryPhone:      secondaryPhone || undefined,
          emergencyContact:    emergencyContact || undefined,
          notes:               notes || undefined,
          leasePurpose:        leasePurpose || undefined,
          leasePurposeDetails: leasePurposeDetails || undefined,
          companyLegalForm:    companyLegalForm || undefined,
          companyRccm:         companyRccm || undefined,
          companyIfu:          companyIfu || undefined,
          representativeName:  representativeName || undefined,
          representativeTitle: representativeTitle || undefined,
        };
      } else {
        const firstName      = (formData.get("firstName") as string).trim();
        const lastName       = (formData.get("lastName") as string).trim();
        const identityType   = (formData.get("identityType") as string).trim();
        const identityNumber = (formData.get("identityNumber") as string).trim();

        if (!firstName || !lastName) {
          return { error: "Le prénom et le nom sont obligatoires.", success: false };
        }

        payload = {
          tenantType:          "INDIVIDUAL",
          fullName:            `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          email:               email || undefined,
          phone:               phone || undefined,
          secondaryPhone:      secondaryPhone || undefined,
          identityType:        identityType || undefined,
          identityNumber:      identityNumber || undefined,
          emergencyContact:    emergencyContact || undefined,
          notes:               notes || undefined,
          leasePurpose:        leasePurpose || undefined,
          leasePurposeDetails: leasePurposeDetails || undefined,
        };
      }

      try {
        const res = isEdit
          ? await tenantService.update(tenant!.id, payload)
          : await tenantService.create(payload);
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

        {/* ── Nature du locataire ───────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Nature du locataire
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["INDIVIDUAL", "COMPANY"] as TenantType[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTenantType(v)}
                className={[
                  "h-10 rounded-lg border text-[13px] font-medium transition-colors",
                  tenantType === v
                    ? "border-primary bg-primary text-white"
                    : "border-border-custom bg-white text-primary/60 hover:border-primary/30 hover:text-primary",
                ].join(" ")}
              >
                {v === "INDIVIDUAL" ? "Particulier" : "Entreprise"}
              </button>
            ))}
          </div>
          <input type="hidden" name="tenantType" value={tenantType} />
        </div>

        {/* ── Champs ENTREPRISE ─────────────────────────────────────── */}
        {isCompany && (
          <>
            <Input
              name="fullName"
              label="Raison sociale *"
              placeholder="ex : SARL DUPONT COMMERCE"
              defaultValue={tenant?.fullName}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="companyLegalForm"
                label="Forme juridique"
                placeholder="ex : SARL, SA, SAS"
                defaultValue={tenant?.companyLegalForm}
              />
              <Input
                name="companyRccm"
                label="Numéro RCCM"
                placeholder="ex : BJ-COT-2024-B-12345"
                defaultValue={tenant?.companyRccm}
              />
            </div>
            <Input
              name="companyIfu"
              label="Numéro IFU"
              placeholder="ex : 1234567890123"
              defaultValue={tenant?.companyIfu}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="representativeName"
                label="Nom du représentant"
                placeholder="ex : Jean Dupont"
                defaultValue={tenant?.representativeName}
              />
              <Input
                name="representativeTitle"
                label="Fonction"
                placeholder="ex : Gérant, DG"
                defaultValue={tenant?.representativeTitle}
              />
            </div>
          </>
        )}

        {/* ── Champs PARTICULIER ────────────────────────────────────── */}
        {!isCompany && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="firstName"
                label="Prénom *"
                placeholder="Jean"
                defaultValue={tenant?.firstName}
                required
              />
              <Input
                name="lastName"
                label="Nom *"
                placeholder="Dupont"
                defaultValue={tenant?.lastName}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                name="identityType"
                label="Type de pièce d'identité"
                defaultValue={tenant?.identityType}
              >
                <option value="">Aucune</option>
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </SelectField>
              <Input
                name="identityNumber"
                label="Numéro de pièce"
                placeholder="ex : BJ123456"
                defaultValue={tenant?.identityNumber}
              />
            </div>
          </>
        )}

        {/* ── Champs communs ────────────────────────────────────────── */}
        <Input
          name="email"
          type="email"
          label="Email (optionnel)"
          placeholder="contact@exemple.com"
          defaultValue={tenant?.email}
          autoComplete="email"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="phone"
            type="tel"
            label="Téléphone"
            placeholder="+229 97 00 00 00"
            defaultValue={tenant?.phone}
          />
          <Input
            name="secondaryPhone"
            type="tel"
            label="Second numéro"
            placeholder="+229 97 00 00 00"
            defaultValue={tenant?.secondaryPhone}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="emergencyContact"
            label="Contact urgence"
            placeholder="+229 96 00 00 00"
            defaultValue={tenant?.emergencyContact}
          />
          <Input
            name="notes"
            label="Notes"
            placeholder="ex : Client fidèle"
            defaultValue={tenant?.notes}
          />
        </div>
        <SelectField
          name="leasePurpose"
          label="Motif de la location"
          defaultValue={tenant?.leasePurpose}
        >
          <option value="">Aucun</option>
          {LEASE_PURPOSE.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </SelectField>
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Précisions sur le motif
          </label>
          <textarea
            name="leasePurposeDetails"
            rows={2}
            defaultValue={tenant?.leasePurposeDetails ?? ""}
            placeholder="Détails complémentaires..."
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
          <SubmitButton label={isEdit ? "Enregistrer" : "Créer le locataire"} />
        </div>
      </form>
    </Modal>
  );
}
