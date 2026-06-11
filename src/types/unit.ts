import type { Property } from "./property";

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

// ─── Entité principale ────────────────────────────────────────────────────────

export type Unit = {
  id: string;
  propertyId: string;
  property?: Property;
  unitNumber: string;
  label?: string;
  description?: string;
  type?: string;
  floor?: string;
  area?: string;
  baseRent: number;
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
  label?: string;
  description?: string;
  type?: string;
  floor?: string;
  area?: string; // string requis par l'API (ex: "35.50")
  baseRent: string; // string requis par l'API (ex: "150000")
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
