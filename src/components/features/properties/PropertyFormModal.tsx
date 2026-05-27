"use client";

import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { propertyService } from "@/lib/services/property.service";
import { neighborhoodService } from "@/lib/services/neighborhood.service";
import type {
  Property,
  PropertyType,
  Neighborhood,
  CreatePropertyPayload,
} from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  property?: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (p: Property) => void;
};

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "Apartment", label: "Appartement" },
  { value: "House", label: "Maison" },
  { value: "Commercial", label: "Commercial" },
  { value: "Office", label: "Bureau" },
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
                 transition-colors duration-150 flex items-center gap-2"
    >
      {pending && (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}

export function PropertyFormModal({ property, isOpen, onClose, onSaved }: Props) {
  const isEdit = !!property;

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNbh, setLoadingNbh] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingNbh(true);
    neighborhoodService
      .getAll({ limit: 200 })
      .then((res) => setNeighborhoods(res.data))
      .catch(() => {})
      .finally(() => setLoadingNbh(false));
  }, [isOpen]);

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const name = (formData.get("name") as string).trim();
      const address = (formData.get("address") as string).trim();
      const type = formData.get("type") as PropertyType;
      const neighborhoodId = (formData.get("neighborhoodId") as string).trim();
      const totalUnits = parseInt(formData.get("totalUnits") as string, 10);
      const description = (formData.get("description") as string).trim();

      if (!name || !address || !type || !neighborhoodId) {
        return {
          error: "Veuillez remplir tous les champs obligatoires.",
          success: false,
        };
      }
      if (isNaN(totalUnits) || totalUnits < 1) {
        return {
          error: "Le nombre de locaux doit etre au moins 1.",
          success: false,
        };
      }

      const payload: CreatePropertyPayload = {
        name,
        address,
        type,
        neighborhoodId,
        totalUnits,
        description: description || undefined,
      };

      try {
        const res = isEdit
          ? await propertyService.update(property!.id, payload)
          : await propertyService.create(payload);
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
      title={isEdit ? "Modifier le bien" : "Nouveau bien immobilier"}
    >
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger leading-snug"
          >
            {state.error}
          </div>
        )}

        <Input
          name="name"
          label="Nom du bien"
          placeholder="ex : Residence Les Palmiers"
          defaultValue={property?.name}
          required
        />

        <Input
          name="address"
          label="Adresse"
          placeholder="ex : Rue des Cocotiers, Cotonou"
          defaultValue={property?.address}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Type <span className="text-danger">*</span>
          </label>
          <select
            name="type"
            defaultValue={property?.type ?? ""}
            required
            className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white
                       text-[14px] text-primary focus:outline-none focus:ring-2
                       focus:ring-primary/20 focus:border-primary/40 transition-colors duration-150"
          >
            <option value="" disabled>
              Selectionner un type
            </option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Quartier <span className="text-danger">*</span>
          </label>
          <select
            name="neighborhoodId"
            defaultValue={property?.neighborhoodId ?? ""}
            required
            disabled={loadingNbh}
            className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white
                       text-[14px] text-primary focus:outline-none focus:ring-2
                       focus:ring-primary/20 focus:border-primary/40
                       disabled:opacity-50 transition-colors duration-150"
          >
            <option value="" disabled>
              {loadingNbh ? "Chargement..." : "Selectionner un quartier"}
            </option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} - {n.city}
              </option>
            ))}
          </select>
        </div>

        <Input
          name="totalUnits"
          type="number"
          label="Nombre de locaux"
          placeholder="ex : 12"
          defaultValue={property?.totalUnits?.toString()}
          hint="Nombre total de locaux / unites dans ce bien"
          required
        />

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Description (optionnel)
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={property?.description}
            placeholder="Informations complementaires sur le bien..."
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white
                       text-[14px] text-primary placeholder:text-primary/30
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40
                       resize-none transition-colors duration-150"
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
          <SubmitButton label={isEdit ? "Enregistrer" : "Creer le bien"} />
        </div>
      </form>
    </Modal>
  );
}
