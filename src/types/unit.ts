import type { Property } from "./property";
import type { Owner } from "./owner";

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type UnitStatus = "OCCUPIED" | "AVAILABLE" | "SUSPENDED" | "ARCHIVED";

export type UnitType =
  | "Studio"
  | "Apartment"
  | "House"
  | "Office"
  | "Shop"
  | "Warehouse"
  | "Other";

export type LeaseCategory = "HABITATION" | "PROFESSIONNEL";

// ─── Entité principale ────────────────────────────────────────────────────────

export type Unit = {
  id: string;
  _id: string;
  propertyId: string;
  property?: Property;
  // Copropriété : propriétaire propre au local, distinct de celui de
  // l'immeuble. undefined/null = le local suit le propriétaire de l'immeuble.
  ownerId?: string | null;
  owner?: Owner | null;
  unitNumber: string;
  label?: string;
  description?: string;
  type?: string;
  floor?: string;
  area?: string;
  baseRent: number;
  depositAmount?: string; // caution/dépôt de garantie — string API
  leaseCategory?: LeaseCategory; // détermine le template de contrat
  currency?: string;
  status: UnitStatus;
  commissionedAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateUnitPayload = {
  propertyId: string;
  unitNumber?: string; // optionnel — auto-généré par l'API
  ownerId?: string; // copropriété — laisser vide pour suivre l'immeuble
  label?: string;
  description?: string;
  type?: string;
  floor?: string;
  area?: string; // string requis par l'API (ex: "35.50")
  baseRent: string; // string requis par l'API (ex: "150000")
  depositAmount?: string; // caution (ex: "150000")
  leaseCategory?: LeaseCategory;
  currency?: string;
  status?: UnitStatus;
  commissionedAt?: string;
};

export type UpdateUnitPayload = Partial<Omit<CreateUnitPayload, "propertyId">>;

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type UnitFilterParams = {
  page?: number;
  limit?: number;
  property?: string;
  status?: UnitStatus;
};
