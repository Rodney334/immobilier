import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Unit,
  UnitFilterParams,
  CreateUnitPayload,
  UpdateUnitPayload,
} from '@/types';

const BASE = '/api/v1/units';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const unitService = {
  getAll(params?: UnitFilterParams): Promise<PaginatedResponse<Unit>> {
    return api.get<PaginatedResponse<Unit>>(`${BASE}/${buildQS(params)}`);
  },

  getById(id: string): Promise<ApiResponse<Unit>> {
    return api.get<ApiResponse<Unit>>(`${BASE}/${id}`);
  },

  create(payload: CreateUnitPayload): Promise<ApiResponse<Unit>> {
    return api.post<ApiResponse<Unit>>(`${BASE}/`, payload);
  },

  update(id: string, payload: UpdateUnitPayload): Promise<ApiResponse<Unit>> {
    return api.patch<ApiResponse<Unit>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  archive(id: string): Promise<ApiResponse<Unit>> {
    return api.patch<ApiResponse<Unit>>(`${BASE}/${id}/archive`);
  },

  restore(id: string): Promise<ApiResponse<Unit>> {
    return api.patch<ApiResponse<Unit>>(`${BASE}/${id}/restore`);
  },
};
