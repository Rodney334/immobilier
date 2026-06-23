import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Tenant,
  TenantFilterParams,
  CreateTenantPayload,
  UpdateTenantPayload,
  Payment,
  RentSchedule,
  Adjustment,
  Lease,
} from '@/types';

export type TenantSummaryData = {
  tenant: { _id: string; fullName: string; status: string };
  totals: { totalPaid: number; totalUnpaid: number };
  payments: Payment[];
  unpaidSchedules: RentSchedule[];
  adjustments: Adjustment[];
  schedules: RentSchedule[];
  activeLeases: Lease[];
};

const BASE = '/api/v1/tenants';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const tenantService = {
  getAll(params?: TenantFilterParams): Promise<PaginatedResponse<Tenant>> {
    return api.get<PaginatedResponse<Tenant>>(`${BASE}/${buildQS(params)}`);
  },

  getById(id: string): Promise<ApiResponse<Tenant>> {
    return api.get<ApiResponse<Tenant>>(`${BASE}/${id}`);
  },

  create(payload: CreateTenantPayload): Promise<ApiResponse<Tenant>> {
    return api.post<ApiResponse<Tenant>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdateTenantPayload,
  ): Promise<ApiResponse<Tenant>> {
    return api.put<ApiResponse<Tenant>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  archive(id: string): Promise<ApiResponse<Tenant>> {
    return api.patch<ApiResponse<Tenant>>(`${BASE}/${id}/archive`);
  },

  restore(id: string): Promise<ApiResponse<Tenant>> {
    return api.patch<ApiResponse<Tenant>>(`${BASE}/${id}/restore`);
  },

  getSummary(id: string): Promise<ApiResponse<TenantSummaryData>> {
    return api.get<ApiResponse<TenantSummaryData>>(`${BASE}/${id}/summary`);
  },
};
