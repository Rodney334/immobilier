import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaymentAllocation,
  PaymentAllocationFilterParams,
  CreatePaymentAllocationPayload,
  UpdatePaymentAllocationPayload,
} from '@/types';

const BASE = '/api/v1/payment-allocations';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const paymentAllocationService = {
  getAll(
    params?: PaymentAllocationFilterParams,
  ): Promise<PaginatedResponse<PaymentAllocation>> {
    return api.get<PaginatedResponse<PaymentAllocation>>(
      `${BASE}/${buildQS(params)}`,
    );
  },

  getById(id: string): Promise<ApiResponse<PaymentAllocation>> {
    return api.get<ApiResponse<PaymentAllocation>>(`${BASE}/${id}`);
  },

  create(
    payload: CreatePaymentAllocationPayload,
  ): Promise<ApiResponse<PaymentAllocation>> {
    return api.post<ApiResponse<PaymentAllocation>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdatePaymentAllocationPayload,
  ): Promise<ApiResponse<PaymentAllocation>> {
    return api.put<ApiResponse<PaymentAllocation>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },
};
