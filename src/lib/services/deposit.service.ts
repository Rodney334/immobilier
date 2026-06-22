import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  Deposit,
  AddDeductionPayload,
  RefundDepositPayload,
} from '@/types';

const BASE = '/api/v1/deposits';

export const depositService = {
  getByLease(leaseId: string): Promise<ApiResponse<Deposit>> {
    return api.get<ApiResponse<Deposit>>(`${BASE}/${leaseId}`);
  },

  downloadPdf(leaseId: string): Promise<Blob> {
    return api.download(`${BASE}/${leaseId}/pdf`);
  },

  addDeduction(
    leaseId: string,
    payload: AddDeductionPayload,
  ): Promise<ApiResponse<Deposit>> {
    return api.post<ApiResponse<Deposit>>(`${BASE}/${leaseId}/deductions`, payload);
  },

  refund(
    leaseId: string,
    payload: RefundDepositPayload,
  ): Promise<ApiResponse<Deposit>> {
    return api.post<ApiResponse<Deposit>>(`${BASE}/${leaseId}/refund`, payload);
  },
};
