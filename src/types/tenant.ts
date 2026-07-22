// --- Enumerations ---

export type TenantStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

export type TenantType = "INDIVIDUAL" | "COMPANY";

export type LeasePurpose =
  | "SHOP"
  | "OFFICE"
  | "STORAGE"
  | "HABITATION"
  | "COMMERCE"
  | "OTHER";

export type IdentityType = string; // CIP, Passport, DriverLicense, etc.

// kept for backward compat
export type IdType = IdentityType;

// --- Entite principale ---

export type Tenant = {
  id: string;
  _id: string;
  tenantType?: TenantType; // INDIVIDUAL (défaut) | COMPANY
  firstName?: string;
  lastName?: string;
  fullName: string; // nom complet (particulier) ou raison sociale (entreprise)
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  profession?: string; // occupation / métier
  identityNumber?: string; // NPI ou numéro de pièce d'identité
  identityType?: string;
  emergencyContact?: string;
  notes?: string;
  // Champs entreprise (tenantType === "COMPANY")
  companyLegalForm?: string; // forme juridique (ex: SARL, SA, SAS)
  companyRccm?: string; // numéro RCCM
  companyIfu?: string; // numéro IFU
  representativeName?: string; // nom du représentant légal
  representativeTitle?: string; // fonction du représentant
  // Blacklist
  blacklistReason?: string;
  blacklistedAt?: string;
  status: TenantStatus;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;

  leasePurpose?: LeasePurpose;
  leasePurposeDetails?: string;
};

// --- Payloads ---

export type CreateTenantPayload = {
  tenantType?: TenantType;
  fullName: string; // obligatoire — nom complet ou raison sociale
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
  leasePurpose?: string;
  leasePurposeDetails?: string;
  // Champs entreprise
  companyLegalForm?: string;
  companyRccm?: string;
  companyIfu?: string;
  representativeName?: string;
  representativeTitle?: string;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

// --- Parametres de filtre ---

export type TenantFilterParams = {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  search?: string;
};
