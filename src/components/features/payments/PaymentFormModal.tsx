"use client";

import { useEffect, useActionState, useRef, useState } from "react";
// Note : useEffect est conservé pour charger les baux à l'ouverture du modal.
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { paymentService } from "@/lib/services/payment.service";
import { leaseService } from "@/lib/services/lease.service";
import { rentScheduleService } from "@/lib/services/rent-schedule.service";
import type {
  ApiResponse,
  Lease,
  Payment,
  PaymentAllocationInput,
  PaymentMethod,
  RentSchedule,
  RentScheduleStatus,
} from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Especes" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "MTN_MOMO", label: "MTN MoMo" },
  { value: "MOOV_MONEY", label: "MOOV Money" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Autre" },
];

type AllocationMode = "auto" | "manual";

const MODES: { value: AllocationMode; label: string }[] = [
  { value: "auto", label: "Automatique" },
  { value: "manual", label: "Manuelle" },
];

// Échéances sur lesquelles un paiement peut encore être imputé
const PAYABLE_STATUS: Partial<
  Record<
    RentScheduleStatus,
    { label: string; variant: "neutral" | "warning" | "danger" }
  >
> = {
  OVERDUE: { label: "En retard", variant: "danger" },
  PARTIALLY_PAID: { label: "Partiel", variant: "warning" },
  PENDING: { label: "En attente", variant: "neutral" },
};

const fmt = new Intl.NumberFormat("fr-FR");

// L'API peut retourner des montants en string ("25000.00") — on force en number
function toNum(v?: number | string | null): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

function scheduleDue(s: RentSchedule): number {
  return toNum(s.amountDue ?? s.amount);
}

function scheduleBalance(s: RentSchedule): number {
  const paid = toNum(s.amountPaid ?? s.paidAmount);
  return toNum(s.balance ?? s.remainingAmount ?? scheduleDue(s) - paid);
}

function schedulePeriod(s: RentSchedule): string {
  return new Date(s.dueDate).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

type FormState = { error: string | null; success: boolean };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (p: Payment) => void;
};

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
    >
      {pending && (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      )}
      Enregistrer le paiement
    </button>
  );
}

