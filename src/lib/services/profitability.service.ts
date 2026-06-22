import { api } from '@/lib/api/client';
import type { ApiResponse, ProfitabilityItem } from '@/types';

const BASE = '/api/v1/profitability';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const profitabilityService = {
  getAll(params?: { year?: number }): Promise<ApiResponse<ProfitabilityItem[]>> {
    return api.get<ApiResponse<ProfitabilityItem[]>>(`${BASE}/${buildQS(params)}`);
  },

  getByProperty(
    propertyId: string,
    params?: { year?: number },
  ): Promise<ApiResponse<ProfitabilityItem>> {
    return api.get<ApiResponse<ProfitabilityItem>>(
      `${BASE}/${propertyId}${buildQS(params)}`,
    );
  },
};
