import { api } from '@/lib/api/client';
import type { ApiResponse, PaymentHistoryByLease, PaymentHistoryByTenant } from '@/types';

const BASE = '/api/v1/payment-history';

export const paymentHistoryService = {
  getByLease(leaseId: string): Promise<ApiResponse<PaymentHistoryByLease>> {
    return api.get<ApiResponse<PaymentHistoryByLease>>(`${BASE}/lease/${leaseId}`);
  },

  getByTenant(tenantId: string): Promise<ApiResponse<PaymentHistoryByTenant>> {
    return api.get<ApiResponse<PaymentHistoryByTenant>>(`${BASE}/tenant/${tenantId}`);
  },
};
