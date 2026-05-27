// PaymentAllocation est désormais défini dans payment.ts
// Ce fichier conserve la compatibilité avec les imports existants.
export type { PaymentAllocation } from './payment';

// ─── Payloads (conservés pour le service) ────────────────────────────────────

export type CreatePaymentAllocationPayload = {
  paymentId: string;
  rentScheduleId: string;
  amount: number;
};

export type UpdatePaymentAllocationPayload = {
  amount: number;
};

export type PaymentAllocationFilterParams = {
  page?: number;
  limit?: number;
  payment?: string;
};
