'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { leaseService } from '@/lib/services/lease.service';
import type { Lease } from '@/types';

type FormState = { error: string | null; success: boolean };

type Props = {
  lease:   Lease;
  isOpen:  boolean;
  onClose: () => void;
  onDone:  (l: Lease) => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium
                 hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center gap-2">
      {pending && <Loader2 size={14} className="animate-spin" />}
      Résilier le contrat
    </button>
  );
}

export function LeaseTerminateModal({ lease, isOpen, onClose, onDone }: Props) {
  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const terminationDate = formData.get('terminationDate') as string;
      const reason          = (formData.get('reason') as string).trim();

      if (!terminationDate) {
        return { error: 'La date de résiliation est obligatoire.', success: false };
      }

      try {
        const res = await leaseService.terminate(lease.id, { terminationDate, reason: reason || undefined });
        onDone(res.data);
        return { error: null, success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
        return { error: msg, success: false };
      }
    },
    { error: null, success: false },
  );

  const tenantName = lease.tenant?.fullName
    ?? (lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : lease.tenantId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Résilier le contrat"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60
                       hover:text-primary border border-[#E5E7EB] transition-colors">
            Annuler
          </button>
          <SubmitButton />
        </div>
      }>
      <form action={formAction} className="space-y-4">
        <div className="px-4 py-3 rounded-lg bg-danger/5 border border-danger/15">
          <p className="text-[13px] text-danger leading-relaxed">
            Vous êtes sur le point de résilier le contrat de{' '}
            <span className="font-semibold">{tenantName}</span>.
            Cette action est irréversible et clôturera les échéances futures.
          </p>
        </div>

        {state.error && (
          <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8
                                       border border-danger/20 text-[13px] text-danger">
            <AlertTriangle size={14} /> {state.error}
          </div>
        )}

        <Input name="terminationDate" type="date" label="Date de résiliation" required
          defaultValue={new Date().toISOString().slice(0, 10)} />

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Motif (optionnel)
          </label>
          <textarea name="reason" rows={3} placeholder="Ex : Fin de bail, départ anticipé, non-paiement…"
            className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[14px]
                       text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2
                       focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors" />
        </div>
      </form>
    </Modal>
  );
}
