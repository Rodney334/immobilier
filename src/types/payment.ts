// ─── Énumérations ─────────────────────────────────────────────────────────────

export type PaymentStatus = "RECORDED" | "REVERSED" | "CANCELLED" | "failed";

/** L'API retourne les méthodes en MAJUSCULES */
export type PaymentMethod =
  | "MOBILE_MONEY"
  | "BANK_TRANSFER"
  | "CASH"
  | "CHECK"
  | "OTHER";

// ─── Sous-types embarqués ─────────────────────────────────────────────────────

/** Locataire tel qu'il est embarqué dans un paiement */
export type PaymentTenant = {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  email?: string;
  status: string;
};

/** Échéance embarquée dans une allocation */
export type PaymentRentSchedule = {
  id: string;
  leaseId: string;
  dueDate: string;
  dueMonth: number;
  dueYear: number;
  amountDue: string;
  amountPaid: string;
  balance: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Allocation (ventilation du paiement sur une échéance) */
export type PaymentAllocation = {
  id: string;
  paymentId: string;
  rentScheduleId: string;
  /** Montant alloué — l'API retourne une chaîne décimale */
  allocatedAmount: string;
  rentSchedule?: PaymentRentSchedule;
  createdAt: string;
};

/** Reçu embarqué dans un paiement */
export type PaymentReceipt = {
  id: string;
  leaseId: string;
  paymentId: string;
  receiptNumber: string;
  issueDate: string;
  /** L'API retourne une chaîne décimale */
  amount: string;
  status: string;
  fileUrl: string | null;
  notes: string | null;
  generatedById: string;
  createdAt: string;
  updatedAt: string;
};

/** Bail embarqué dans un paiement */
export type PaymentLease = {
  id: string;
  unitId: string;
  tenantId: string;
  contractNumber?: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  depositAmount?: string;
  billingDay?: number;
  periodicity?: string;
  status: string;
  terminationReason?: string | null;
  notes?: string | null;
  unit?: {
    id: string;
    unitNumber: string;
    label?: string;
    type?: string;
    floor?: string;
    status?: string;
    property?: {
      id: string;
      name: string;
      address?: string;
    };
  };
  tenant?: PaymentTenant;
};

// ─── Entité principale ────────────────────────────────────────────────────────

export type Payment = {
  id: string;
  leaseId: string;
  lease?: PaymentLease;
  paymentDate: string;
  /** L'API retourne une chaîne décimale ex : "400000.00" */
  amount: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  reference?: string;
  receiptNumber?: string;
  notes?: string | null;
  createdById?: string;
  cancelledAt?: string | null;
  cancellationNote?: string | null;
  allocations?: PaymentAllocation[];
  receipts?: PaymentReceipt[];
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreatePaymentPayload = {
  leaseId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
};

export type UpdatePaymentPayload = {
  status?: PaymentStatus;
  reference?: string;
  paymentMethod?: PaymentMethod;
};

export type CancelPaymentPayload = {
  reason: string;
};

export type AllocationInput = {
  rentScheduleId: string;
  amount: number;
};

export type CreatePaymentWithAllocationsPayload = {
  leaseId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  allocations: AllocationInput[];
};

export type AutoAllocatePaymentPayload = {
  leaseId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type PaymentFilterParams = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  tenant?: string;
  lease?: string;
};
