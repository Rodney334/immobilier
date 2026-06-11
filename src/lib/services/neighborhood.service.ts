import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  Neighborhood,
  NeighborhoodFilterParams,
  CreateNeighborhoodPayload,
  UpdateNeighborhoodPayload,
} from '@/types';

const BASE = '/api/v1/neighborhoods';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const neighborhoodService = {
  /**
   * L'API retourne { success, message, data: Neighborhood[] } sans pagination.
   */
  getAll(
    params?: NeighborhoodFilterParams,
  ): Promise<ApiResponse<Neighborhood[]>> {
    return api.get<ApiResponse<Neighborhood[]>>(
      `${BASE}/${buildQS(params)}`,
    );
  },

  getById(id: string): Promise<ApiResponse<Neighborhood>> {
    return api.get<ApiResponse<Neighborhood>>(`${BASE}/${id}`);
  },

  create(
    payload: CreateNeighborhoodPayload,
  ): Promise<ApiResponse<Neighborhood>> {
    return api.post<ApiResponse<Neighborhood>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdateNeighborhoodPayload,
  ): Promise<ApiResponse<Neighborhood>> {
    return api.patch<ApiResponse<Neighborhood>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },
};
