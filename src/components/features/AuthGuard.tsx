'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { tokenManager, refreshAccessToken } from '@/lib/api/client';

// ─── Helpers JWT ──────────────────────────────────────────────────────────────

/**
 * Décode le champ `exp` d'un JWT sans vérifier la signature.
 * Retourne le timestamp Unix (secondes) ou null si impossible.
 */
function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Retourne true si le token JWT est déjà expiré ou expire dans moins de 30 s.
 * Un buffer de 30 s (et non 60 s) évite de rater la fenêtre de validité sur
 * des sessions courtes, tout en laissant le temps de faire le refresh.
 */
function isExpiredOrExpiring(token: string): boolean {
  const exp = getTokenExp(token);
  if (exp === null) return false; // Impossible à déterminer → on laisse passer
  return Date.now() / 1000 >= exp - 30;
}

// ─── AuthGuard ────────────────────────────────────────────────────────────────

type CheckState = 'pending' | 'ok' | 'redirecting';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [checkState, setCheckState] = useState<CheckState>('pending');

  // Empêche le double-effet en React StrictMode (dev uniquement)
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // 1. Synchroniser le store Zustand avec localStorage (skipHydration: true)
    useAuthStore.persist.rehydrate();

    async function checkSession() {
      const accessToken  = tokenManager.getAccess();
      const refreshToken = tokenManager.getRefresh();

      // Cas 1 : aucun token → déconnecté
      if (!accessToken && !refreshToken) {
        setCheckState('redirecting');
        router.replace('/login');
        return;
      }

      // Cas 2 : access token présent et valide → on ouvre l'app
      if (accessToken && !isExpiredOrExpiring(accessToken)) {
        setCheckState('ok');
        return;
      }

      // Cas 3 : access token absent ou expiré, mais refresh token disponible
      // → tentative de refresh silencieux AVANT d'afficher l'app
      if (refreshToken) {
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setCheckState('ok');
            return;
          }
        } catch {
          // Ignore : on tombe dans le cas 4
        }
      }

      // Cas 4 : refresh échoué ou impossible → déconnexion propre
      logout(); // nettoie le store ET tokenManager
      setCheckState('redirecting');
      router.replace('/login');
    }

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spinner pendant le check initial
  if (checkState === 'pending' || checkState === 'redirecting') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-[13px] text-primary/40">Chargement…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