export function PaymentFormModal({ isOpen, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loadingLeases, setLoadingLeases] = useState(isOpen);

  const [mode, setMode] = useState<AllocationMode>("auto");
  const [leaseId, setLeaseId] = useState("");
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  // Échéances cochées → montant saisi (string pour garder la saisie telle quelle)
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  // Ignore les réponses d'un contrat précédemment sélectionné
  const schedulesRequest = useRef(0);

  // Le composant reste monté entre deux ouvertures : on repart d'un formulaire
  // vierge à chaque ouverture (reset pendant le rendu plutôt que dans l'effet).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setMode("auto");
      setLeaseId("");
      setSchedules([]);
      setSchedulesError(null);
      setAllocations({});
      setLoadingLeases(true);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    leaseService
      .getAll({ limit: 200, status: "ACTIVE" })
      .then((res) => setLeases(res.data))
      .catch(() => {})
      .finally(() => setLoadingLeases(false));
  }, [isOpen]);

  async function loadSchedules(id: string) {
    const requestId = ++schedulesRequest.current;
    setSchedules([]);
    setSchedulesError(null);
    setAllocations({});
    if (!id) return;

    setLoadingSchedules(true);
    try {
      const res = await rentScheduleService.getAll({ lease: id, limit: 200 });
      if (requestId !== schedulesRequest.current) return;
      const payable = (Array.isArray(res.data) ? res.data : [])
        .filter(
          (s) =>
            (s.leaseId ?? s.lease?.id) === id &&
            s.status in PAYABLE_STATUS &&
            scheduleBalance(s) > 0,
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
      setSchedules(payable);
    } catch {
      if (requestId === schedulesRequest.current) {
        setSchedulesError("Impossible de charger les echeances de ce contrat.");
      }
    } finally {
      if (requestId === schedulesRequest.current) setLoadingSchedules(false);
    }
  }

  function handleLeaseChange(id: string) {
    setLeaseId(id);
    if (mode === "manual") loadSchedules(id);
  }

  function handleModeChange(next: AllocationMode) {
    if (next === mode) return;
    setMode(next);
    if (next === "manual") loadSchedules(leaseId);
  }

  function toggleSchedule(s: RentSchedule) {
    setAllocations((prev) => {
      const next = { ...prev };
      if (s.id in next) delete next[s.id];
      else next[s.id] = String(scheduleBalance(s));
      return next;
    });
  }

  function setAllocationAmount(id: string, value: string) {
    setAllocations((prev) => ({ ...prev, [id]: value }));
  }

  const selectedCount = Object.keys(allocations).length;
  const manualTotal = Object.values(allocations).reduce(
    (sum, v) => sum + toNum(v),
    0,
  );

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const leaseId = formData.get("leaseId") as string;
      const paymentDate = (formData.get("paymentDate") as string).trim();
      const paymentMethod = formData.get("paymentMethod") as PaymentMethod | "";
      const reference = (formData.get("reference") as string).trim();
      const notes = (formData.get("notes") as string).trim();
      const allocationMode = formData.get("allocationMode") as AllocationMode;

      if (!leaseId) {
        return { error: "Veuillez selectionner un contrat.", success: false };
      }

      if (!paymentDate) {
        return {
          error: "La date de paiement est obligatoire.",
          success: false,
        };
      }

      if (!paymentMethod) {
        return {
          error: "Veuillez selectionner la methode de paiement.",
          success: false,
        };
      }

      try {
        let res: ApiResponse<Payment>;

        if (allocationMode === "manual") {
          const items = JSON.parse(
            formData.get("allocations") as string,
          ) as PaymentAllocationInput[];

          if (items.length === 0) {
            return {
              error: "Selectionnez au moins une echeance a regler.",
              success: false,
            };
          }
          if (items.some((a) => toNum(a.allocatedAmount) <= 0)) {
            return {
              error: "Chaque montant impute doit etre superieur a 0.",
              success: false,
            };
          }

          const total = items.reduce(
            (sum, a) => sum + toNum(a.allocatedAmount),
            0,
          );

          res = await paymentService.createWithAllocations({
            leaseId,
            paymentDate: new Date(paymentDate).toISOString(),
            amount: String(total),
            status: "RECORDED",
            paymentMethod,
            reference: reference || undefined,
            notes: notes || undefined,
            allocations: items,
          });
        } else {
          const amountStr = (formData.get("amount") as string).trim();
          const amount = parseFloat(amountStr);
          if (!amountStr || isNaN(amount) || amount <= 0) {
            return {
              error: "Le montant doit etre superieur a 0.",
              success: false,
            };
          }

          res = await paymentService.autoAllocate({
            leaseId,
            amount: amountStr,
            paymentDate,
            paymentMethod,
            reference: reference || undefined,
            notes: notes || undefined,
          });
        }

        onSaved(res.data);
        toast({
          variant: "success",
          title: "Paiement enregistre",
          description: "Le recu est en cours de generation.",
        });
        // Fermer directement depuis l'action plutôt que via un useEffect qui lirait
        // state.success — ce dernier reste "true" d'une ouverture à l'autre et
        // provoquerait la fermeture immédiate du modal lors d'une deuxième soumission.
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

  const today = new Date().toISOString().split("T")[0];

  const allocationsPayload: PaymentAllocationInput[] = Object.entries(
    allocations,
  ).map(([rentScheduleId, value]) => ({
    rentScheduleId,
    allocatedAmount: String(toNum(value)),
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer un paiement">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger"
          >
            {state.error}
          </div>
        )}

        <input type="hidden" name="allocationMode" value={mode} />
        <input
          type="hidden"
          name="allocations"
          value={JSON.stringify(allocationsPayload)}
        />

        <div className="space-y-1.5">
          <span className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Repartition
          </span>
          <div
            role="radiogroup"
            aria-label="Mode de repartition du paiement"
            className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-primary/5"
          >
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                onClick={() => handleModeChange(m.value)}
                className={`h-9 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  mode === m.value
                    ? "bg-white text-primary shadow-sm"
                    : "text-primary/50 hover:text-primary"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Contrat <span className="text-danger">*</span>
          </label>
          {loadingLeases ? (
            <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-border-custom bg-white text-[13px] text-primary/40">
              <Loader2 size={13} className="animate-spin" />
              Chargement...
            </div>
          ) : (
            <select
              name="leaseId"
              required
              value={leaseId}
              onChange={(e) => handleLeaseChange(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">Selectionner un contrat...</option>
              {leases.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.tenant?.fullName} {" - "} {l.contractNumber}
                </option>
              ))}
            </select>
          )}
        </div>

        {mode === "manual" ? (
          <>
            <div className="space-y-1.5">
              <span className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
                Echeances a regler <span className="text-danger">*</span>
              </span>
              {!leaseId ? (
                <p className="px-3 py-4 rounded-lg border border-dashed border-border-custom text-[13px] text-primary/40 text-center">
                  Selectionnez un contrat pour afficher ses echeances impayees.
                </p>
              ) : loadingSchedules ? (
                <div className="flex items-center justify-center gap-2 px-3 py-4 rounded-lg border border-border-custom text-[13px] text-primary/40">
                  <Loader2 size={13} className="animate-spin" />
                  Chargement des echeances...
                </div>
              ) : schedulesError ? (
                <p className="px-3 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger">
                  {schedulesError}
                </p>
              ) : schedules.length === 0 ? (
                <p className="px-3 py-4 rounded-lg border border-dashed border-border-custom text-[13px] text-primary/40 text-center">
                  Aucune echeance impayee sur ce contrat.
                </p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {schedules.map((s) => {
                    const checked = s.id in allocations;
                    const balance = scheduleBalance(s);
                    const period = schedulePeriod(s);
                    const cfg = PAYABLE_STATUS[s.status];
                    const value = allocations[s.id] ?? "";
                    const tooHigh = checked && toNum(value) > balance;
                    return (
                      <li
                        key={s.id}
                        className={`rounded-lg border px-3 py-2.5 transition-colors duration-150 ${
                          checked
                            ? "border-secondary/50 bg-secondary/5"
                            : "border-border-custom bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            id={`schedule-${s.id}`}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSchedule(s)}
                            className="h-4 w-4 shrink-0 accent-primary cursor-pointer"
                          />
                          <label
                            htmlFor={`schedule-${s.id}`}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <span className="block text-[13px] font-semibold text-primary capitalize">
                              {period}
                            </span>
                            <span className="block text-[12px] text-primary/50 tabular-nums">
                              Reste {fmt.format(balance)} XOF sur{" "}
                              {fmt.format(scheduleDue(s))} XOF
                            </span>
                          </label>
                          {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
                        </div>

                        {checked && (
                          <div className="mt-2 pl-7">
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max={balance}
                                step="1"
                                required
                                value={value}
                                onChange={(e) =>
                                  setAllocationAmount(s.id, e.target.value)
                                }
                                aria-label={`Montant impute sur ${period}`}
                                aria-invalid={tooHigh}
                                className={`w-full h-9 px-3 pr-12 rounded-lg border bg-white text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors tabular-nums ${
                                  tooHigh
                                    ? "border-danger/60"
                                    : "border-border-custom focus:border-primary/40"
                                }`}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-primary/40 pointer-events-none">
                                XOF
                              </span>
                            </div>
                            {tooHigh && (
                              <p className="mt-1 text-[12px] text-danger">
                                Le montant depasse le reste du ({fmt.format(balance)} XOF).
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-3 h-11 rounded-lg bg-primary/5">
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
                Total ({selectedCount} echeance{selectedCount > 1 ? "s" : ""})
              </span>
              <span className="text-[14px] font-semibold text-primary tabular-nums">
                {fmt.format(manualTotal)} XOF
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Montant (XOF) <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                name="amount"
                type="number"
                min="1"
                step="1"
                required
                placeholder="ex : 150000"
                className="w-full h-11 px-3 pr-14 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-primary/40 pointer-events-none">
                XOF
              </span>
            </div>
          </div>
        )}

        <Input
          name="paymentDate"
          type="date"
          label="Date de paiement *"
          defaultValue={today}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Methode de paiement <span className="text-danger">*</span>
            </label>
            <select
              name="paymentMethod"
              required
              defaultValue=""
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="" disabled>
                Selectionner...
              </option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            name="reference"
            label="Reference (optionnel)"
            placeholder="ex : VIR-2026-001"
          />
        </div>

        <Input
          name="notes"
          label="Note (optionnel)"
          placeholder="ex : Paiement de deux mois"
        />

        <p className="text-[12px] text-primary/40 leading-relaxed">
          {mode === "manual"
            ? "Le paiement sera impute uniquement sur les echeances cochees, a hauteur des montants saisis."
            : "Le paiement sera automatiquement alloue aux echeances impayees du locataire selectionne (ordre chronologique)."}
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border-custom">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors duration-150"
          >
            Annuler
          </button>
          <SubmitButton disabled={mode === "manual" && selectedCount === 0} />
        </div>
      </form>
    </Modal>
  );
}
