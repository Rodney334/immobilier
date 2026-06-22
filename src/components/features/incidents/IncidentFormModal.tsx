"use client";

import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { incidentService } from "@/lib/services/incident.service";
import { unitService } from "@/lib/services/unit.service";
import type {
  Incident,
  Unit,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus,
  CreateIncidentPayload,
  UpdateIncidentPayload,
} from "@/types";

type FormState = { error: string | null; success: boolean };

type Props = {
  incident?: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (i: Incident) => void;
};

const CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: "PLUMBING", label: "Plomberie" },
  { value: "ELECTRICAL", label: "Électricité" },
  { value: "STRUCTURAL", label: "Structure" },
  { value: "APPLIANCE", label: "Équipements" },
  { value: "SECURITY", label: "Sécurité" },
  { value: "CLEANING", label: "Nettoyage" },
  { value: "OTHER", label: "Autre" },
];

const PRIORITIES: { value: IncidentPriority; label: string }[] = [
  { value: "LOW", label: "Faible" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL", label: "Critique" },
];

const STATUSES: { value: IncidentStatus; label: string }[] = [
  { value: "OPEN", label: "Ouvert" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED", label: "Résolu" },
  { value: "CLOSED", label: "Fermé" },
  { value: "CANCELLED", label: "Annulé" },
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

function SelectField({
  name,
  label,
  required,
  disabled,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <select
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue ?? ""}
        className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

export function IncidentFormModal({ incident, isOpen, onClose, onSaved }: Props) {
  const isEdit = !!incident;
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    if (!isOpen || isEdit) return;
    setLoadingUnits(true);
    unitService
      .getAll({ limit: 200 })
      .then((res) => setUnits(res.data))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }, [isOpen, isEdit]);

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      if (isEdit) {
        // Update mode
        const status = formData.get("status") as IncidentStatus;
        const priority = formData.get("priority") as IncidentPriority;
        const assignedTo = (formData.get("assignedTo") as string).trim();
        const actualCost = (formData.get("actualCost") as string).trim();
        const resolutionNotes = (formData.get("resolutionNotes") as string).trim();

        const payload: UpdateIncidentPayload = {
          status: status || undefined,
          priority: priority || undefined,
          assignedTo: assignedTo || undefined,
          actualCost: actualCost ? Number(actualCost) : undefined,
          resolutionNotes: resolutionNotes || undefined,
        };

        try {
          const res = await incidentService.update(incident!.id, payload);
          onSaved(res.data);
          onClose();
          return { error: null, success: true };
        } catch (err: unknown) {
          return { error: err instanceof Error ? err.message : "Une erreur est survenue.", success: false };
        }
      } else {
        // Create mode
        const unitId = formData.get("unitId") as string;
        const title = (formData.get("title") as string).trim();
        const description = (formData.get("description") as string).trim();
        const category = formData.get("category") as IncidentCategory;
        const priority = formData.get("priority") as IncidentPriority;
        const estimatedCost = (formData.get("estimatedCost") as string).trim();
        const assignedTo = (formData.get("assignedTo") as string).trim();

        if (!unitId || !title || !category || !priority) {
          return { error: "Local, titre, catégorie et priorité sont obligatoires.", success: false };
        }

        const payload: CreateIncidentPayload = {
          unitId,
          title,
          description: description || undefined,
          category,
          priority,
          estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
          assignedTo: assignedTo || undefined,
        };

        try {
          const res = await incidentService.create(payload);
          onSaved(res.data);
          onClose();
          return { error: null, success: true };
        } catch (err: unknown) {
          return { error: err instanceof Error ? err.message : "Une erreur est survenue.", success: false };
        }
      }
    },
    { error: null, success: false },
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier l'incident" : "Signaler un incident"}
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

        {!isEdit && (
          <SelectField
            name="unitId"
            label="Local"
            required
            disabled={loadingUnits}
            defaultValue=""
          >
            <option value="" disabled>
              {loadingUnits ? "Chargement..." : "Sélectionner un local"}
            </option>
            {units.map((u) => (
              <option key={u._id} value={u._id}>
                {`Local ${u.unitNumber}${u.property ? ` - ${u.property.name}` : ""}${u.label ? ` (${u.label})` : ""}`}
              </option>
            ))}
          </SelectField>
        )}

        {isEdit && (
          <div className="px-3 py-2.5 rounded-lg bg-neutral border border-border-custom text-[13px] text-primary/60">
            Local : {incident.unit
              ? `${incident.unit.unitNumber}${incident.unit.property ? ` — ${incident.unit.property.name}` : ""}`
              : incident.unitId}
          </div>
        )}

        {!isEdit && (
          <>
            <Input
              name="title"
              label="Titre"
              placeholder="ex : Fuite d'eau dans la salle de bain"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
                Description (optionnel)
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Détails supplémentaires..."
                className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField name="category" label="Catégorie" required>
                <option value="" disabled>Sélectionner</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </SelectField>

              <SelectField name="priority" label="Priorité" required>
                <option value="" disabled>Sélectionner</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="estimatedCost"
                type="number"
                label="Coût estimé (XOF, optionnel)"
                placeholder="ex : 50000"
              />
              <Input
                name="assignedTo"
                label="Assigné à (optionnel)"
                placeholder="ex : Technicien Martin"
              />
            </div>
          </>
        )}

        {isEdit && (
          <>
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">Titre</p>
              <p className="text-[14px] text-primary">{incident.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField name="status" label="Statut" defaultValue={incident.status}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </SelectField>

              <SelectField name="priority" label="Priorité" defaultValue={incident.priority}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="actualCost"
                type="number"
                label="Coût réel (XOF)"
                placeholder="ex : 45000"
                defaultValue={incident.actualCost?.toString()}
              />
              <Input
                name="assignedTo"
                label="Assigné à"
                placeholder="ex : Technicien Martin"
                defaultValue={incident.assignedTo ?? ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
                Notes de résolution
              </label>
              <textarea
                name="resolutionNotes"
                rows={3}
                defaultValue={incident.resolutionNotes ?? ""}
                placeholder="Décrire les actions effectuées..."
                className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border-custom">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors duration-150"
          >
            Annuler
          </button>
          <SubmitButton label={isEdit ? "Enregistrer" : "Signaler"} />
        </div>
      </form>
    </Modal>
  );
}
