import type { Tenant } from "./tenant";
import type { Unit } from "./unit";

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type LeaseStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED"
  | "EXPIRED"
  | "ARCHIVED";

// Valeurs acceptées par l'API (periodicity)
export type LeasePeriodicity =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

// Alias rétro-compatible
export type PaymentFrequency = LeasePeriodicity;

// ─── Entité principale ────────────────────────────────────────────────────────

export type Lease = {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  unitId: string;
  unit?: Unit;
  contractNumber?: string;
  startDate: string;
  endDate?: string;
  monthlyRent: string; // string — champ API
  depositAmount?: string; // string — champ API
  periodicity?: LeasePeriodicity;
  billingDay?: number;
  status: LeaseStatus;
  notes?: string;
  terminationDate?: string;
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateLeasePayload = {
  unitId: string;
  tenantId: string;
  contractNumber?: string;
  startDate: string;
  endDate?: string;
  monthlyRent: string; // string requis par l'API (ex: "150000")
  depositAmount?: string; // string optionnel (ex: "150000")
  billingDay?: number;
  periodicity?: LeasePeriodicity;
  status?: LeaseStatus;
  terminationReason?: string;
  notes?: string;
};

export type UpdateLeasePayload = Partial<
  Pick<
    CreateLeasePayload,
    | "monthlyRent"
    | "endDate"
    | "depositAmount"
    | "periodicity"
    | "billingDay"
    | "notes"
  >
>;

export type TerminateLeasePayload = {
  terminationDate: string;
  reason?: string;
};

export type TransferLeasePayload = {
  newUnitId: string;
  transferDate: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type LeaseFilterParams = {
  page?: number;
  limit?: number;
  status?: LeaseStatus;
  tenant?: string;
  unit?: string;
  search?: string;
};
