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

export type PaymentFrequency =
  | "monthly"
  | "bi-weekly"
  | "weekly"
  | "quarterly"
  | "annual";

// ─── Entité principale ────────────────────────────────────────────────────────

export type Lease = {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  unitId: string;
  unit?: Unit;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount?: number;
  paymentFrequency: PaymentFrequency;
  status: LeaseStatus;
  terminationDate?: string;
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateLeasePayload = {
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount?: number;
  paymentFrequency: PaymentFrequency;
};

export type UpdateLeasePayload = Partial<
  Pick<
    CreateLeasePayload,
    "rentAmount" | "endDate" | "depositAmount" | "paymentFrequency"
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
};
