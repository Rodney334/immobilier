import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  MonthlyPerformanceReport,
  AnnualPerformanceReport,
  OutstandingBalancesReport,
  TenantPerformanceReport,
  LatePaymentPrediction,
  ReportDateRangeParams,
  MonthlyReportParams,
  AnnualReportParams,
  OutstandingBalancesParams,
  TenantPerformanceParams,
} from '@/types';

const BASE = '/api/v1/reports';

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const reportService = {
  /**
   * Exporter le rapport global en PDF.
   * Retourne un Blob pour ouverture / téléchargement.
   */
  downloadFullPdf(params?: ReportDateRangeParams): Promise<Blob> {
    return api.download(`${BASE}/full/pdf${buildQS(params)}`);
  },

  /**
   * Rapport mensuel de performance (revenus, taux de collecte, etc.).
   */
  getMonthlyPerformance(
    params?: MonthlyReportParams,
  ): Promise<ApiResponse<MonthlyPerformanceReport>> {
    return api.get<ApiResponse<MonthlyPerformanceReport>>(
      `${BASE}/monthly-performance${buildQS(params)}`,
    );
  },

  /**
   * Rapport annuel de performance.
   */
  getAnnualPerformance(
    params?: AnnualReportParams,
  ): Promise<ApiResponse<AnnualPerformanceReport>> {
    return api.get<ApiResponse<AnnualPerformanceReport>>(
      `${BASE}/annual-performance${buildQS(params)}`,
    );
  },

  /**
   * Rapport des soldes impayés à une date donnée.
   */
  getOutstandingBalances(
    params?: OutstandingBalancesParams,
  ): Promise<ApiResponse<OutstandingBalancesReport>> {
    return api.get<ApiResponse<OutstandingBalancesReport>>(
      `${BASE}/outstanding-balances${buildQS(params)}`,
    );
  },

  /**
   * Rapport de performance des locataires (taux de paiement, retards, etc.).
   */
  getTenantPerformance(
    params?: TenantPerformanceParams,
  ): Promise<ApiResponse<TenantPerformanceReport[]>> {
    return api.get<ApiResponse<TenantPerformanceReport[]>>(
      `${BASE}/tenant-performance${buildQS(params)}`,
    );
  },

  /**
   * Prédiction IA des retards de paiement pour le prochain cycle.
   */
  predictLatePayments(): Promise<ApiResponse<LatePaymentPrediction[]>> {
    return api.get<ApiResponse<LatePaymentPrediction[]>>(
      `${BASE}/predict-late-payments`,
    );
  },
};
