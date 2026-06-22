"use client";

import { useEffect, useState, useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { tenantService } from "@/lib/services/tenant.service";
import { unitService } from "@/lib/services/unit.service";
import { leaseService } from "@/lib/services/lease.service";
import type {
  Lease,
  Tenant,
  Unit,
  LeasePeriodicity,
  CreateLeasePayload,
} from "@/types";

const PERIODICITIES: { value: LeasePeriodicity; label: string }[] = [
  { value: "MONTHLY", label: "Mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "YEARLY", label: "Annuel" },
];

type FormState = { error: string | null; success: boolean };

type Props = {
  lease?: Lease | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (l: Lease) => void;
};

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
  value,
  onChange,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  children: ReactNode;
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
        {...(onChange !== undefined
          ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
          : { defaultValue: defaultValue ?? "" })}
        className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 disabled:bg-neutral transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

export function LeaseFormModal({ lease, isOpen, onClose, onSaved }: Props) {
  const isEdit = !!lease;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  // Controlled unit selection — pour dériver le baseRent automatiquement
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    lease?.unitId ?? "",
  );
  const selectedUnit = units.find((u) => u._id === selectedUnitId);

  // Loyer : verrouillé sur baseRent du local en mode création
  const autoRent = !isEdit && selectedUnit ? (selectedUnit.baseRent ?? "") : "";
  const [rentValue, setRentValue] = useState<string>(lease?.monthlyRent ?? "");

  // Sync rentValue quand le local change (création) ou quand le modal s'ouvre (édition)
  useEffect(() => {
    if (!isEdit && selectedUnit) {
      setRentValue(selectedUnit.baseRent.toString() ?? "");
    }
  }, [selectedUnit, isEdit]);

  // Reset des états locaux à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSelectedUnitId(lease?.unitId ?? "");
      setRentValue(lease?.monthlyRent ?? "");
    }
  }, [isOpen, lease]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingOpts(true);
    Promise.allSettled([
      tenantService.getAll({ limit: 200, status: "ACTIVE" }),
      isEdit
        ? unitService.getAll({ limit: 200 })
        : unitService.getAll({ limit: 200, status: "AVAILABLE" }),
    ])
      .then(([tRes, uRes]) => {
        if (tRes.status === "fulfilled") setTenants(tRes.value.data);
        if (uRes.status === "fulfilled") {
          const fetched = uRes.value.data;
          setUnits(fetched);
          // Si on édite, pré-sélectionner le local courant même s'il n'est pas AVAILABLE
          if (isEdit && lease?.unitId) {
            setSelectedUnitId(lease.unitId);
          }
        }
      })
      .finally(() => setLoadingOpts(false));
  }, [isOpen, isEdit, lease?.unitId]);

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const tenantId = formData.get("tenantId") as string;
      const unitId = formData.get("unitId") as string;
      const startDate = formData.get("startDate") as string;
      const endDate = (formData.get("endDate") as string).trim();
      const monthlyRent = (formData.get("monthlyRent") as string).trim();
      const depositAmount = (formData.get("depositAmount") as string).trim();
      const periodicity = formData.get("periodicity") as LeasePeriodicity | "";
      const billingDay = (formData.get("billingDay") as string).trim();

      if (!tenantId || !unitId || !startDate) {
        return {
          error: "Locataire, local et date de debut sont obligatoires.",
          success: false,
        };
      }
      if (
        !monthlyRent ||
        isNaN(Number(monthlyRent)) ||
        Number(monthlyRent) <= 0
      ) {
        return {
          error: "Le montant du loyer doit etre superieur a 0.",
          success: false,
        };
      }
      if (endDate && new Date(endDate) <= new Date(startDate)) {
        return {
          error: "La date de fin doit etre posterieure a la date de debut.",
          success: false,
        };
      }

      const payload: CreateLeasePayload = {
        tenantId,
        unitId,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        monthlyRent,
        depositAmount:
          depositAmount && Number(depositAmount) > 0
            ? depositAmount
            : undefined,
        periodicity: periodicity || undefined,
        billingDay: billingDay ? parseInt(billingDay, 10) : undefined,
        status: "ACTIVE",
      };

      try {
        const res = isEdit
          ? await leaseService.update(lease!.id, {
              monthlyRent: payload.monthlyRent,
              periodicity: payload.periodicity,
              depositAmount: payload.depositAmount,
              endDate: payload.endDate,
            })
          : await leaseService.create(payload);
        onSaved(res.data);
        onClose();
        return { error: null, success: true };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Une erreur est survenue.";
        return { error: msg, success: false };
      }
    },
    { error: null, success: false },
  );

  // En mode création, le loyer est verrouillé sur le baseRent du local sélectionné
  const rentLocked = !isEdit && !!selectedUnitId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier le contrat" : "Nouveau contrat de bail"}
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

        <SelectField
          name="tenantId"
          label="Locataire"
          required
          disabled={isEdit || loadingOpts}
          defaultValue={isEdit ? (lease?.tenantId ?? "") : undefined}
        >
          <option value="" disabled>
            {loadingOpts ? "Chargement..." : "Selectionner un locataire"}
          </option>
          {tenants.map((t, i) => (
            <option key={t._id + i} value={t._id}>
              {t.fullName ?? `${t.firstName} ${t.lastName}`}
            </option>
          ))}
        </SelectField>

        {/* Local — contrôlé pour dériver le baseRent */}
        <SelectField
          name="unitId"
          label="Local"
          required
          disabled={isEdit || loadingOpts}
          value={isEdit ? (lease?.unitId ?? "") : selectedUnitId}
          onChange={isEdit ? undefined : setSelectedUnitId}
        >
          <option value="" disabled>
            {loadingOpts
              ? "Chargement..."
              : isEdit
                ? "Non modifiable"
                : "Selectionner un local vacant"}
          </option>
          {units.map((u, i) => (
            <option key={u._id + i} value={u._id}>
              {`Local ${u.unitNumber}${u.property ? ` - ${u.property.name}` : ""}`}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="startDate"
            type="date"
            label="Date de debut"
            required
            defaultValue={lease?.startDate?.slice(0, 10)}
            readOnly={isEdit}
          />
          <Input
            name="endDate"
            type="date"
            label="Date de fin (optionnel)"
            defaultValue={lease?.endDate?.slice(0, 10)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Loyer — verrouillé sur baseRent en création, éditable en modification */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Loyer mensuel (XOF) <span className="text-danger">*</span>
            </label>
            <input
              name="monthlyRent"
              type="number"
              required
              value={rentLocked ? autoRent : rentValue}
              onChange={
                rentLocked
                  ? () => {} // readOnly — pas de modification
                  : (e) => setRentValue(e.target.value)
              }
              readOnly={rentLocked}
              placeholder="ex : 75000"
              className={[
                "w-full h-11 px-3 rounded-lg border border-border-custom text-[14px] text-primary",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors",
                rentLocked
                  ? "bg-neutral cursor-not-allowed text-primary/50"
                  : "bg-white",
              ].join(" ")}
            />
            {rentLocked && selectedUnit && (
              <p className="text-[11px] text-primary/40">
                Défini par le loyer de base du local
              </p>
            )}
          </div>

          <Input
            name="depositAmount"
            type="number"
            label="Caution (XOF, optionnel)"
            placeholder="ex : 150000"
            defaultValue={lease?.depositAmount}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            name="periodicity"
            label="Periodicite"
            defaultValue={lease?.periodicity ?? ""}
          >
            <option value="">Selectionner (optionnel)</option>
            {PERIODICITIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </SelectField>
          <Input
            name="billingDay"
            type="number"
            label="Jour de facturation"
            placeholder="ex : 5"
            defaultValue={lease?.billingDay?.toString()}
            hint="Jour du mois (1-31)"
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
          <SubmitButton label={isEdit ? "Enregistrer" : "Creer le contrat"} />
        </div>
      </form>
    </Modal>
  );
}
