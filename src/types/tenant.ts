// ─── Énumérations ─────────────────────────────────────────────────────────────

export type TenantStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

export type IdType =
  | "Passport"
  | "NationalId"
  | "DriverLicense"
  | "ResidencePermit"
  | "Other";

// ─── Entité principale ────────────────────────────────────────────────────────

export type Tenant = {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  idNumber?: string;
  idType?: IdType;
  address?: string;
  city?: string;
  country?: string;
  status: TenantStatus;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateTenantPayload = {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  idNumber?: string;
  idType?: IdType;
  address?: string;
  city?: string;
  country?: string;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type TenantFilterParams = {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  search?: string;
};
