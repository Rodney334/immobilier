import { api } from '@/lib/api/client';
import type { ApiResponse, Guarantor, GuarantorPayload } from '@/types';

const BASE = '/api/v1/guarantors';

export const guarantorService = {
  /** Liste des garants d'un bail */
  getByLease(leaseId: string): Promise<ApiResponse<Guarantor[]>> {
    return api.get<ApiResponse<Guarantor[]>>(`${BASE}/lease/${leaseId}`);
  },

  /** Détail d'un garant */
  getById(id: string): Promise<ApiResponse<Guarantor>> {
    return api.get<ApiResponse<Guarantor>>(`${BASE}/${id}`);
  },

  /** Ajouter un garant */
  create(payload: GuarantorPayload): Promise<ApiResponse<Guarantor>> {
    return api.post<ApiResponse<Guarantor>>(BASE, payload);
  },

  /** Modifier un garant */
  update(id: string, payload: GuarantorPayload): Promise<ApiResponse<Guarantor>> {
    return api.put<ApiResponse<Guarantor>>(`${BASE}/${id}`, payload);
  },

  /** Supprimer un garant */
  delete(id: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`${BASE}/${id}`);
  },
};
