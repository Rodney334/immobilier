// ─── Énumérations ─────────────────────────────────────────────────────────────

// "CANCELLED" retiré — n'existe pas côté back (OPEN/IN_PROGRESS/RESOLVED/CLOSED
// uniquement). Une valeur inconnue envoyée au back retombe silencieusement
// sur OTHER/valeur par défaut, d'où la correction.
export type IncidentStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ELECTRICAL→ELECTRICITY et STRUCTURAL→STRUCTURE corrigés pour matcher
// l'enum back ; PEST_CONTROL ajouté (absent du front jusqu'ici).
export type IncidentCategory =
  | "PLUMBING"
  | "ELECTRICITY"
  | "STRUCTURE"
  | "APPLIANCE"
  | "SECURITY"
  | "CLEANING"
  | "PEST_CONTROL"
  | "OTHER";

// Qui supporte le coût de l'intervention.
export type IncidentCostBearer = "OWNER" | "TENANT" | "AGENCY";

// ─── Entité principale ────────────────────────────────────────────────────────

export type Incident = {
  id: string;
  _id: string;
  unitId: string;
  unit?: {
    id: string;
    _id: string;
    unitNumber: string;
    label?: string;
    propertyId: string;
    property?: { id: string; _id: string; name: string };
  };
  leaseId?: string | null;
  lease?: { id: string; contractNumber?: string } | null;
  reportedById?: string;
  reportedBy?: { id: string; name: string; email: string } | null;
  title: string;
  description?: string | null;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  estimatedCost?: string | null;   // L'API retourne une string ("25000.00")
  actualCost?: string | null;
  assignedTo?: string | null;
  resolutionNotes?: string | null;
  reportedAt?: string | null;
  resolvedAt?: string | null;
  // Qui paie l'intervention, et — si locataire — sur quoi elle est retenue.
  costBearer: IncidentCostBearer;    // défaut "OWNER" côté API
  deductFrom?: "RENT" | "DEPOSIT" | null; // pertinent seulement si TENANT
  adjustmentId?: string | null;      // lecture seule — rempli à la résolution
  createdAt: string;
  updatedAt: string;
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export type IncidentStats = {
  total: number;
  byStatus: Partial<Record<IncidentStatus, number>>;
  byCategory: Partial<Record<IncidentCategory, number>>;
  totalActualCost?: number;
  avgResolutionDays?: number;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateIncidentPayload = {
  unitId: string;
  leaseId?: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  estimatedCost?: number;
  assignedTo?: string;
  costBearer?: IncidentCostBearer;   // défaut "OWNER"
  deductFrom?: "RENT" | "DEPOSIT";   // pertinent seulement si costBearer="TENANT"
};

export type UpdateIncidentPayload = {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  assignedTo?: string;
  actualCost?: number;
  resolutionNotes?: string;
  costBearer?: IncidentCostBearer;
  deductFrom?: "RENT" | "DEPOSIT";
};

// ─── Filtres ──────────────────────────────────────────────────────────────────

export type IncidentFilterParams = {
  unitId?: string;
  leaseId?: string;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  category?: IncidentCategory;
  page?: number;
  limit?: number;
};
