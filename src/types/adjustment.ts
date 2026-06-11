// Valeurs exactes de l'API (enum backend)
export type AdjustmentType = 'DISCOUNT' | 'PENALTY' | 'CORRECTION' | 'RENT_REVISION' | 'WAIVER';
export type AdjustmentValueMode = 'FIXED' | 'PERCENTAGE';

export type Adjustment = {
  id: string;
  scheduleId?: string;
  leaseId?: string;
  type: AdjustmentType;
  amount: number;
  valueMode?: AdjustmentValueMode;
  reason: string;
  label?: string;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdjustmentPayload = {
  scheduleId?: string;
  leaseId?: string;
  type: AdjustmentType;
  amount: number;
  valueMode?: AdjustmentValueMode;
  reason: string;
  appliedDate: string;
};

export type UpdateAdjustmentPayload = {
  amount?: number;
  reason?: string;
  appliedDate?: string;
};

export type AdjustmentFilterParams = {
  page?: number;
  limit?: number;
  type?: AdjustmentType;
  lease?: string;
  dateFrom?: string;
  dateTo?: string;
};
