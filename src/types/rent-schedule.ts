import type { Lease } from './lease';

// Valeurs exactes de l'API (enum backend)
export type RentScheduleStatus = 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export type RentSchedule = {
  id: string;
  leaseId: string;
  lease?: Lease;
  dueDate: string;
  amount: number;
  amountDue?: number;
  amountPaid?: number;
  balance?: number;
  // Aliases pour compatibilite selon version API
  paidAmount?: number;
  remainingAmount?: number;
  status: RentScheduleStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

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

export type RentScheduleFilterParams = {
  page?: number;
  limit?: number;
  status?: RentScheduleStatus;
  lease?: string;
  month?: number;
  year?: number;
  property?: string;
};
