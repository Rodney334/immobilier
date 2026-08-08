// ─── Reversements aux propriétaires ───────────────────────────────────────────
// Un OwnerPayout pose une "borne" sur le compte du propriétaire : une fois
// confirmé (PAID), le relevé suivant repart après periodEnd. "kind: RESET"
// représente une remise à zéro manuelle (pas un versement réel).

export type OwnerPayoutKind = "PAYOUT" | "RESET";
export type OwnerPayoutStatus = "DRAFT" | "PAID" | "CANCELLED";

export type OwnerPayout = {
  id: string;
  _id: string;
  ownerId: string;
  kind: OwnerPayoutKind;
  status: OwnerPayoutStatus;
  reference?: string | null;        // "REV-2026-0001" ou "RAZ-2026-0001"
  periodStart?: string | null;      // ISO
  periodEnd: string;                // ISO
  paidAt?: string | null;           // ISO
  // Snapshot figé au moment du versement — string décimale côté API.
  rentCollected: string;
  incidentCharges: string;
  adjustmentCharges: string;
  managementFeePercent: string;
  managementFeeAmount: string;
  netDue: string;
  amountPaid: string;
  method?: string | null;
  externalReference?: string | null;
  propertyIds?: string[] | null;    // null = tout le portefeuille
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePayoutPayload = {
  periodEnd: string;                // requis, ISO ou "2026-06-30"
  periodStart?: string;
  propertyIds?: string[];           // reversement partiel
  amountPaid?: number;              // défaut : le net dû calculé
  method?: string;
  externalReference?: string;
  markAsPaid?: boolean;             // true = confirmé immédiatement
  paidAt?: string;
  notes?: string;
};

export type ResetAccountPayload = {
  asOfDate: string;                 // requis
  reason?: string;
};

export type OwnerPayoutFilterParams = {
  page?: number;
  limit?: number;
  kind?: OwnerPayoutKind;
  status?: OwnerPayoutStatus;
};

// Modes de règlement — mêmes valeurs que celles utilisées pour les paiements
// de loyer (à ajuster si le back en documente un enum spécifique).
export const OWNER_PAYOUT_METHODS: { value: string; label: string }[] = [
  { value: "CASH", label: "Espèces" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
  { value: "MOBILE_MONEY", label: "Mobile money" },
  { value: "CHECK", label: "Chèque" },
  { value: "OTHER", label: "Autre" },
];
