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
  | (string & Record<never, never>); // Extensible

// ─── Entité principale ────────────────────────────────────────────────────────

export type AuditLog = {
  id: string;
  userId: string;
  user?: User;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  createdAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type CreateAuditLogPayload = {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type AuditLogFilterParams = {
  page?: number;
  limit?: number;
  user?: string;
  action?: string;
};
