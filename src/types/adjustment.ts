import { Lease } from "./lease";

// Valeurs exactes de l'API (enum backend)
export type AdjustmentType =
  | "DISCOUNT"
  | "PENALTY"
  | "CORRECTION"
  | "RENT_REVISION"
  | "WAIVER";
export type AdjustmentValueMode = "FIXED" | "PERCENTAGE";

export type Adjustment = {
  id: string;
  rentScheduleId?: string;
  lease?: Lease;
  leaseId?: string;
  type: AdjustmentType;
  amount: string; // string — champ API
  valueMode?: AdjustmentValueMode;
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
  amount: string; // string requis par l'API (ex: "10000")
  valueMode?: AdjustmentValueMode;
  reason: string;
  effectiveDate: string; // ISO datetime ex: "2026-10-03T08:00:00.000Z"
};

export type UpdateAdjustmentPayload = {
  amount?: string;
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
