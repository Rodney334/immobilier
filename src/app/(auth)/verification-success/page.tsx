import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Email vérifié' };

export default function VerificationSuccessPage() {
  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle size={28} className="text-success" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-semibold text-[24px] text-primary tracking-tight">
          Compte activé avec succès
        </h1>
        <p className="text-[14px] text-primary/50 leading-relaxed max-w-xs mx-auto">
          Votre adresse email a bien été vérifiée.
          Vous pouvez maintenant vous connecter.
        </p>
      </div>

      <Link
        href="/login"
        className="inline-flex items-center justify-center w-full h-12 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-[#263447] transition-colors duration-150"
      >
        Se connecter
      </Link>
    </div>
  );
}
