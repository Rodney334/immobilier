import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaymentPlan,
  PaymentPlanFilterParams,
  CreatePaymentPlanPayload,
  UpdatePaymentPlanPayload,
} from '@/types';

const BASE = '/api/v1/paymentplan';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const paymentPlanService = {
  /**
   * Créer un nouveau plan de paiement échelonné pour un bail.
   */
  create(
    payload: CreatePaymentPlanPayload,
  ): Promise<ApiResponse<PaymentPlan>> {
    return api.post<ApiResponse<PaymentPlan>>(`${BASE}/`, payload);
  },

  /**
   * Récupérer le plan de paiement actuellement actif d'un bail.
   */
  getActivePlanByLease(
    leaseId: string,
  ): Promise<ApiResponse<PaymentPlan>> {
    return api.get<ApiResponse<PaymentPlan>>(
      `${BASE}/lease/${leaseId}/active`,
    );
  },

  /**
   * Récupérer l'historique de tous les plans d'un bail.
   */
  getAllByLease(
    leaseId: string,
    params?: PaymentPlanFilterParams,
  ): Promise<PaginatedResponse<PaymentPlan>> {
    return api.get<PaginatedResponse<PaymentPlan>>(
      `${BASE}/lease/${leaseId}${buildQS(params)}`,
    );
  },

  update(
    id: string,
    payload: UpdatePaymentPlanPayload,
  ): Promise<ApiResponse<PaymentPlan>> {
    return api.put<ApiResponse<PaymentPlan>>(`${BASE}/${id}`, payload);
  },

  /**
   * Désactiver un plan de paiement (sans le supprimer).
   */
  deactivate(id: string): Promise<ApiResponse<PaymentPlan>> {
    return api.patch<ApiResponse<PaymentPlan>>(
      `${BASE}/${id}/deactivate`,
    );
  },
};
