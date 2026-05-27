import type { User } from './user';

// ─── Payloads de requête ──────────────────────────────────────────────────────

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  countryCode?: string;
  role?: string;
  signupIntent?: string;
};

export type VerifyEmailPayload = {
  email: string;
  verificationCode: string;
};

export type ResendVerificationPayload = {
  email: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type LogoutPayload = {
  fcmToken?: string;
};

// ─── Réponses ─────────────────────────────────────────────────────────────────

/**
 * Réponse exacte de POST /api/v1/auth/login :
 * { accessToken, refreshToken, user: { _id, name, email, role, ... } }
 */
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

/**
 * Réponse de POST /api/v1/auth/register :
 * L'objet retourné est directement l'entité User (même forme que login.user).
 */
export type RegisterResponse = User;
