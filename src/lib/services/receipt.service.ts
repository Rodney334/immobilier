import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Receipt,
  ReceiptFilterParams,
  CreateReceiptPayload,
  UpdateReceiptPayload,
} from '@/types';

const BASE = '/api/v1/receipts';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const receiptService = {
  getAll(
    params?: ReceiptFilterParams,
  ): Promise<PaginatedResponse<Receipt>> {
    return api.get<PaginatedResponse<Receipt>>(
      `${BASE}/${buildQS(params)}`,
    );
  },

  getById(id: string): Promise<ApiResponse<Receipt>> {
    return api.get<ApiResponse<Receipt>>(`${BASE}/${id}`);
  },

  create(payload: CreateReceiptPayload): Promise<ApiResponse<Receipt>> {
    return api.post<ApiResponse<Receipt>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdateReceiptPayload,
  ): Promise<ApiResponse<Receipt>> {
    return api.put<ApiResponse<Receipt>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },
};
