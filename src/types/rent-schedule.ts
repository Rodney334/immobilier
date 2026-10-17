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
  // Le back attend "leaseId", pas "lease" — un appel avec "lease" est
  // silencieusement ignoré côté back (le filtre ne s'applique pas du
  // tout), et la pagination renvoie alors les échéances les plus
  // récentes de TOUTE la base plutôt que celles du bail demandé. Les
  // échéances anciennes d'un bail donné (ex: 2021) peuvent alors
  // disparaître des listes qui dépendent de ce filtre.
  leaseId?: string;
  month?: number;
  year?: number;
  property?: string;
};