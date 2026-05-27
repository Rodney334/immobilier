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
  type: UnitType;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  baseRent: number;
  status: UnitStatus;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateUnitPayload = {
  propertyId: string;
  unitNumber: string;
  type: UnitType;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  rentAmount: number;
};

export type UpdateUnitPayload = Partial<
  Omit<CreateUnitPayload, "propertyId"> & { status: UnitStatus }
>;

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type UnitFilterParams = {
  page?: number;
  limit?: number;
  property?: string;
  status?: UnitStatus;
};
