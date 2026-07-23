import type { Property } from "./property";

// ─── Owner ────────────────────────────────────────────────────────────────────

export type Owner = {
  id: string;
  fullName: string;
  legalForm?: string;
  /** L'API renvoie parfois "10.00" (string) selon le contexte */
  managementFeePercent?: number | string;
  ifu?: string;
  rccm?: string;
  phone?: string;
  secondaryPhone?: string | null;
  email?: string;
  address?: string;
  bankName?: string;
  bankAccountNumber?: string;
  notes?: string | null;
  isActive?: boolean;
  properties?: Property[];
  createdAt: string;
  updatedAt: string;
};

export type CreateOwnerPayload = {
  fullName: string;
  legalForm?: string;
  managementFeePercent?: number;
  ifu?: string;
  rccm?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankName?: string;
  bankAccountNumber?: string;
  notes?: string;
};

export type UpdateOwnerPayload = Partial<CreateOwnerPayload>;

export type OwnerFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
};

// ─── Owner Report ─────────────────────────────────────────────────────────────
// Structure réelle de l'API /owners/:id/report

export type OwnerReportPeriod = {
  label: string;
  month: number | null;
  semester: number | null;
  monthsCount: number;
};

export type OwnerReportSummary = {
  propertiesCount: number;
  totalUnits: number;
  occupiedUnits: number;
  totalRentExpected: number;
  totalRentCollected: number;
  totalOutstanding: number;
  totalCharges: number;
  netIncome: number;
  occupancyRate: number;       // 0–100
  collectionRate: number;      // 0–100
  managementFeeAmount: number;
  netPayableToOwner: number;
};

export type OwnerReportMonthlyBreakdown = {
  month: number;
  expected: number;
  collected: number;
  delta: number;
};

export type OwnerReportProperty = {
  propertyId: string;
  propertyName: string;
  propertyCode?: string;
  year: number;
  period: OwnerReportPeriod;
  generatedAt: string;
  occupancy: {
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
  };
  revenue: {
    totalRentExpected: number;
    totalRentCollected: number;
    totalOutstanding: number;
    collectionRate: number;
  };
  charges: {
    maintenanceCosts: number;
    adjustmentCharges: number;
    totalCharges: number;
  };
  profitability: {
    netIncome: number;
    profitMargin: number;
    averageMonthlyIncome: number;
  };
  monthlyBreakdown: OwnerReportMonthlyBreakdown[];
};

export type OwnerReport = {
  owner: Owner;
  year: number;
  period: OwnerReportPeriod;
  generatedAt: string;
  summary: OwnerReportSummary;
  properties: OwnerReportProperty[];
};
