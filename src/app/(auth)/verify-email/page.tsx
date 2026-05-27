import { Suspense } from 'react';
import VerifyEmailContent from './VerifyEmailContent';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/6 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-[14px] text-primary/50">Chargement...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
