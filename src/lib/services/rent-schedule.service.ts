import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  RentSchedule,
  RentScheduleFilterParams,
  CreateRentSchedulePayload,
  UpdateRentSchedulePayload,
} from '@/types';

const BASE = '/api/v1/rent-schedules';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const rentScheduleService = {
  getAll(
    params?: RentScheduleFilterParams,
  ): Promise<PaginatedResponse<RentSchedule>> {
    return api.get<PaginatedResponse<RentSchedule>>(
      `${BASE}/${buildQS(params)}`,
    );
  },

  getById(id: string): Promise<ApiResponse<RentSchedule>> {
    return api.get<ApiResponse<RentSchedule>>(`${BASE}/${id}`);
  },

  create(
    payload: CreateRentSchedulePayload,
  ): Promise<ApiResponse<RentSchedule>> {
    return api.post<ApiResponse<RentSchedule>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdateRentSchedulePayload,
  ): Promise<ApiResponse<RentSchedule>> {
    return api.patch<ApiResponse<RentSchedule>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  /**
   * Recalculer le montant d'une échéance (ajustements compris).
   */
  recalculate(id: string): Promise<ApiResponse<RentSchedule>> {
    return api.patch<ApiResponse<RentSchedule>>(
      `${BASE}/${id}/recalculate`,
    );
  },

  /**
   * Passer en "overdue" toutes les échéances dont la date est dépassée.
   */
  markOverdue(): Promise<ApiResponse<{ updated: number }>> {
    return api.patch<ApiResponse<{ updated: number }>>(`${BASE}/mark-overdue`);
  },

  /**
   * Clôturer toutes les échéances futures d'un bail donné.
   */
  closeFutureByLease(leaseId: string): Promise<ApiResponse<null>> {
    return api.patch<ApiResponse<null>>(
      `${BASE}/lease/${leaseId}/close-future`,
    );
  },
};
