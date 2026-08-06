// ─── Briques communes ─────────────────────────────────────────────────────────

/** Ventilation d'un mois dans un rapport annuel */
export type MonthBreakdown = {
  month: number;
  schedulesCount: number;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  onTimeCount: number;
  overdueCount: number;
  unpaidCount: number;
  onTimeRate: number;
  recoveryRate: number;
};

// ─── Rapport annuel ───────────────────────────────────────────────────────────

export type AnnualTotals = {
  schedulesCount: number;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  onTimeCount: number;
  overdueCount: number;
  unpaidCount: number;
  onTimeRate: number;
  recoveryRate: number;
};

export type AnnualComparisonWithPreviousYear = {
  expectedAmountDelta: number;
  paidAmountDelta: number;
  outstandingAmountDelta: number;
  onTimeRateDelta: number;
  overdueCountDelta: number;
  unpaidCountDelta: number;
};

export type AnnualPerformanceReport = {
  year: number;
  totals: AnnualTotals;
  comparisonWithPreviousYear: AnnualComparisonWithPreviousYear;
  months: MonthBreakdown[];
  worstMonths: MonthBreakdown[];
  bestMonths: MonthBreakdown[];
};

// ─── Rapport mensuel ──────────────────────────────────────────────────────────

export type MonthlyComparison = {
  expectedAmountDelta: number;
  paidAmountDelta: number;
  outstandingAmountDelta: number;
  onTimeRateDelta: number;
  overdueCountDelta: number;
  unpaidCountDelta: number;
};

export type PaymentMethodBreakdown = {
  paymentMethod: string;
  amount: number;
};

export type StatusBreakdown = {
  status: string;
  count: number;
  amount: number;
};

export type MonthlyPerformanceReport = {
  period: { month: number; year: number };
  comparisonPeriod: { month: number; year: number };
  totals: AnnualTotals;
  comparison: MonthlyComparison;
  paymentMethods: PaymentMethodBreakdown[];
  statusBreakdown: StatusBreakdown[];
  riskyTenants: TenantPerformanceReport[];
  topTenants: TenantPerformanceReport[];
};

// ─── Rapport des soldes impayés ───────────────────────────────────────────────

export type OutstandingTenant = {
  tenantId: string;
  tenantName: string;
  leaseId: string;
  unitNumber: string;
  propertyName: string;
  outstandingAmount: number;
  schedulesCount: number;
  oldestDueDate: string;
};

export type OutstandingSchedule = {
  scheduleId: string;
  dueDate: string;
  dueMonth: number;
  dueYear: number;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: string;
  tenantId: string;
  tenantName: string;
  leaseId: string;
  unitNumber: string;
  propertyName: string;
};

// AS_OF : dette arrêtée à une date donnée (cumule les arriérés antérieurs).
// PERIOD : uniquement les échéances exigibles pendant la période demandée.
export type OutstandingBalancesMode = "AS_OF" | "PERIOD";

export type OutstandingBalancesPeriod = {
  mode: OutstandingBalancesMode;
  label: string; // ex: "S1 2026", "08/2026", "À aujourd'hui"
  from: string | null; // null en AS_OF (pas d'intervalle, juste une date d'arrêté)
  asOf: string;
  includesPreviousArrears: boolean;
};

export type OutstandingBalancesReport = {
  generatedAt: string;
  totalOutstandingAmount: number;
  totalOutstandingSchedules: number;
  tenants: OutstandingTenant[];
  schedules: OutstandingSchedule[];
  period?: OutstandingBalancesPeriod;
};

// ─── Rapport de performance locataire ────────────────────────────────────────

export type TenantPerformanceReport = {
  tenantId: string;
  tenantName: string;
  leaseId: string;
  unitNumber: string;
  propertyName: string;
  score: number;
  classification: string;
  averageDelayDays: number;
  schedulesCount: number;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  onTimeCount: number;
  overdueCount: number;
  unpaidCount: number;
  onTimeRate: number;
  recoveryRate: number;
};

// ─── Prédiction de retards ────────────────────────────────────────────────────

export type LatePaymentPrediction = {
  tenantId: string;
  tenantName: string;
  unitNumber: string;
  nextDueDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  historicalLateRate: number;
};

// ─── Paramètres ───────────────────────────────────────────────────────────────

export type ReportDateRangeParams = {
  startDate?: string;
  endDate?: string;
};

export type MonthlyReportParams = {
  month?: number;
  year?: number;
};

export type AnnualReportParams = {
  year?: number;
};

export type SemesterReportParams = {
  year?: number;
  semester: 1 | 2;
};

// ─── Rapport semestriel ───────────────────────────────────────────────────────
// Même structure qu'AnnualPerformanceReport + semester + period.label

export type SemesterPerformanceReport = AnnualPerformanceReport & {
  semester: 1 | 2;
  period?: { label: string; semester: number; monthsCount: number };
};

export type OutstandingBalancesParams = {
  asOfDate?: string;
  year?: number;
  semester?: 1 | 2; // nécessite year
  month?: number; // 1-12, nécessite year, prioritaire sur semester
  mode?: OutstandingBalancesMode; // défaut AS_OF
  propertyId?: string;
  neighborhoodId?: string;
  tenantId?: string;
};

export type TenantPerformanceParams = {
  tenantId?: string;
  period?: 'monthly' | 'quarterly' | 'annual';
};

// ─── Alias de compatibilité ───────────────────────────────────────────────────
/** @deprecated Utiliser OutstandingTenant */
export type OutstandingBalance = OutstandingTenant & {
  totalOwed: number;
  overdueCount: number;
};
