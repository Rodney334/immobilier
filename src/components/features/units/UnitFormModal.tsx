"use client";

import { useEffect, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { unitService } from "@/lib/services/unit.service";
import { propertyService } from "@/lib/services/property.service";
import type { Unit, UnitType, Property, CreateUnitPayload } from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  unit?: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (u: Unit) => void;
};

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: "Studio", label: "Studio" },
  { value: "Apartment", label: "Appartement" },
  { value: "House", label: "Maison" },
  { value: "Office", label: "Bureau" },
  { value: "Shop", label: "Commerce" },
  { value: "Warehouse", label: "Entrepot" },
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
                 transition-colors flex items-center gap-2"
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
      const propertyId = formData.get("propertyId") as string;
      const unitNumber = (formData.get("unitNumber") as string).trim();
      const type = formData.get("type") as UnitType;
      const area = formData.get("area") as string;
      const rooms = formData.get("rooms") as string;
      const bathrooms = formData.get("bathrooms") as string;
      const rentAmount = parseFloat(formData.get("rentAmount") as string);

      if (!isEdit && !propertyId) {
        return { error: "Veuillez selectionner une propriete.", success: false };
      }
      if (!unitNumber) {
        return { error: "Le numero de local est obligatoire.", success: false };
      }
      if (!type) {
        return { error: "Le type est obligatoire.", success: false };
      }
      if (isNaN(rentAmount) || rentAmount <= 0) {
        return { error: "Le loyer doit etre superieur a 0.", success: false };
      }

      const payload: CreateUnitPayload = {
        propertyId: propertyId || unit!.propertyId,
        unitNumber,
        type,
        rentAmount,
        area: area ? parseFloat(area) : undefined,
        rooms: rooms ? parseInt(rooms, 10) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : undefined,
      };

      try {
        const res = isEdit
          ? await unitService.update(unit!.id, {
              unitNumber: payload.unitNumber,
              type: payload.type,
              rentAmount: payload.rentAmount,
              area: payload.area,
              rooms: payload.rooms,
              bathrooms: payload.bathrooms,
            })
          : await unitService.create(payload);
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
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white
                         text-[14px] text-primary focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 transition-colors"
            >
              <option value="" disabled>
                Selectionner une propriete
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="unitNumber"
            label="Numero de local *"
            placeholder="ex : A01"
            defaultValue={unit?.unitNumber}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Type <span className="text-danger">*</span>
            </label>
            <select
              name="type"
              required
              defaultValue={unit?.type ?? ""}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white
                         text-[14px] text-primary focus:outline-none focus:ring-2
                         focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="" disabled>
                Selectionner
              </option>
              {UNIT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          name="rentAmount"
          type="number"
          label="Loyer mensuel (XOF) *"
          placeholder="ex : 75000"
          defaultValue={unit?.baseRent?.toString()}
          required
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            name="area"
            type="number"
            label="Surface (m2)"
            placeholder="ex : 45"
            defaultValue={unit?.area?.toString()}
          />
          <Input
            name="rooms"
            type="number"
            label="Chambres"
            placeholder="ex : 2"
            defaultValue={unit?.rooms?.toString()}
          />
          <Input
            name="bathrooms"
            type="number"
            label="Salles de bain"
            placeholder="ex : 1"
            defaultValue={unit?.bathrooms?.toString()}
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
          <SubmitButton label={isEdit ? "Enregistrer" : "Creer le local"} />
        </div>
      </form>
    </Modal>
  );
}
