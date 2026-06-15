import type { Tenant } from "./tenant";

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type PaymentStatus = "RECORDED" | "CANCELLED" | "REVERSED" | "failed";

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "MOBILE_MONEY"
  | "MTN_MOMO"
  | "MOOV_MONEY"
  | "CHEQUE"
  | "CARD"
  | "OTHER";

// ─── Entités ──────────────────────────────────────────────────────────────────

export type PaymentAllocation = {
  id: string;
  paymentId: string;
  rentScheduleId: string;
  allocatedAmount: string;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  leaseId: string;
  lease?: {
    id: string;
    tenant?: Tenant;
  };
  amount: string; // L'API retourne le montant en string
  paymentMethod?: string; // camelCase tel que retourné par l'API
  paymentDate?: string; // Date ISO du paiement
  reference?: string;
  receiptNumber?: string;
  notes?: string;
  status: PaymentStatus;
  allocations?: PaymentAllocation[];
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreatePaymentPayload = {
  leaseId: string;
  amount: number;
  method: PaymentMethod;
  paidAt?: string;
  notes?: string;
};

export type UpdatePaymentPayload = Partial<CreatePaymentPayload> & {
  status?: PaymentStatus;
};

export type CancelPaymentPayload = {
  reason: string;
};

export type CreatePaymentWithAllocationsPayload = {
  leaseId: string;
  amount: number;
  method: PaymentMethod;
  paidAt?: string;
  notes?: string;
  allocations: Array<{
    rentScheduleId: string;
    amount: number;
  }>;
};

export type AutoAllocatePaymentPayload = {
  leaseId: string;
  amount: string;
  paymentDate?: string; // date du paiement (format YYYY-MM-DD)
  paymentMethod?: PaymentMethod | string; // méthode de paiement
  reference?: string;
  notes?: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type PaymentFilterParams = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  lease?: string;
  tenant?: string;
  search?: string;
};
