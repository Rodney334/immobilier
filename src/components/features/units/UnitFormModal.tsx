"use client";

import { useEffect, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { unitService } from "@/lib/services/unit.service";
import { propertyService } from "@/lib/services/property.service";
import type { Unit, Property, CreateUnitPayload, LeaseCategory } from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  unit?: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (u: Unit) => void;
};

const UNIT_TYPES: { value: string; label: string }[] = [
  { value: "BOUTIQUE",    label: "Boutique" },
  { value: "APPARTEMENT", label: "Appartement" },
  { value: "BUREAU",      label: "Bureau" },
  { value: "STUDIO",      label: "Studio" },
  { value: "VILLA",       label: "Villa" },
  { value: "ENTREPOT",    label: "Entrepôt" },
  { value: "AUTRE",       label: "Autre" },
];

const LEASE_CATEGORIES: { value: LeaseCategory; label: string }[] = [
  { value: "HABITATION",    label: "Habitation" },
  { value: "PROFESSIONNEL", label: "Professionnel" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

export function UnitFormModal({ unit, isOpen, onClose, onSaved }: Props) {
  const isEdit = !!unit;
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingProps(true);
    propertyService
      .getAll({ limit: 200 })
      .then((res) => setProperties(res.data))
      .catch(() => {})
      .finally(() => setLoadingProps(false));
  }, [isOpen]);

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const propertyId    = formData.get("propertyId") as string;
      const label         = (formData.get("label") as string).trim();
      const type          = (formData.get("type") as string).trim();
      const leaseCategory = (formData.get("leaseCategory") as string).trim() as LeaseCategory | "";
      const floor         = (formData.get("floor") as string).trim();
      const area          = (formData.get("area") as string).trim();
      const baseRent      = (formData.get("baseRent") as string).trim();
      const depositAmount = (formData.get("depositAmount") as string).trim();

      if (!isEdit && !propertyId) {
        return { error: "Veuillez selectionner une propriete.", success: false };
      }
      if (!baseRent || isNaN(Number(baseRent)) || Number(baseRent) <= 0) {
        return { error: "Le loyer de base doit etre superieur a 0.", success: false };
      }
      if (depositAmount && (isNaN(Number(depositAmount)) || Number(depositAmount) < 0)) {
        return { error: "La caution doit être un montant positif.", success: false };
      }

      const payload: CreateUnitPayload = {
        propertyId:    propertyId || unit!.propertyId,
        label:         label || undefined,
        type:          type || undefined,
        leaseCategory: leaseCategory || undefined,
        floor:         floor || undefined,
        area:          area || undefined,
        baseRent,
        depositAmount: depositAmount || undefined,
      };

      try {
        const res = isEdit
          ? await unitService.update(unit!.id, {
              label:         payload.label,
              type:          payload.type,
              leaseCategory: payload.leaseCategory,
              floor:         payload.floor,
              area:          payload.area,
              baseRent:      payload.baseRent,
              depositAmount: payload.depositAmount,
            })
          : await unitService.create(payload);
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
      title={isEdit ? "Modifier le local" : "Nouveau local"}
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

        {/* Propriété */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Propriete {!isEdit && <span className="text-danger">*</span>}
          </label>
          {loadingProps ? (
            <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-border-custom bg-white text-[13px] text-primary/40">
              <Loader2 size={13} className="animate-spin" /> Chargement...
            </div>
          ) : (
            <select
              name="propertyId"
              required={!isEdit}
              disabled={isEdit}
              defaultValue={unit?.propertyId ?? ""}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 transition-colors"
            >
              <option value="" disabled>Selectionner une propriete</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Type + Catégorie de bail */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Type de local
            </label>
            <select
              name="type"
              defaultValue={unit?.type ?? ""}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">Sélectionner (optionnel)</option>
              {UNIT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Catégorie de bail
            </label>
            <select
              name="leaseCategory"
              defaultValue={unit?.leaseCategory ?? ""}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">Sélectionner (recommandé)</option>
              {LEASE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-primary/40">Détermine le modèle de contrat utilisé</p>
          </div>
        </div>

        {/* Libellé */}
        <Input
          name="label"
          label="Libellé"
          placeholder="ex : Boutique façade"
          defaultValue={unit?.label}
          hint="Nom descriptif du local (optionnel)"
        />

        {/* Loyer + Étage */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="baseRent"
            type="number"
            label="Loyer de base (XOF) *"
            placeholder="ex : 75000"
            defaultValue={unit?.baseRent}
            required
          />
          <Input
            name="floor"
            label="Étage"
            placeholder="ex : RDC, 1er"
            defaultValue={unit?.floor}
          />
        </div>

        {/* Caution + Surface */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="depositAmount"
            type="number"
            label="Caution / dépôt de garantie (XOF)"
            placeholder="ex : 150000"
            defaultValue={unit?.depositAmount}
            hint="Reporté automatiquement sur le bail"
          />
          <Input
            name="area"
            type="number"
            label="Surface (m²)"
            placeholder="ex : 35.50"
            defaultValue={unit?.area}
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
          <SubmitButton label={isEdit ? "Enregistrer" : "Créer le local"} />
        </div>
      </form>
    </Modal>
  );
}
