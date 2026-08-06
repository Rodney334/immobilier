import { Lease } from "./lease";

// Valeurs exactes de l'API (enum backend)
export type AdjustmentType =
  | "DISCOUNT"
  | "PENALTY"
  | "CORRECTION"
  | "RENT_REVISION"
  | "WAIVER";
export type AdjustmentValueMode = "FIXED" | "PERCENTAGE";

// Référence utilisée pour calculer le montant en mode PERCENTAGE.
// LEASE_MONTHLY_RENT (défaut) = loyer courant du bail ; UNIT_BASE_RENT = loyer
// de base du local (indépendant d'éventuelles révisions déjà appliquées).
export type AdjustmentBaseReference = "LEASE_MONTHLY_RENT" | "UNIT_BASE_RENT";

// RENT (défaut) = ajustement sur le loyer/les échéances ; DEPOSIT = retenue
// sur la caution — ne se rattache à aucune échéance (rentScheduleId ignoré).
export type AdjustmentAppliesTo = "RENT" | "DEPOSIT";

export type Adjustment = {
  id: string;
  rentScheduleId?: string;
  lease?: Lease;
  leaseId?: string;
  type: AdjustmentType;
  amount: string; // string — champ API — calculé par le back en mode PERCENTAGE
  valueMode?: AdjustmentValueMode;
  percentage?: string; // renseigné si valueMode === "PERCENTAGE"
  baseReference?: AdjustmentBaseReference;
  baseAmountSnapshot?: string; // montant de référence utilisé au moment du calcul
  appliesTo?: AdjustmentAppliesTo;
  incidentId?: string;
  reason: string;
  label?: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdjustmentPayload = {
  rentScheduleId?: string;
  leaseId?: string;
  type: AdjustmentType;
  label?: string;
  // Mode fixe (défaut) : amount requis. Mode pourcentage : amount doit être
  // omis, le back le calcule à partir de percentage + baseReference.
  amount?: string;
  valueMode?: AdjustmentValueMode;
  percentage?: string; // requis si valueMode === "PERCENTAGE", entre 0 et 100
  baseReference?: AdjustmentBaseReference; // défaut LEASE_MONTHLY_RENT
  appliesTo?: AdjustmentAppliesTo; // défaut RENT
  incidentId?: string;
  reason: string;
  effectiveDate: string; // ISO datetime ex: "2026-10-03T08:00:00.000Z"
};

export type UpdateAdjustmentPayload = {
  // leaseId, type et rentScheduleId sont immuables après création côté API.
  amount?: string;
  valueMode?: AdjustmentValueMode;
  percentage?: string;
  baseReference?: AdjustmentBaseReference;
  appliesTo?: AdjustmentAppliesTo;
  incidentId?: string;
  label?: string;
  reason?: string;
  effectiveDate?: string;
};

export type AdjustmentFilterParams = {
  page?: number;
  limit?: number;
  type?: AdjustmentType;
  lease?: string;
  dateFrom?: string;
  dateTo?: string;
};

// ─── Action groupée — POST /adjustments/waive-upcoming ───────────────────────
// 3 façons de cibler les échéances (mutuellement exclusives) :
//  - monthsCount        → les N prochaines échéances non payées
//  - rentScheduleIds    → des échéances précises (pas besoin d'être consécutives)
//  - ni l'un ni l'autre → toutes les échéances restantes du bail
// "amount" transforme l'exonération totale en remise partielle (chaque
// échéance est réduite de ce montant, jamais en dessous de 0).

export type WaiveUpcomingPayload = {
  leaseId: string;
  monthsCount?: number;
  rentScheduleIds?: string[];
  amount?: number;
  reason?: string;
  startFromDate?: string;
};

export type WaiveUpcomingResult = {
  message?: string;
  updatedCount?: number;
  count?: number;
  totalWaived?: number;
  rentScheduleIds?: string[];
  adjustments?: Adjustment[];
};
