import type { Metadata } from 'next';
import { ChangePasswordForm } from './ChangePasswordForm';

export const metadata: Metadata = { title: 'Nouveau mot de passe' };

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ChangePasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return <ChangePasswordForm token={token ?? ''} />;
}
