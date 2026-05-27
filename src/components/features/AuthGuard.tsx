'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { tokenManager } from '@/lib/api/client';

/**
 * Protège les routes du dashboard.
 * Redirige vers /login si aucun token d'accès valide n'est présent.
 * Affiche un écran de chargement pendant la vérification.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router          = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // On vérifie la présence du token dans localStorage (source de vérité)
    const token = tokenManager.getAccess();
    if (!token && !isAuthenticated) {
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, router]);

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
