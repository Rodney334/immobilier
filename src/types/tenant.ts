// --- Enumerations ---

export type TenantStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

export type IdentityType = string; // CIP, Passport, DriverLicense, etc.

// kept for backward compat
export type IdType = IdentityType;

// --- Entite principale ---

export type Tenant = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  profession?: string;          // occupation / métier
  identityNumber?: string;      // NPI ou numéro de pièce d'identité
  identityType?: string;
  emergencyContact?: string;
  notes?: string;
  // Blacklist
  blacklistReason?: string;     // motif de mise en liste noire
  blacklistedAt?: string;       // date ISO de mise en liste noire
  status: TenantStatus;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
};

// --- Payloads ---

export type CreateTenantPayload = {
  fullName: string;            // obligatoire
  firstName?: string;
  lastName?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  identityNumber?: string;
  identityType?: string;
  emergencyContact?: string;
  notes?: string;
  status?: TenantStatus;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

// --- Parametres de filtre ---

export type TenantFilterParams = {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  search?: string;
};
