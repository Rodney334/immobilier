import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Property,
  PropertyFilterParams,
  CreatePropertyPayload,
  UpdatePropertyPayload,
} from '@/types';

const BASE = '/api/v1/properties';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const propertyService = {
  getAll(
    params?: PropertyFilterParams,
  ): Promise<PaginatedResponse<Property>> {
    return api.get<PaginatedResponse<Property>>(
      `${BASE}/${buildQS(params)}`,
    );
  },

  getById(id: string): Promise<ApiResponse<Property>> {
    return api.get<ApiResponse<Property>>(`${BASE}/${id}`);
  },

  create(payload: CreatePropertyPayload): Promise<ApiResponse<Property>> {
    return api.post<ApiResponse<Property>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdatePropertyPayload,
  ): Promise<ApiResponse<Property>> {
    return api.patch<ApiResponse<Property>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },
};
