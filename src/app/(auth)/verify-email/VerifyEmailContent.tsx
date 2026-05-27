'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/lib/services/auth.service';
import { ApiError } from '@/types';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const email            = searchParams.get('email') ?? '';
    const verificationCode = searchParams.get('token') ?? searchParams.get('verificationCode') ?? '';

    if (!email || !verificationCode) {
      setErrorMessage('Lien de verification invalide ou incomplet.');
      setStatus('error');
      return;
    }

    authService
      .verifyEmail({ email, verificationCode })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/verification-success'), 1500);
      })
      .catch((err) => {
        const message =
          err instanceof ApiError
            ? err.message
            : 'La verification a echoue. Le lien est peut-etre expire.';
        setErrorMessage(message);
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 text-center">
      {status === 'loading' && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/6 flex items-center justify-center">
              <Loader2 size={28} className="text-primary/50 animate-spin" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="font-semibold text-[24px] text-primary tracking-tight">
              Verification en cours...
            </h1>
            <p className="text-[14px] text-primary/50">
              Merci de patienter quelques instants.
            </p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle size={28} className="text-success" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="font-semibold text-[24px] text-primary tracking-tight">
              Email verifie !
            </h1>
            <p className="text-[14px] text-primary/50">
              Redirection en cours...
            </p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
              <XCircle size={28} className="text-danger" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-semibold text-[24px] text-primary tracking-tight">
              Echec de la verification
            </h1>
            <p className="text-[14px] text-primary/50 leading-relaxed max-w-xs mx-auto">
              {errorMessage}
            </p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center justify-center w-full h-12
                       bg-primary text-white rounded-lg text-[15px] font-medium
                       hover:bg-[#263447] transition-colors duration-150"
          >
            Retour a la connexion
          </button>
        </>
      )}
    </div>
  );
}
