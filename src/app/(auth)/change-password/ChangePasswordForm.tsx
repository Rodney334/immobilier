'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { authService } from '@/lib/services/auth.service';
import { ApiError } from '@/types';

type FormState = { error: string | null; success: boolean };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-[#263447] active:bg-[#16202C] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      Enregistrer le mot de passe
    </button>
  );
}

export function ChangePasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const newPassword = formData.get('newPassword') as string;
      const confirm     = formData.get('confirmPassword') as string;

      if (!newPassword) {
        return { error: 'Veuillez saisir un nouveau mot de passe.', success: false };
      }
      if (newPassword.length < 8) {
        return { error: 'Le mot de passe doit contenir au moins 8 caractères.', success: false };
      }
      if (newPassword !== confirm) {
        return { error: 'Les mots de passe ne correspondent pas.', success: false };
      }
      if (!token) {
        return { error: 'Lien de réinitialisation invalide ou expiré.', success: false };
      }

      try {
        await authService.resetPassword({ token, newPassword });
        return { error: null, success: true };
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Une erreur est survenue. Veuillez réessayer.';
        return { error: message, success: false };
      }
    },
    { error: null, success: false },
  );

  useEffect(() => {
    if (state.success) router.push('/password-reset-success');
  }, [state.success, router]);

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
            <ShieldAlert size={28} className="text-danger" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-semibold text-[24px] text-primary tracking-tight">
            Lien invalide
          </h1>
          <p className="text-[14px] text-primary/50 leading-relaxed max-w-xs mx-auto">
            Ce lien de réinitialisation est invalide ou a expiré.
            Veuillez en demander un nouveau.
          </p>
        </div>
        <a
          href="/forgot-password"
          className="inline-flex items-center justify-center w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-[#263447] transition-colors duration-150"
        >
          Demander un nouveau lien
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-[24px] text-primary tracking-tight">
          Nouveau mot de passe
        </h1>
        <p className="text-[14px] text-primary/50 leading-relaxed">
          Choisissez un mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <form action={formAction} className="space-y-5" noValidate>
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger leading-snug"
          >
            {state.error}
          </div>
        )}

        <Input
          name="newPassword"
          type="password"
          label="Nouveau mot de passe"
          placeholder="Min. 8 caractères"
          autoComplete="new-password"
          required
          hint="Au moins 8 caractères"
        />

        <Input
          name="confirmPassword"
          type="password"
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />

        <SubmitButton />
      </form>
    </div>
  );
}
