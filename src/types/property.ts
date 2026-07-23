import type { Neighborhood } from "./neighborhood";
import { Unit } from "./unit";
import type { Owner } from "./owner";

export type PropertyType =
  | "Apartment"
  | "House"
  | "Commercial"
  | "Office"
  | "Warehouse"
  | "Other";

export type Property = {
  id: string;
  name: string;
  code?: string;
  address?: string;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  ownerId?: string;
  owner?: Owner;
  occupancy?: {
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
  };
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
  units: Unit[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePropertyPayload = {
  name: string;
  neighborhoodId: string;
  type: string;
  ownerId?: string;
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
