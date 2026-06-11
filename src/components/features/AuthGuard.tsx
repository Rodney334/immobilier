'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { tokenManager, refreshAccessToken } from '@/lib/api/client';

// ─── Helpers JWT ──────────────────────────────────────────────────────────────

/**
 * Décode l'expiration d'un JWT (sans vérifier la signature).
 * Retourne le timestamp Unix (en secondes) ou null si le token est invalide.
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
 * Retourne true si le token est expiré (ou expirera dans les 60 prochaines secondes).
 */
function isTokenExpiredOrExpiring(token: string): boolean {
  const exp = getTokenExp(token);
  if (exp === null) return false; // impossible à déterminer → on laisse passer
  return Date.now() / 1000 >= exp - 60;
}

// ─── AuthGuard ────────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const logout   = useAuthStore((s) => s.logout);
  const [checked, setChecked] = useState(false);

  // Évite une double exécution en mode React StrictMode
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // 1. Réhydrater le store Zustand (skipHydration: true empêche le mismatch SSR)
    useAuthStore.persist.rehydrate();

    async function checkSession() {
      const accessToken  = tokenManager.getAccess();
      const refreshToken = tokenManager.getRefresh();

      // Aucun token → déconnecté
      if (!accessToken && !refreshToken) {
        router.replace('/login');
        return;
      }

      // Access token valide (non expiré) → on laisse passer directement
      if (accessToken && !isTokenExpiredOrExpiring(accessToken)) {
        setChecked(true);
        return;
      }

      // Access token expiré (ou absent) mais refresh token disponible
      // → tentative de refresh silencieux avant le premier rendu
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          // Refresh OK — tokenManager a déjà persisté le nouveau token.
          setChecked(true);
          return;
        }
      }

      // Refresh échoué ou pas de refresh token → déconnexion propre
      logout();
      router.replace('/login');
    }

    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) {
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
