import type { User } from './user';

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'TERMINATE'
  | 'TRANSFER'
  | 'CANCEL'
  | 'REFUND'
  | 'APPROVE'
  | 'REJECT'
  | (string & Record<never, never>); // Extensible

export type AuditEntityType =
  | 'USER'
  | 'PROPERTY'
  | 'UNIT'
  | 'TENANT'
  | 'LEASE'
  | 'PAYMENT'
  | 'RENT_SCHEDULE'
  | 'ADJUSTMENT'
  | 'RECEIPT'
  | 'INCIDENT'
  | 'DEPOSIT'
  | 'NEIGHBORHOOD'
  | (string & Record<never, never>);

// ─── Entité principale ────────────────────────────────────────────────────────

export type AuditLog = {
  id: string;
  _id: string;
  userId: string;
  user?: User | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt?: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateAuditLogPayload = {
  userId?: string;           // auto-rempli côté serveur
  entityType: string;
  entityId?: string;
  action: AuditAction;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;        // auto-rempli si omis
  userAgent?: string;        // auto-rempli si omis
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type AuditLogFilterParams = {
  page?: number;
  limit?: number;
  user?: string;
  action?: AuditAction;
  entityType?: string;
};
