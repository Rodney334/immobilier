"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { authService } from "@/lib/services/auth.service";
import { ApiError } from "@/types";

type FormState = { error: string | null; success: boolean; email?: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-[#263447] active:bg-[#16202C] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
    >
      {pending && (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      )}
      Créer mon compte
    </button>
  );
}

export function RegisterForm() {
  const router = useRouter();

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const phone = formData.get("phoneNumber") as string;
      const password = formData.get("password") as string;
      const confirm = formData.get("confirmPassword") as string;

      if (!name || !email || !password) {
        return {
          error: "Veuillez remplir tous les champs obligatoires.",
          success: false,
        };
      }
      if (password !== confirm) {
        return {
          error: "Les mots de passe ne correspondent pas.",
          success: false,
        };
      }
      if (password.length < 8) {
        return {
          error: "Le mot de passe doit contenir au moins 8 caractères.",
          success: false,
        };
      }

      try {
        await authService.register({
          name,
          email,
          password,
          phoneNumber: phone || undefined,
        });
        return { error: null, success: true, email };
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Une erreur est survenue. Veuillez réessayer.";
        return { error: message, success: false, email: "" };
      }
    },
    { error: null, success: false, email: "" },
  );

  // Après inscription → page "vérifiez votre email" avec l'adresse pour le renvoi
  useEffect(() => {
    if (state.success && state.email) {
      router.push(`/check-email?email=${encodeURIComponent(state.email)}`);
    }
  }, [state.success, state.email, router]);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-[24px] text-primary tracking-tight">
          Créer un compte
        </h1>
        <p className="text-[14px] text-primary/50">
          Commencez à gérer vos biens en quelques secondes
        </p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger leading-snug"
          >
            {state.error}
          </div>
        )}

        <Input
          name="name"
          type="text"
          label="Nom complet"
          placeholder="Jean Dupont"
          autoComplete="name"
          required
        />

        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="nom@exemple.com"
          autoComplete="email"
          required
        />

        <Input
          name="phoneNumber"
          type="tel"
          label="Téléphone (optionnel)"
          placeholder="+229 01 23 45 67"
          autoComplete="tel"
        />

        <Input
          name="password"
          type="password"
          label="Mot de passe"
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

        <div className="pt-1">
          <SubmitButton />
        </div>
      </form>

      <p className="text-center text-[13px] text-primary/45">
        Déjà un compte&nbsp;?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
