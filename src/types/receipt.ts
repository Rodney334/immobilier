import type { Tenant } from "./tenant";
import type { Lease } from "./lease";

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type ReceiptStatus = "GENERATED" | "CANCELLED";

// ─── Entité principale ────────────────────────────────────────────────────────

export type Receipt = {
  id: string;
  paymentId: string;
  leaseId?: string;
  lease?: Lease;
  tenantId: string;
  tenant?: Tenant;
  amount: string; // string comme les autres montants
  receiptDate?: string;
  issuedAt?: string; // alias possible côté API
  receiptNumber?: string;
  status: ReceiptStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type UpdateReceiptPayload = {
  notes?: string;
};

export type CancelReceiptPayload = {
  reason?: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type ReceiptFilterParams = {
  page?: number;
  limit?: number;
  status?: ReceiptStatus;
  tenant?: string;
  search?: string;
  month?: number; // 1-12
  year?: number;
};
