// ─── Réponse standard de l'API ────────────────────────────────────────────────

export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T;
  message: string;
};

// ─── Réponse paginée ──────────────────────────────────────────────────────────

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  /** L'API retourne "meta" (et non "pagination") */
  meta: PaginationMeta;
  message?: string;
};

// ─── Paramètres de requête communs ────────────────────────────────────────────

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
};

// ─── Classe d'erreur API ──────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
