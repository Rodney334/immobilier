import type { AdjustmentType } from "./adjustment";
import type { OwnerPayoutKind } from "./owner-payout";
import type { OwnerReportProperty } from "./owner";

// ─── Relevé de compte détaillé — GET /owners/:id/statement ───────────────────

export type StatementRentLine = {
  id: string;
  date: string;
  unitId: string | null;
  unitLabel: string;                // "Immeuble A · A1"
  tenantName: string;
  contractNumber?: string | null;
  method: string;
  amount: number;
};

export type StatementIncidentLine = {
  id: string;
  date: string | null;
  unitId: string;
  unitLabel: string;
  title: string;
  category: string;
  costBearer: "OWNER" | "TENANT" | "AGENCY";
  deductFrom: "RENT" | "DEPOSIT" | null;
  cost: number;
  chargedToOwner: boolean;          // false = refacturé au locataire
  resolutionNotes?: string | null;
};

export type StatementAdjustmentLine = {
  id: string;
  date: string;
  unitId: string | null;
  unitLabel: string;
  tenantName: string;
  type: AdjustmentType;
  label: string;
  reason?: string | null;
  appliesTo: "RENT" | "DEPOSIT";
  appliesToLabel: string;           // "Loyer" | "Caution", prêt à afficher
  amount: number;
  incidentId?: string | null;
  chargedToOwner: boolean;          // false = sans impact sur le propriétaire
};

export type StatementCutoff = {
  id: string;
  kind: OwnerPayoutKind;
  reference?: string | null;
  periodEnd: string;
  label: string;                    // "Dernier reversement" | "Compte remis à zéro"
};

export type OwnerStatementSummary = {
  rentExpected: number;
  rentCollected: number;
  outstanding: number;
  collectionRate: number;
  incidentCharges: number;
  incidentsRebilled: number;
  adjustmentCharges: number;
  depositDeductions: number;
  totalCharges: number;
  managementFeePercent: number;
  managementFeeAmount: number;
  netDue: number;
  paidInPeriod: number;
  balanceDue: number;
};

export type OwnerStatement = {
  owner: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
    bankName?: string;
    bankAccountNumber?: string;
    managementFeePercent?: number | string;
  };
  period: {
    from: string;
    to: string;
    cutoffApplied: boolean;
    cutoff: StatementCutoff | null;
  };
  scope: {
    propertiesCount: number;
    unitsCount: number;
    occupiedUnits: number;
    propertyIds: string[] | null;
  };
  summary: OwnerStatementSummary;
  details: {
    rent: StatementRentLine[];
    incidents: StatementIncidentLine[];
    adjustments: StatementAdjustmentLine[];
  };
  byProperty: OwnerReportProperty[];
  payouts: import("./owner-payout").OwnerPayout[];
  generatedAt: string;
};

export type StatementParams = {
  from?: string;
  to?: string;
  propertyIds?: string;             // séparés par des virgules
  ignoreCutoff?: boolean;
};
