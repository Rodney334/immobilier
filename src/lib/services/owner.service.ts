import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Owner,
  OwnerFilterParams,
  CreateOwnerPayload,
  UpdateOwnerPayload,
  OwnerReport,
  Property,
  Unit,
  OwnerPayout,
  OwnerPayoutFilterParams,
  CreatePayoutPayload,
  ResetAccountPayload,
  OwnerStatement,
  StatementParams,
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

  // ─── Rattachement en masse ────────────────────────────────────────────────
  attachProperties(ownerId: string, propertyIds: string[]): Promise<ApiResponse<Property[]>> {
    return api.post<ApiResponse<Property[]>>(`${BASE}/${ownerId}/properties/bulk`, { propertyIds });
  },

  detachProperties(ownerId: string, propertyIds: string[]): Promise<ApiResponse<Property[]>> {
    return api.delete<ApiResponse<Property[]>>(`${BASE}/${ownerId}/properties/bulk`, { propertyIds });
  },

  attachUnits(ownerId: string, unitIds: string[]): Promise<ApiResponse<Unit[]>> {
    return api.post<ApiResponse<Unit[]>>(`${BASE}/${ownerId}/units/bulk`, { unitIds });
  },

  detachUnits(ownerId: string, unitIds: string[]): Promise<ApiResponse<Unit[]>> {
    return api.delete<ApiResponse<Unit[]>>(`${BASE}/${ownerId}/units/bulk`, { unitIds });
  },

  // ─── Compte propriétaire ──────────────────────────────────────────────────
  getStatement(ownerId: string, params?: StatementParams): Promise<ApiResponse<OwnerStatement>> {
    return api.get<ApiResponse<OwnerStatement>>(`${BASE}/${ownerId}/statement${buildQS(params)}`);
  },

  getPayouts(
    ownerId: string,
    params?: OwnerPayoutFilterParams,
  ): Promise<PaginatedResponse<OwnerPayout>> {
    return api.get<PaginatedResponse<OwnerPayout>>(`${BASE}/${ownerId}/payouts${buildQS(params)}`);
  },

  createPayout(ownerId: string, payload: CreatePayoutPayload): Promise<ApiResponse<OwnerPayout>> {
    return api.post<ApiResponse<OwnerPayout>>(`${BASE}/${ownerId}/payouts`, payload);
  },

  markPayoutPaid(
    payoutId: string,
    payload?: { paidAt?: string; amountPaid?: number; method?: string; externalReference?: string },
  ): Promise<ApiResponse<OwnerPayout>> {
    return api.patch<ApiResponse<OwnerPayout>>(`${BASE}/payouts/${payoutId}/pay`, payload ?? {});
  },

  cancelPayout(payoutId: string, reason?: string): Promise<ApiResponse<OwnerPayout>> {
    return api.patch<ApiResponse<OwnerPayout>>(`${BASE}/payouts/${payoutId}/cancel`, { reason });
  },

  downloadPayoutReceipt(payoutId: string): Promise<Blob> {
    return api.download(`${BASE}/payouts/${payoutId}/receipt/pdf`);
  },

  resetAccount(ownerId: string, payload: ResetAccountPayload): Promise<ApiResponse<OwnerPayout>> {
    return api.post<ApiResponse<OwnerPayout>>(`${BASE}/${ownerId}/reset`, payload);
  },
};
