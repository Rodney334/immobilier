"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { authService } from "@/lib/services/auth.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ApiError } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  error: string | null;
  success: boolean;
  /** Email soumis — utile pour le renvoi de vérification sur 403 */
  submittedEmail: string;
  /** true si le 403 est dû à un email non vérifié */
  emailUnverified: boolean;
};

// ─── Bouton de soumission ─────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-[#263447] active:bg-[#16202C] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      Se connecter
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function LoginForm() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  // État séparé pour le renvoi de vérification (indépendant de useActionState)
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const email    = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!email || !password) {
        return { error: "Veuillez remplir tous les champs.", success: false, submittedEmail: email ?? "", emailUnverified: false };
      }

      try {
        const res = await authService.login({ email, password });
        setUser(res.user);
        return { error: null, success: true, submittedEmail: email, emailUnverified: false };
      } catch (err) {
        // Cas spécial : 403 = email non vérifié
        if (err instanceof ApiError && err.status === 403) {
          return {
            error: "Votre adresse email n'est pas encore vérifiée.",
            success: false,
            submittedEmail: email,
            emailUnverified: true,
          };
        }

        const message =
          err instanceof ApiError
            ? err.message
            : "Identifiants invalides. Veuillez réessayer.";
        return { error: message, success: false, submittedEmail: email, emailUnverified: false };
      }
    },
    { error: null, success: false, submittedEmail: "", emailUnverified: false },
  );

  // Redirection après connexion réussie
  useEffect(() => {
    if (state.success) router.push("/dashboard");
  }, [state.success, router]);

  // Réinitialiser le statut de renvoi si l'utilisateur modifie ses identifiants
  useEffect(() => {
    if (!state.emailUnverified) setResendStatus("idle");
  }, [state.emailUnverified]);

  async function handleResend() {
    if (!state.submittedEmail || resendStatus !== "idle") return;
    setResendStatus("sending");
    try {
      await authService.resendVerification({ email: state.submittedEmail });
    } catch {
      // Réponse neutre — on affiche "envoyé" dans tous les cas (anti-énumération)
    } finally {
      setResendStatus("sent");
    }
  }

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div className="space-y-1.5">
        <h1 className="font-semibold text-[24px] text-primary tracking-tight">
          Connexion
        </h1>
        <p className="text-[14px] text-primary/50">
          Accédez à votre espace propriétaire
        </p>
      </div>

      {/* Formulaire */}
      <form action={formAction} className="space-y-5" noValidate>

        {/* Erreur générale */}
        {state.error && !state.emailUnverified && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger leading-snug"
          >
            {state.error}
          </div>
        )}

        {/* Bloc email non vérifié — 403 */}
        {state.emailUnverified && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-warning/8 border border-warning/20 space-y-2"
          >
            <p className="text-[13px] text-warning font-medium leading-snug">
              {state.error}
            </p>
            <p className="text-[12px] text-primary/55 leading-snug">
              Vérifiez votre boîte mail
              {state.submittedEmail && (
                <> (<span className="font-medium">{state.submittedEmail}</span>)</>
              )}{" "}
              ou renvoyez le lien de confirmation.
            </p>

            {resendStatus === "sent" ? (
              <div className="flex items-center gap-1.5 text-[12px] text-success pt-0.5">
                <CheckCircle size={13} aria-hidden="true" />
                Email de vérification envoyé.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === "sending"}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-secondary hover:text-[#C8935E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendStatus === "sending" && (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                )}
                {resendStatus === "sending" ? "Envoi en cours…" : "Renvoyer l'email de vérification"}
              </button>
            )}
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

        <div className="space-y-1.5">
          <Input
            name="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] text-secondary hover:text-[#C8935E] transition-colors"
            >
              Mot de passe oublié&nbsp;?
            </Link>
          </div>
        </div>

        <SubmitButton />

        {/* Séparateur */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-border-custom" />
          <span className="text-[12px] text-primary/35 shrink-0">ou</span>
          <hr className="flex-1 border-border-custom" />
        </div>

        {/* Google SSO — TODO: brancher OAuth */}
        <button
          type="button"
          className="w-full h-11 flex items-center justify-center gap-3 border border-border-custom rounded-lg text-[14px] text-primary font-medium hover:bg-primary/4 transition-colors duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.4 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.9 0 20.5-8.1 20.5-21 0-1.3-.2-2.7-.5-4z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.4 19 12 24 12c3.1 0 5.9 1.1 8.1 3l5.7-5.7C34.5 5.1 29.5 3 24 3 16.3 3 9.7 7.9 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 45c5.2 0 10-1.9 13.7-5.1l-6.3-5.3C29.5 36.4 26.9 37 24 37c-5.4 0-9.9-3.5-11.4-8.4l-6.5 5C9.5 40.9 16.3 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.5-2.4 4.5-4.6 5.9l6.3 5.3C40.6 36.1 44 30.6 44 24c0-1.4-.2-2.7-.4-4z" />
          </svg>
          Continuer avec Google
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-[13px] text-primary/45">
        Pas encore de compte&nbsp;?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
