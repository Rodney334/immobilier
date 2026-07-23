// ─── Versement individuel ─────────────────────────────────────────────────────

export type PaymentEntry = {
  dateFormatted: string;
  amountFormatted: string;
  methodLabel: string;
  reference: string;
};

// ─── Entrée d'échéance ────────────────────────────────────────────────────────

export type HistoryEntry = {
  period: string;
  dueDateFormatted: string;
  amountDueFormatted: string;
  amountPaidFormatted: string;
  statusLabel: string;
  isFullyPaid: boolean;
  paidOnTime: boolean | null;
  delayDays: number | null;
  payments: PaymentEntry[];
};

// ─── Résumé ───────────────────────────────────────────────────────────────────

export type PaymentHistorySummary = {
  totalSchedules: number;
  totalOnTime: number;
  totalLate: number;
  totalPending: number;
  onTimeRate: number;
};

// ─── Réponse — par bail ───────────────────────────────────────────────────────

export type PaymentHistoryByLease = {
  summary: PaymentHistorySummary;
  history: HistoryEntry[];
};

// ─── Réponse — par locataire (consolidé) ─────────────────────────────────────

export type LeaseHistoryGroup = {
  leaseId: string;
  leaseRef?: string;
  propertyName?: string;
  unitNumber?: string;
  history: HistoryEntry[];
};

export type PaymentHistoryByTenant = {
  summary: PaymentHistorySummary;
  leases: LeaseHistoryGroup[];
};
