export enum GrantedRole {
  Admin = "admin",
  User = "user",
}

export enum GenderType {
  Man = "man",
  Women = "women",
  Other = "other",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum UnitStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

export enum TenantStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLACKLISTED = "BLACKLISTED",
}

export enum LeaseStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED",
  EXPIRED = "EXPIRED",
  ARCHIVED = "ARCHIVED",
}

export enum RentScheduleStatus {
  PENDING = "PENDING",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  RECORDED = "RECORDED",
  CANCELLED = "CANCELLED",
  REVERSED = "REVERSED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
  MTN_MOMO = "MTN_MOMO",
  MOOV_MONEY = "MOOV_MONEY",
  CHEQUE = "CHEQUE",
  CARD = "CARD",
  OTHER = "OTHER",
}

export enum AdjustmentType {
  DISCOUNT = "DISCOUNT",
  PENALTY = "PENALTY",
  CORRECTION = "CORRECTION",
  RENT_REVISION = "RENT_REVISION",
  WAIVER = "WAIVER",
}

export enum ReceiptStatus {
  GENERATED = "GENERATED",
  CANCELLED = "CANCELLED",
}

export enum ContractEventType {
  CREATED = "CREATED",
  ACTIVATED = "ACTIVATED",
  SUSPENDED = "SUSPENDED",
  RESUMED = "RESUMED",
  TERMINATED = "TERMINATED",
  UNIT_RELEASED = "UNIT_RELEASED",
  TENANT_CHANGED = "TENANT_CHANGED",
  RENT_REVISED = "RENT_REVISED",
  DEPOSIT_UPDATED = "DEPOSIT_UPDATED",
  NOTE_ADDED = "NOTE_ADDED",
  TRANSFERRED = "TRANSFERRED",
  EVICTED = "EVICTED",
  VACANCY_STARTED = "VACANCY_STARTED",
  VACANCY_ENDED = "VACANCY_ENDED",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  CANCEL = "CANCEL",
  RESTORE = "RESTORE",
}

export enum OccupancyType {
  TENANTED = "TENANTED",
  VACANT = "VACANT",
  EVICTED = "EVICTED",
  BLOCKED = "BLOCKED",
}

export enum AdjustmentValueMode {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
}

export enum AdjustmentBaseReference {
  UNIT_BASE_RENT = "UNIT_BASE_RENT",
  LEASE_MONTHLY_RENT = "LEASE_MONTHLY_RENT",
}

export function toAmount(value: any): number {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    throw new Error("INVALID_AMOUNT");
  }
  return amount;
}

export enum PaymentPlanFrequency {
  MONTHLY = "MONTHLY",
  BIMONTHLY = "BIMONTHLY",
  QUARTERLY = "QUARTERLY",
  CUSTOM = "CUSTOM",
}
export function formatAmount(value: number): string {
  return Number(value).toFixed(2);
}

export enum LeasePurpose {
  SHOP = "SHOP",
  OFFICE = "OFFICE",
  STORAGE = "STORAGE",
  HABITATION = "HABITATION",
  COMMERCE = "COMMERCE",
  OTHER = "OTHER",
}
