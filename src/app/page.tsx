import { redirect } from 'next/navigation';

/**
 * Racine de l'application.
 * Redirige vers /login ; le middleware (à implémenter) gérera la redirection
 * vers /dashboard si l'utilisateur est déjà authentifié.
 */
export default function RootPage() {
  redirect('/login');
}
