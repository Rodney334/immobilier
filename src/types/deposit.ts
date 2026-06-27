// ─── Énumérations ─────────────────────────────────────────────────────────────

export type DepositStatus = "HELD" | "PARTIALLY_REFUNDED" | "REFUNDED";

// ─── Déduction ───────────────────────────────────────────────────────────────

export type DepositDeduction = {
  id: string;
  _id: string;
  label: string;
  amount: number;
  effectiveDate?: string;
  reason?: string;
  createdAt: string;
};

// ─── Entité principale ────────────────────────────────────────────────────────

export type Deposit = {
  id: string;
  _id: string;
  leaseId: string;
  depositAmount: number;
  // currency?: string;
  status: DepositStatus;
  deductions: DepositDeduction[];
  tenantName: string;
  totalDeductions: number;
  refundableAmount?: number;
  createdAt: string;
  unitLabel: string;
  // refundNotes?: string;
  // refundedAt?: string;
  // netRefundable: number;
  // updatedAt: string;
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
