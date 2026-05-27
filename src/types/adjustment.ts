// ─── Énumérations ─────────────────────────────────────────────────────────────

export type AdjustmentType = 'discount' | 'penalty' | 'correction' | 'revision';

// ─── Entité principale ────────────────────────────────────────────────────────

export type Adjustment = {
  id: string;
  scheduleId: string;
  type: AdjustmentType;
  /** Montant positif (pénalité) ou négatif (remise) en XOF */
  amount: number;
  reason: string;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateAdjustmentPayload = {
  scheduleId: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  appliedDate: string;
};

export type UpdateAdjustmentPayload = {
  amount?: number;
  reason?: string;
  appliedDate?: string;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type AdjustmentFilterParams = {
  page?: number;
  limit?: number;
  type?: AdjustmentType;
};
