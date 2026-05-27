import type { Neighborhood } from './neighborhood';

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type PropertyType =
  | 'Apartment'
  | 'House'
  | 'Commercial'
  | 'Office'
  | 'Warehouse'
  | 'Other';

// ─── Entité principale ────────────────────────────────────────────────────────

export type Property = {
  id: string;
  name: string;
  address: string;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  type: PropertyType;
  totalUnits: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreatePropertyPayload = {
  name: string;
  address: string;
  neighborhoodId: string;
  type: PropertyType;
  totalUnits: number;
  description?: string;
};

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type PropertyFilterParams = {
  page?: number;
  limit?: number;
  neighborhood?: string;
  search?: string;
};
