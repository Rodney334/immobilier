"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MailOpen, Loader2, CheckCircle } from "lucide-react";
import { authService } from "@/lib/services/auth.service";

type ResendStatus = "idle" | "sending" | "sent";

export default function CheckEmailPage() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const email         = searchParams.get("email") ?? "";

  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");

  async function handleResend() {
    if (!email || resendStatus === "sending" || resendStatus === "sent") return;
    setResendStatus("sending");
    try {
      // Réponse volontairement neutre (anti-énumération) — on affiche toujours "envoyé"
      await authService.resendVerification({ email });
    } catch {
      // Neutre côté client aussi : on affiche "envoyé" même en cas d'erreur
    } finally {
      setResendStatus("sent");
    }
  }

  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/6 flex items-center justify-center">
          <MailOpen size={28} className="text-primary/50" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-semibold text-[24px] text-primary tracking-tight">
          Vérifiez votre boîte mail
        </h1>
        <p className="text-[14px] text-primary/50 leading-relaxed max-w-xs mx-auto">
          Un lien de confirmation a été envoyé
          {email ? (
            <> à <span className="font-medium text-primary/70">{email}</span></>
          ) : (
            " à votre adresse email"
          )}
          . Cliquez dessus pour activer votre compte. Pensez à vérifier vos spams.
        </p>
      </div>

      {/* Renvoi de l'email */}
      {email && (
        <div className="space-y-3">
          {resendStatus === "sent" ? (
            <div className="flex items-center justify-center gap-2 text-[13px] text-success">
              <CheckCircle size={15} aria-hidden="true" />
              Un nouvel email a été envoyé.
            </div>
          ) : (
            <p className="text-[13px] text-primary/40">
              Vous n&apos;avez pas reçu l&apos;email&nbsp;?{" "}
              <button
                onClick={handleResend}
                disabled={resendStatus === "sending"}
                className="font-medium text-secondary hover:text-[#C8935E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                {resendStatus === "sending" && (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                )}
                Renvoyer
              </button>
            </p>
          )}
        </div>
      )}

      <Link
        href="/login"
        className="inline-flex items-center justify-center w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-[#263447] transition-colors duration-150"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
