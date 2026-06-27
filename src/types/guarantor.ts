// ─── Entité ───────────────────────────────────────────────────────────────────

export type Guarantor = {
  id: string;
  _id: string;
  leaseId: string;
  fullName: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  employer?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  identityNumber?: string;
  identityType?: string;
  relation?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

// ─── Payload (create / update) ────────────────────────────────────────────────

export type GuarantorPayload = {
  leaseId: string;
  fullName: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  employer?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  identityNumber?: string;
  identityType?: string;
  relation?: string;
  notes?: string;
};
