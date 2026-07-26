import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Adjustment,
  AdjustmentFilterParams,
  CreateAdjustmentPayload,
  UpdateAdjustmentPayload,
  WaiveUpcomingPayload,
  WaiveUpcomingResult,
} from '@/types';

const BASE = '/api/v1/adjustments';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const adjustmentService = {
  getAll(
    params?: AdjustmentFilterParams,
  ): Promise<PaginatedResponse<Adjustment>> {
    return api.get<PaginatedResponse<Adjustment>>(
      `${BASE}/${buildQS(params)}`,
    );
  },

  getById(id: string): Promise<ApiResponse<Adjustment>> {
    return api.get<ApiResponse<Adjustment>>(`${BASE}/${id}`);
  },

  create(
    payload: CreateAdjustmentPayload,
  ): Promise<ApiResponse<Adjustment>> {
    return api.post<ApiResponse<Adjustment>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdateAdjustmentPayload,
  ): Promise<ApiResponse<Adjustment>> {
    return api.put<ApiResponse<Adjustment>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  /**
   * Action groupée : exonère ou réduit plusieurs échéances d'un bail en un
   * seul appel (prochains mois / échéances précises / tout le reste du bail).
   */
  waiveUpcoming(
    payload: WaiveUpcomingPayload,
  ): Promise<ApiResponse<WaiveUpcomingResult>> {
    return api.post<ApiResponse<WaiveUpcomingResult>>(
      `${BASE}/waive-upcoming`,
      payload,
    );
  },
};
