import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  Lease,
  LeaseFilterParams,
  CreateLeasePayload,
  UpdateLeasePayload,
  TerminateLeasePayload,
  TransferLeasePayload,
} from '@/types';

const BASE = '/api/v1/leases';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const leaseService = {
  getAll(params?: LeaseFilterParams): Promise<PaginatedResponse<Lease>> {
    return api.get<PaginatedResponse<Lease>>(`${BASE}/${buildQS(params)}`);
  },

  getById(id: string): Promise<ApiResponse<Lease>> {
    return api.get<ApiResponse<Lease>>(`${BASE}/${id}`);
  },

  create(payload: CreateLeasePayload): Promise<ApiResponse<Lease>> {
    return api.post<ApiResponse<Lease>>(`${BASE}/`, payload);
  },

  update(
    id: string,
    payload: UpdateLeasePayload,
  ): Promise<ApiResponse<Lease>> {
    return api.put<ApiResponse<Lease>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  /**
   * Résilier un contrat de location.
   */
  terminate(
    id: string,
    payload: TerminateLeasePayload,
  ): Promise<ApiResponse<Lease>> {
    return api.patch<ApiResponse<Lease>>(`${BASE}/${id}/terminate`, payload);
  },

  /**
   * Clôturer toutes les échéances futures d'un contrat.
   */
  closeFutureSchedules(id: string): Promise<ApiResponse<null>> {
    return api.patch<ApiResponse<null>>(
      `${BASE}/${id}/close-future-schedules`,
    );
  },

  /**
   * Transférer un contrat vers un autre local.
   */
  transfer(
    id: string,
    payload: TransferLeasePayload,
  ): Promise<ApiResponse<Lease>> {
    return api.patch<ApiResponse<Lease>>(`${BASE}/${id}/transfer`, payload);
  },

  /**
   * Générer automatiquement les échéances de loyer du contrat.
   */
  generateSchedules(id: string): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(
      `${BASE}/${id}/generate-schedules`,
    );
  },

  /**
   * Télécharger le PDF du contrat de location.
   * Retourne un Blob — utiliser URL.createObjectURL() pour l'ouvrir.
   */
  downloadContractPdf(id: string): Promise<Blob> {
    return api.download(`${BASE}/${id}/contract`);
  },
};
