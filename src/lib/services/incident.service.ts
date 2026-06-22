import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  Incident,
  IncidentStats,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  IncidentFilterParams,
} from '@/types';

const BASE = '/api/v1/incidents';

// La liste retourne { success, data: [], total } — pas une PaginatedResponse standard
export type IncidentListResponse = {
  success: boolean;
  data: Incident[];
  total: number;
};

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const incidentService = {
  getAll(params?: IncidentFilterParams): Promise<IncidentListResponse> {
    return api.get<IncidentListResponse>(`${BASE}/${buildQS(params)}`);
  },

  getById(id: string): Promise<ApiResponse<Incident>> {
    return api.get<ApiResponse<Incident>>(`${BASE}/${id}`);
  },

  getStats(): Promise<ApiResponse<IncidentStats>> {
    return api.get<ApiResponse<IncidentStats>>(`${BASE}/stats`);
  },

  create(payload: CreateIncidentPayload): Promise<ApiResponse<Incident>> {
    return api.post<ApiResponse<Incident>>(`${BASE}/`, payload);
  },

  update(id: string, payload: UpdateIncidentPayload): Promise<ApiResponse<Incident>> {
    return api.put<ApiResponse<Incident>>(`${BASE}/${id}`, payload);
  },

  delete(id: string): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },
};
