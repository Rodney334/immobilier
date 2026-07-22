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
