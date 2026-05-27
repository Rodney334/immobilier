import { api } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserFilterParams,
  UpdateUserPayload,
  PromoteUserPayload,
} from '@/types';

const BASE = '/api/v1/user';

export const userService = {
  getAll(
    params?: UserFilterParams,
  ): Promise<PaginatedResponse<User>> {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return api.get<PaginatedResponse<User>>(
      `${BASE}/${qs ? `?${qs}` : ''}`,
    );
  },

  getById(id: string): Promise<ApiResponse<User>> {
    return api.get<ApiResponse<User>>(`${BASE}/${id}`);
  },

  update(id: string, payload: UpdateUserPayload): Promise<ApiResponse<User>> {
    return api.put<ApiResponse<User>>(`${BASE}/${id}`, payload);
  },

  promote(
    id: string,
    payload: PromoteUserPayload,
  ): Promise<ApiResponse<User>> {
    return api.patch<ApiResponse<User>>(`${BASE}/${id}/promote`, payload);
  },

  clearRefreshToken(id: string): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(`${BASE}/${id}/clear-refresh`);
  },

  archive(id: string): Promise<ApiResponse<User>> {
    return api.patch<ApiResponse<User>>(`${BASE}/${id}/archive`);
  },

  restore(id: string): Promise<ApiResponse<User>> {
    return api.patch<ApiResponse<User>>(`${BASE}/${id}/restore`);
  },

  /**
   * Télécharger ou mettre à jour la photo de profil de l'utilisateur connecté.
   * Le champ "photo" est un fichier multipart/form-data.
   */
  uploadPhoto(file: File): Promise<ApiResponse<{ photoUrl: string }>> {
    const formData = new FormData();
    formData.append('photo', file);

    return api.post<ApiResponse<{ photoUrl: string }>>(
      `${BASE}/me/photo`,
      undefined,
      {
        body: formData,
        // Ne pas injecter Content-Type (le navigateur le fait pour multipart)
        headers: {},
      },
    );
  },
};
