// ─── Énumérations ─────────────────────────────────────────────────────────────

export type DepositStatus = "HELD" | "PARTIALLY_REFUNDED" | "REFUNDED";

// ─── Déduction ───────────────────────────────────────────────────────────────

export type DepositDeduction = {
  id: string;
  _id: string;
  label: string;
  amount: number;
  reason?: string;
  createdAt: string;
};

// ─── Entité principale ────────────────────────────────────────────────────────

export type Deposit = {
  id: string;
  _id: string;
  leaseId: string;
  lease?: {
    id: string;
    contractNumber?: string;
    tenant?: { id: string; fullName?: string; firstName?: string; lastName?: string };
    unit?: {
      id: string;
      unitNumber: string;
      label?: string;
      property?: { id: string; name: string };
    };
  };
  depositAmount: number;
  currency?: string;
  status: DepositStatus;
  deductions: DepositDeduction[];
  totalDeductions: number;
  refundedAmount?: number;
  refundNotes?: string;
  refundedAt?: string;
  netRefundable: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type AddDeductionPayload = {
  label: string;
  amount: number;
  reason?: string;
};

export type RefundDepositPayload = {
  refundedAmount: number;
  notes?: string;
};
