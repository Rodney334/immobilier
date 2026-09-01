import type { Tenant } from "./tenant";
import type { Unit } from "./unit";

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type LeaseStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED"
  | "EXPIRED"
  | "ARCHIVED";

// Valeurs acceptées par l'API (periodicity)
export type LeasePeriodicity =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

// Alias rétro-compatible
export type PaymentFrequency = LeasePeriodicity;

// ─── Entité principale ────────────────────────────────────────────────────────

export type Lease = {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  unitId: string;
  unit?: Unit;
  contractNumber?: string;
  startDate: string;
  endDate?: string;
  monthlyRent: string; // string — champ API
  depositAmount?: string; // string — champ API
  periodicity?: LeasePeriodicity;
  billingDay?: number;
  status: LeaseStatus;
  notes?: string;
  terminationDate?: string;
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Historique d'un contrat (GET /leases/:id/events) ─────────────────────────

// Énumération ouverte côté back : seules CREATED/RENT_REVISED/TERMINATED/
// TRANSFERRED/NOTE_ADDED sont réellement générées aujourd'hui, les autres
// valeurs existent mais ne sont déclenchées par rien pour l'instant.
export type LeaseEventType =
  | "CREATED"
  | "RENT_REVISED"
  | "TERMINATED"
  | "TRANSFERRED"
  | "NOTE_ADDED"
  | (string & Record<never, never>);

// Pas de userId : cet historique est métier (pensé pour la fiche contrat),
// pas d'auteur — pour "qui a fait l'action", voir /audit-logs.
export type LeaseEvent = {
  _id: string;
  id?: string;
  leaseId: string;
  eventType: LeaseEventType;
  eventDate: string;
  description: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateLeasePayload = {
  unitId: string;
  tenantId: string;
  contractNumber?: string;
  startDate: string;
  endDate: string; // obligatoire — date de fin du contrat
  monthlyRent: string; // string requis par l'API (ex: "150000")
  // depositAmount retiré du payload — calculé automatiquement depuis le local (Unit)
  billingDay?: number;
  periodicity?: LeasePeriodicity;
  status?: LeaseStatus;
  terminationReason?: string;
  notes?: string;
};

export type UpdateLeasePayload = Partial<
  Pick<
    CreateLeasePayload,
    | "monthlyRent"
    | "endDate"
    | "periodicity"
    | "billingDay"
    | "notes"
  >
>;

export type TerminateLeasePayload = {
  terminationDate: string;
  reason?: string;
};

export type VoidLeasePayload = {
  reason: string;
};

export type TransferLeasePayload = {
  newUnitId: string;
  transferDate: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type LeaseFilterParams = {
  page?: number;
  limit?: number;
  status?: LeaseStatus;
  tenant?: string;
  unit?: string;
  search?: string;
};
