import { api, tokenManager } from '@/lib/api/client';
import type {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyEmailPayload,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  LogoutPayload,
} from '@/types';

const BASE = '/api/v1/auth';

export const authService = {
  /**
   * Connexion — stocke automatiquement les tokens retournés.
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>(`${BASE}/login`, payload, {
      skipAuth: true,
    });

    // Les tokens sont à la racine de la réponse : { accessToken, refreshToken, user }
    tokenManager.setAccess(res.accessToken);
    tokenManager.setRefresh(res.refreshToken);

    return res;
  },

  async register(
    payload: RegisterPayload,
  ): Promise<RegisterResponse> {
    return api.post<RegisterResponse>(`${BASE}/register`, payload, {
      skipAuth: true,
    });
  },

  /**
   * Refresh via la fonction de bas niveau (cohérent avec client.ts).
   * Préférer refreshAccessToken() de client.ts directement pour le flux interne.
   */
  async refresh(): Promise<string | null> {
    const { refreshAccessToken } = await import('@/lib/api/client');
    return refreshAccessToken();
  },

  async verifyEmail(
    payload: VerifyEmailPayload,
  ): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(`${BASE}/verify-email`, payload, {
      skipAuth: true,
    });
  },

  async resendVerification(
    payload: ResendVerificationPayload,
  ): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(
      `${BASE}/resend-verification`,
      payload,
      { skipAuth: true },
    );
  },

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(`${BASE}/forgot-password`, payload, {
      skipAuth: true,
    });
  },

  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(`${BASE}/reset-password`, payload, {
      skipAuth: true,
    });
  },

  async logout(payload?: LogoutPayload): Promise<void> {
    try {
      // D'après la doc API : POST /api/v1/auth/logout
      // - Authentification : Oui — Bearer JWT (access token) requis dans le header.
      // - Body : { fcmToken?: string } uniquement — PAS de refreshToken dans le body.
      // - Le serveur invalide le refreshToken via le cookie httpOnly et le supprime en DB.
      // skipRefresh: true → on ne tente PAS de refresh si le token est expiré.
      //   (On veut se déconnecter, pas se reconnecter pour se déconnecter.)
      await api.post<ApiResponse<null>>(
        `${BASE}/logout`,
        payload ?? {},      // { fcmToken?: string } ou {} — jamais refreshToken
        { skipRefresh: true },
      );
    } catch {
      // On ne bloque jamais le logout côté client si l'API échoue.
    } finally {
      // Toujours nettoyer les tokens locaux, quelle que soit la réponse.
      tokenManager.clear();
    }
  },
};
