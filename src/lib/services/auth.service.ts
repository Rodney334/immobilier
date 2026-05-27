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

  async refresh(): Promise<ApiResponse<{ accessToken: string }>> {
    return api.post<ApiResponse<{ accessToken: string }>>(`${BASE}/refresh`);
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

  async logout(payload?: LogoutPayload): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>(
      `${BASE}/logout`,
      payload ?? {},
    );
    tokenManager.clear();
    return res;
  },
};
