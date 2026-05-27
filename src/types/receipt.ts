import type { Tenant } from './tenant';
import type { Payment } from './payment';

// ─── Entité principale ────────────────────────────────────────────────────────

export type Receipt = {
  id: string;
  paymentId: string;
  payment?: Payment;
  tenantId: string;
  tenant?: Tenant;
  amount: number;
  receiptDate: string;
  receiptNumber: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateReceiptPayload = {
  paymentId: string;
  tenantId: string;
  amount: number;
  receiptDate: string;
  receiptNumber: string;
};

export type UpdateReceiptPayload = {
  amount?: number;
  receiptDate?: string;
  receiptNumber?: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type ReceiptFilterParams = {
  page?: number;
  limit?: number;
  tenant?: string;
};
