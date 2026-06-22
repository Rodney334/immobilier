import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  AuditLog,
  AuditLogFilterParams,
  CreateAuditLogPayload,
} from '@/types';

const BASE = '/api/v1/audit-logs';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const auditLogService = {
  getAll(params?: AuditLogFilterParams): Promise<PaginatedResponse<AuditLog>> {
    return api.get<PaginatedResponse<AuditLog>>(`${BASE}/${buildQS(params)}`);
  },

  getById(id: string): Promise<ApiResponse<AuditLog>> {
    return api.get<ApiResponse<AuditLog>>(`${BASE}/${id}`);
  },

  create(payload: CreateAuditLogPayload): Promise<ApiResponse<AuditLog>> {
    return api.post<ApiResponse<AuditLog>>(`${BASE}/`, payload);
  },
};
