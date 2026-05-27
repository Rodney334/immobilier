import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Payment,
  Receipt,
  PaymentFilterParams,
  CreatePaymentPayload,
  UpdatePaymentPayload,
  CancelPaymentPayload,
  CreatePaymentWithAllocationsPayload,
  AutoAllocatePaymentPayload,
} from '@/types';

const BASE = '/api/v1/payments';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const paymentService = {
  getAll(
    params?: PaymentFilterParams,
  ): Promise<PaginatedResponse<Payment>> {
    return api.get<PaginatedResponse<Payment>>(
      `${BASE}/${buildQS(params)}`,
    );
  },

  getById(id: string): Promise<ApiResponse<Payment>> {
    return api.get<ApiResponse<Payment>>(`${BASE}/${id}`);
  },

  create(payload: CreatePaymentPayload): Promise<ApiResponse<Payment>> {
    return api.post<ApiResponse<Payment>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdatePaymentPayload,
  ): Promise<ApiResponse<Payment>> {
    return api.patch<ApiResponse<Payment>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  /**
   * Créer un paiement avec allocation manuelle sur les échéances.
   */
  createWithAllocations(
    payload: CreatePaymentWithAllocationsPayload,
  ): Promise<ApiResponse<Payment>> {
    return api.post<ApiResponse<Payment>>(
      `${BASE}/with-allocations`,
      payload,
    );
  },

  /**
   * Créer un paiement avec allocation automatique (FIFO sur les échéances impayées).
   */
  autoAllocate(
    payload: AutoAllocatePaymentPayload,
  ): Promise<ApiResponse<Payment>> {
    return api.post<ApiResponse<Payment>>(`${BASE}/auto-allocate`, payload);
  },

  /**
   * Inverser toutes les allocations d'un paiement.
   */
  reverseAllocations(id: string): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(
      `${BASE}/${id}/reverse-allocations`,
    );
  },

  /**
   * Annuler un paiement.
   */
  cancel(
    id: string,
    payload: CancelPaymentPayload,
  ): Promise<ApiResponse<Payment>> {
    return api.patch<ApiResponse<Payment>>(
      `${BASE}/${id}/cancel`,
      payload,
    );
  },

  /**
   * Télécharger le reçu PDF d'un paiement.
   */
  downloadReceiptPdf(id: string): Promise<Blob> {
    return api.download(`${BASE}/${id}/receipt/pdf`);
  },

  /**
   * Récupérer tous les reçus d'un locataire.
   */
  getTenantReceipts(
    tenantId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<Receipt>> {
    return api.get<PaginatedResponse<Receipt>>(
      `${BASE}/tenant/${tenantId}/receipts${buildQS(params)}`,
    );
  },

  /**
   * Exporter tous les reçus d'un locataire en PDF.
   */
  downloadTenantReceiptsPdf(tenantId: string): Promise<Blob> {
    return api.download(`${BASE}/tenant/${tenantId}/receipts/pdf`);
  },
};
