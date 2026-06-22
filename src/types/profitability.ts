// ─── Détail mensuel ───────────────────────────────────────────────────────────

export type ProfitabilityMonthlyBreakdown = {
  month: number;       // 1-12
  expected: number;
  collected: number;
  delta: number;
};

// ─── Item (liste globale + détail par propriété) ──────────────────────────────

export type ProfitabilityItem = {
  propertyId: string;
  propertyName: string;
  propertyCode: string;
  year: number;
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
