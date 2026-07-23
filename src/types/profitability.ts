// ─── Détail mensuel ───────────────────────────────────────────────────────────

export type ProfitabilityMonthlyBreakdown = {
  month: number;       // 1-12
  expected: number;
  collected: number;
  delta: number;
};

// ─── Période (renvoyée par l'API quand month/semester est fourni) ─────────────

export type ProfitabilityPeriod = {
  label: string;           // ex: "S1 2026", "07/2026", "2026"
  month: number | null;
  semester: number | null;
  monthsCount: number;
};

// ─── Params de filtre ─────────────────────────────────────────────────────────

export type ProfitabilityFilterParams = {
  year?: number;
  month?: number;    // 1-12 — prime sur semester si les deux sont fournis
  semester?: number; // 1 ou 2
};

// ─── Item (liste globale + détail par propriété) ──────────────────────────────

export type ProfitabilityItem = {
  propertyId: string;
  propertyName: string;
  propertyCode: string;
  year: number;
  period?: ProfitabilityPeriod;
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
  monthlyBreakdown: ProfitabilityMonthlyBreakdown[];
};

// Alias pour compatibilité (le per-property endpoint retourne la même structure)
export type ProfitabilityReport = ProfitabilityItem;
