import type { Lease } from './lease';

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type RentScheduleStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

// ─── Entité principale ────────────────────────────────────────────────────────

export type RentSchedule = {
  id: string;
  leaseId: string;
  lease?: Lease;
  dueDate: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: RentScheduleStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateRentSchedulePayload = {
  leaseId: string;
  dueDate: string;
  amount: number;
  description?: string;
};

export type UpdateRentSchedulePayload = {
  amount?: number;
  dueDate?: string;
  description?: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type RentScheduleFilterParams = {
  page?: number;
  limit?: number;
  status?: RentScheduleStatus;
  lease?: string;
};
