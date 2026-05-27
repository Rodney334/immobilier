'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
      className="w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium
                 hover:bg-[#263447] active:bg-[#16202C]
                 disabled:opacity-60 disabled:cursor-not-allowed
                 transition-colors duration-150
                 flex items-center justify-center gap-2"
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      Envoyer le lien
    </button>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const email = formData.get('email') as string;

      if (!email) {
        return { error: 'Veuillez saisir votre adresse email.', success: false };
      }

      try {
        await authService.forgotPassword({ email });
        return { error: null, success: true };
      } catch (err) {
        // Réponse neutre même si l'email n'existe pas (sécurité)
        if (err instanceof ApiError && err.status === 404) {
          return { error: null, success: true };
        }
        const message =
          err instanceof ApiError ? err.message : 'Une erreur est survenue.';
        return { error: message, success: false };
      }
    },
    { error: null, success: false },
  );

  useEffect(() => {
    if (state.success) router.push('/forgot-password/success');
  }, [state.success, router]);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-[24px] text-primary tracking-tight">
          Mot de passe oublié&nbsp;?
        </h1>
        <p className="text-[14px] text-primary/50 leading-relaxed">
          Saisissez votre adresse email et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </p>
      </div>

      <form action={formAction} className="space-y-5" noValidate>
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20
                       text-[13px] text-danger leading-snug"
          >
            {state.error}
          </div>
        )}

        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="nom@exemple.com"
          autoComplete="email"
          required
        />

        <SubmitButton />
      </form>

      <Link
        href="/login"
        className="flex items-center gap-2 text-[13px] text-primary/50
                   hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Retour à la connexion
      </Link>
    </div>
  );
}
