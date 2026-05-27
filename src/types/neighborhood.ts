// ─── Entité principale ────────────────────────────────────────────────────────

export type Neighborhood = {
  id: string;
  name: string;
  city: string;
  country: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateNeighborhoodPayload = {
  name: string;
  city: string;
  country: string;
  description?: string;
};

export type UpdateNeighborhoodPayload = Partial<CreateNeighborhoodPayload>;

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type NeighborhoodFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
};
