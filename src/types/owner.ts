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
  // ─── Ajouts (module reversements/copropriété) ────────────────────────────
  incidentCharges?: number;
  incidentsRebilled?: number;   // refacturé au locataire — informatif, hors calcul
  adjustmentCharges?: number;
  depositDeductions?: number;   // retenu sur caution — informatif, hors calcul
  alreadyPaidOut?: number;      // déjà reversé sur la période
  balanceDue?: number;          // reste à reverser
};

export type OwnerReportMonthlyBreakdown = {
  month: number;
  expected: number;
  collected: number;
  delta: number;
};

// Forme à plat depuis la mise à jour "copropriété par local" — remplace
// l'ancienne forme imbriquée (occupancy/revenue/charges/profitability).
export type OwnerReportProperty = {
  propertyId: string;
  propertyName: string;
  propertyCode?: string | null;
  unitsCount: number;
  occupiedUnits: number;
  occupancyRate: number;      // 0–100
  rentExpected: number;
  rentCollected: number;
  outstanding: number;
  collectionRate: number;     // 0–100
  incidentCharges: number;
  adjustmentCharges: number;
  totalCharges: number;
  netBeforeFee: number;
};

export type OwnerReport = {
  owner: Owner;
  year: number;
  period: OwnerReportPeriod;
  generatedAt: string;
  summary: OwnerReportSummary;
  properties: OwnerReportProperty[];
  // ─── Ajouts (module reversements/copropriété) — optionnels tant que le
  // rapport n'est pas repassé par le back sur tous les endpoints ────────────
  incidents?: import("./owner-statement").StatementIncidentLine[];
  adjustments?: import("./owner-statement").StatementAdjustmentLine[];
  rentPayments?: import("./owner-statement").StatementRentLine[];
  payouts?: import("./owner-payout").OwnerPayout[];
  account?: OwnerReportSummary;
  lastCutoff?: import("./owner-statement").StatementCutoff | null;
};
