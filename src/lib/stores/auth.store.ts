import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";
import { tokenManager } from "@/lib/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthState = {
  /** Utilisateur connecté (null si déconnecté) */
  user: User | null;
  /** true si un token d'accès valide est présent */
  isAuthenticated: boolean;
  /** true pendant les appels asynchrones d'auth (login, logout…) */
  isLoading: boolean;

  // ─── Actions ───────────────────────────────────────────────────────────────

  /** Stocker l'utilisateur après login ou refresh de profil */
  setUser: (user: User | null) => void;

  /** Gérer l'état de chargement */
  setLoading: (loading: boolean) => void;

  /** Déconnexion : vide le store ET les tokens localStorage */
  logout: () => void;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        tokenManager.clear();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "Estate Mangement-auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Ne persister que les données utilisateur — pas l'état de loading
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// ─── Sélecteurs typés (usage recommandé dans les composants) ──────────────────

export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectIsLoading = (s: AuthState) => s.isLoading;
