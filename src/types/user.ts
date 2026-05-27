// ─── Énumérations ─────────────────────────────────────────────────────────────

/**
 * L'API retourne les rôles en minuscules : "admin", "manager", "user".
 */
export type UserRole = 'admin' | 'manager' | 'user';

// ─── Entité principale ────────────────────────────────────────────────────────

/**
 * Correspond exactement à la forme retournée par l'API (champ `user` du login).
 * L'API utilise `_id` (style MongoDB).
 */
export type User = {
  /** Identifiant MongoDB (_id) */
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  /** Indicatif téléphonique, ex: "+229" */
  countryCode?: string;
  role: UserRole;
  /** Champ libre genre/rôle social ("man", "woman", etc.) */
  genderrole?: string;
  isEmailVerified: boolean;
  /** Présent uniquement sur certains endpoints admin */
  isArchived?: boolean;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
};

export type PromoteUserPayload = {
  newRole: UserRole;
};

// ─── Paramètres de filtre ─────────────────────────────────────────────────────

export type UserFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
};
