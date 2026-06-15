import { ApiError } from "@/types/api";

// ─── Base URL ─────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://estatemanagement-production.up.railway.app";

// ─── Token manager ────────────────────────────────────────────────────────────

/**
 * Gère le stockage des tokens JWT dans localStorage (côté client uniquement).
 * Préfixe "Estate Mangement_" pour éviter les collisions avec d'autres apps.
 */
export const tokenManager = {
  getAccess(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("Estate Mangement_access_token");
  },
  setAccess(token: string): void {
    if (typeof window !== "undefined")
      localStorage.setItem("Estate Mangement_access_token", token);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("Estate Mangement_refresh_token");
  },
  setRefresh(token: string): void {
    if (typeof window !== "undefined")
      localStorage.setItem("Estate Mangement_refresh_token", token);
  },
  clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("Estate Mangement_access_token");
      localStorage.removeItem("Estate Mangement_refresh_token");
    }
  },
};

// ─── Refresh token logic ──────────────────────────────────────────────────────

let isRefreshing = false;
type RefreshCallback = (token: string | null) => void;
let refreshQueue: RefreshCallback[] = [];

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefresh();
  if (!refreshToken) return null;

  try {
    // D'après la doc API : POST /api/v1/auth/refresh
    // Mode hybride : cookie httpOnly OU body { refreshToken }.
    // Pas d'Authorization header sur cet endpoint (pas d'auth requise).
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      credentials: "include", // envoie aussi le cookie httpOnly si présent
    });

    if (!res.ok) {
      // 401 = aucun refresh token fourni, 403 = expiré/révoqué
      return null;
    }

    const body = await res.json();

    // L'API renvoie le même format que le login : accessToken à la racine.
    const newAccessToken: string | null =
      body?.accessToken ??
      body?.data?.accessToken ??
      null;

    // Rotation côté serveur : l'API renvoie aussi un nouveau refreshToken.
    const newRefreshToken: string | null =
      body?.refreshToken ??
      body?.data?.refreshToken ??
      null;

    if (newAccessToken) {
      tokenManager.setAccess(newAccessToken);
      if (newRefreshToken) {
        tokenManager.setRefresh(newRefreshToken);
      }
      return newAccessToken;
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type RequestOptions = RequestInit & {
  /** Ne pas injecter le header Authorization */
  skipAuth?: boolean;
  /** Ne pas tenter le refresh automatique sur 401 */
  skipRefresh?: boolean;
};

// ─── Fonction principale ──────────────────────────────────────────────────────

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    skipAuth = false,
    skipRefresh = false,
    headers: extraHeaders,
    ...fetchOptions
  } = options;

  const accessToken = tokenManager.getAccess();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(accessToken && !skipAuth
      ? { Authorization: `Bearer ${accessToken}` }
      : {}),
    ...((extraHeaders as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // ── Gestion du 401 : refresh automatique ──────────────────────────────────
  if (response.status === 401 && !skipAuth && !skipRefresh) {
    if (isRefreshing) {
      // Mettre la requête en file d'attente jusqu'à la fin du refresh
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push(async (newToken) => {
          if (!newToken) {
            reject(
              new ApiError(401, "Session expirée. Veuillez vous reconnecter."),
            );
            return;
          }
          try {
            const retryRes = await fetch(`${BASE_URL}${path}`, {
              ...fetchOptions,
              headers: { ...headers, Authorization: `Bearer ${newToken}` },
            });
            if (!retryRes.ok) {
              const err = await retryRes.json().catch(() => ({}));
              reject(
                new ApiError(
                  retryRes.status,
                  err.error ?? err.message ?? "Erreur serveur",
                  err.code,
                ),
              );
            } else {
              resolve(retryRes.json());
            }
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;

    // Vider la file d'attente
    const queue = [...refreshQueue];
    refreshQueue = [];
    queue.forEach((cb) => cb(newToken));

    if (!newToken) {
      // Refresh échoué → tokens invalides, on nettoie et on redirige
      tokenManager.clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new ApiError(401, "Session expirée. Veuillez vous reconnecter.");
    }

    // Relancer avec le nouveau token
    return apiRequest<T>(path, { ...options, skipRefresh: true });
  }

  // ── Gestion des autres erreurs ────────────────────────────────────────────
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "Erreur réseau",
    }));
    throw new ApiError(
      response.status,
      errorData.error ?? errorData.message ?? "Une erreur est survenue",
      errorData.code,
    );
  }

  // ── Réponse vide (204 No Content) ─────────────────────────────────────────
  if (response.status === 204) return undefined as T;

  const json = await response.json();
  return normalizeIds(json) as T;
}

// ─── Normalise _id → id (MongoDB) ────────────────────────────────────────────
// L'API renvoie "_id" pour les identifiants MongoDB. On mappe vers "id" pour
// que tous les composants puissent utiliser entity.id de façon uniforme.

function normalizeIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(normalizeIds) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
      if (k === "_id") {
        out["_id"] = v;
        // n'écrase pas un champ "id" s'il existe déjà
        if (!("id" in src)) out["id"] = v;
      } else {
        out[k] = normalizeIds(v);
      }
    }
    return out as T;
  }
  return value;
}

// ─── Helpers de méthodes HTTP ─────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return apiRequest<T>(path, { method: "GET", ...options });
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiRequest<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiRequest<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiRequest<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return apiRequest<T>(path, { method: "DELETE", ...options });
  },

  /**
   * Télécharger un fichier binaire (PDF, etc.)
   * Retourne un Blob pour que l'appelant puisse l'ouvrir ou le sauvegarder.
   * Gère automatiquement le refresh du token sur 401 (même logique que apiRequest).
   */
  async download(
    path: string,
    options?: RequestOptions & { skipRefresh?: boolean },
  ): Promise<Blob> {
    const {
      skipAuth = false,
      skipRefresh = false,
      headers: extraHeaders,
      ...fetchOptions
    } = options ?? {};
    const accessToken = tokenManager.getAccess();

    const headers: Record<string, string> = {
      ...(accessToken && !skipAuth
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...((extraHeaders as Record<string, string> | undefined) ?? {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      ...fetchOptions,
      headers,
    });

    // ── Gestion du 401 : refresh automatique ─────────────────────────────────
    if (response.status === 401 && !skipAuth && !skipRefresh) {
      if (isRefreshing) {
        // Attendre la fin du refresh en cours
        return new Promise<Blob>((resolve, reject) => {
          refreshQueue.push(async (newToken) => {
            if (!newToken) {
              reject(
                new ApiError(401, "Session expirée. Veuillez vous reconnecter."),
              );
              return;
            }
            try {
              const retryRes = await fetch(`${BASE_URL}${path}`, {
                method: "GET",
                ...fetchOptions,
                headers: { ...headers, Authorization: `Bearer ${newToken}` },
              });
              if (!retryRes.ok) {
                reject(
                  new ApiError(retryRes.status, "Échec du téléchargement du fichier"),
                );
              } else {
                resolve(retryRes.blob());
              }
            } catch (e) {
              reject(e);
            }
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      const queue = [...refreshQueue];
      refreshQueue = [];
      queue.forEach((cb) => cb(newToken));

      if (!newToken) {
        tokenManager.clear();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        throw new ApiError(401, "Session expirée. Veuillez vous reconnecter.");
      }

      // Relancer avec le nouveau token
      return this.download(path, { ...options, skipRefresh: true });
    }

    if (!response.ok) {
      throw new ApiError(response.status, "Échec du téléchargement du fichier");
    }

    return response.blob();
  },
};
