import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export const metadata: Metadata = { title: 'Email envoyé' };

export default function ForgotPasswordSuccessPage() {
  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/6 flex items-center justify-center">
          <Mail size={28} className="text-primary/50" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-semibold text-[24px] text-primary tracking-tight">
          Vérifiez votre boîte mail
        </h1>
        <p className="text-[14px] text-primary/50 leading-relaxed max-w-xs mx-auto">
          Un lien de réinitialisation a été envoyé à votre adresse email.
          Pensez à vérifier vos spams.
        </p>
      </div>

      <Link
        href="/login"
        className="inline-flex items-center justify-center w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-[#263447] transition-colors duration-150"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
