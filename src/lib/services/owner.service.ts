import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Owner,
  OwnerFilterParams,
  CreateOwnerPayload,
  UpdateOwnerPayload,
  OwnerReport,
} from '@/types';

const BASE = '/api/v1/owners';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const ownerService = {
  getAll(params?: OwnerFilterParams): Promise<PaginatedResponse<Owner>> {
    return api.get<PaginatedResponse<Owner>>(`${BASE}/${buildQS(params)}`);
  },

  getById(id: string): Promise<ApiResponse<Owner>> {
    return api.get<ApiResponse<Owner>>(`${BASE}/${id}`);
  },

  create(payload: CreateOwnerPayload): Promise<ApiResponse<Owner>> {
    return api.post<ApiResponse<Owner>>(`${BASE}/`, payload);
  },

  update(id: string, payload: UpdateOwnerPayload): Promise<ApiResponse<Owner>> {
    return api.patch<ApiResponse<Owner>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  attachProperty(ownerId: string, propertyId: string): Promise<ApiResponse<Owner>> {
    return api.post<ApiResponse<Owner>>(`${BASE}/${ownerId}/properties`, { propertyId });
  },

  detachProperty(ownerId: string, propertyId: string): Promise<ApiResponse<Owner>> {
    return api.delete<ApiResponse<Owner>>(`${BASE}/${ownerId}/properties`, { propertyId });
  },

  getReport(
    ownerId: string,
    params?: { year?: number; month?: number },
  ): Promise<ApiResponse<OwnerReport>> {
    return api.get<ApiResponse<OwnerReport>>(
      `${BASE}/${ownerId}/report${buildQS(params)}`,
    );
  },

  downloadReportPdf(
    ownerId: string,
    params?: { year?: number; month?: number },
  ): Promise<Blob> {
    return api.download(`${BASE}/${ownerId}/report/pdf${buildQS(params)}`);
  },
};
