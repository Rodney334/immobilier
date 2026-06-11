import type { Neighborhood } from './neighborhood';

export type PropertyType =
  | 'Apartment'
  | 'House'
  | 'Commercial'
  | 'Office'
  | 'Warehouse'
  | 'Other';

export type Property = {
  id: string;
  name: string;
  code?: string;
  address?: string;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  type: string;
  totalUnits?: number;
  usageDestination?: string;
  department?: string;
  commune?: string;
  arrondissement?: string;
  quartier?: string;
  landmark?: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePropertyPayload = {
  name: string;
  neighborhoodId: string;
  type: string;
  code?: string;
  address?: string;
  usageDestination?: string;
  department?: string;
  commune?: string;
  arrondissement?: string;
  quartier?: string;
  landmark?: string;
  description?: string;
  isActive?: boolean;
};

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export type PropertyFilterParams = {
  page?: number;
  limit?: number;
  neighborhood?: string;
  search?: string;
};
