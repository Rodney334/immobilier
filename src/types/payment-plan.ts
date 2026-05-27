import type { Lease } from './lease';

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type PaymentPlanFrequency = 'monthly' | 'bi-weekly' | 'weekly';

// ─── Entité principale ────────────────────────────────────────────────────────

export type PaymentPlan = {
  id: string;
  leaseId: string;
  lease?: Lease;
  startDate: string;
  endDate: string;
  installmentAmount: number;
  frequency: PaymentPlanFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreatePaymentPlanPayload = {
  leaseId: string;
  startDate: string;
  endDate: string;
  installmentAmount: number;
  frequency: PaymentPlanFrequency;
};

export type UpdatePaymentPlanPayload = {
  installmentAmount?: number;
  endDate?: string;
  frequency?: PaymentPlanFrequency;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type PaymentPlanFilterParams = {
  page?: number;
  limit?: number;
};
