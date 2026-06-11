import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Receipt,
  ReceiptFilterParams,
  UpdateReceiptPayload,
  CancelReceiptPayload,
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
  getAll(params?: ReceiptFilterParams): Promise<PaginatedResponse<Receipt>> {
    return api.get<PaginatedResponse<Receipt>>(`${BASE}/${buildQS(params)}`);
  },

  getById(id: string): Promise<ApiResponse<Receipt>> {
    return api.get<ApiResponse<Receipt>>(`${BASE}/${id}`);
  },

  update(id: string, payload: UpdateReceiptPayload): Promise<ApiResponse<Receipt>> {
    return api.patch<ApiResponse<Receipt>>(`${BASE}/${id}`, payload);
  },

  cancel(id: string, payload?: CancelReceiptPayload): Promise<ApiResponse<Receipt>> {
    return api.patch<ApiResponse<Receipt>>(`${BASE}/${id}/cancel`, payload ?? {});
  },

  downloadPdf(id: string): Promise<Blob> {
    return api.download(`${BASE}/${id}/pdf`);
  },
};
