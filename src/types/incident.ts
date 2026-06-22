// ─── Énumérations ─────────────────────────────────────────────────────────────

export type IncidentStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "STRUCTURAL"
  | "APPLIANCE"
  | "SECURITY"
  | "CLEANING"
  | "OTHER";

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
  description?: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  estimatedCost?: number;
  assignedTo?: string;
};

export type UpdateIncidentPayload = {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  assignedTo?: string;
  actualCost?: number;
  resolutionNotes?: string;
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
