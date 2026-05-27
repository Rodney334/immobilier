'use client';

import { useState } from 'react';
import {
  X, User, DoorOpen, Calendar, Wallet, CreditCard,
  Pencil, XCircle, FileDown, RefreshCw, Loader2,
} from 'lucide-react';
import { leaseService } from '@/lib/services/lease.service';
import { Badge }        from '@/components/ui/Badge';
import type { Lease, LeaseStatus, PaymentFrequency } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeaseStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active:     { label: 'Actif',      variant: 'success' },
  pending:    { label: 'En attente', variant: 'warning' },
  expired:    { label: 'Expiré',     variant: 'neutral' },
  terminated: { label: 'Résilié',    variant: 'danger'  },
};

const FREQ_LABELS: Record<PaymentFrequency, string> = {
  monthly:   'Mensuel',
  'bi-weekly': 'Bimensuel',
  weekly:    'Hebdomadaire',
  quarterly: 'Trimestriel',
  annual:    'Annuel',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' XOF';
}
function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function DetailRow({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E5E7EB] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-primary/50" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-0.5">{label}</p>
        <div className="text-[13px] text-primary">{value}</div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default', loading }: {
  icon: React.ElementType; label: string; onClick: () => void;
  variant?: 'default' | 'danger'; loading?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium
                 transition-colors disabled:opacity-50
                 ${variant === 'danger'
                   ? 'text-danger hover:bg-danger/5 border border-danger/20 hover:border-danger/40'
                   : 'text-primary hover:bg-primary/4 border border-[#E5E7EB] hover:border-primary/30'
                 }`}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Tab = 'details' | 'actions';

type Props = {
  lease:       Lease;
  onClose:     () => void;
  onEdit:      (l: Lease) => void;
  onTerminate: (l: Lease) => void;
  onUpdated:   (l: Lease) => void;
};

export function LeaseDetailPanel({ lease, onClose, onEdit, onTerminate, onUpdated }: Props) {
  const [activeTab,        setActiveTab]        = useState<Tab>('details');
  const [generatingScheds, setGeneratingScheds] = useState(false);
  const [downloadingPdf,   setDownloadingPdf]   = useState(false);

  const cfg        = STATUS_CONFIG[lease.status];
  const tenantName = lease.tenant?.fullName
    ?? (lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : lease.tenantId);
  const unitLabel  = lease.unit ? `Local ${lease.unit.unitNumber}` : lease.unitId;
  const daysLeft   = daysUntil(lease.endDate);
  const isActive   = lease.status === 'active';

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const blob = await leaseService.downloadContractPdf(lease.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `contrat-${lease.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silencieux */ }
    finally { setDownloadingPdf(false); }
  }

  async function handleGenerateSchedules() {
    setGeneratingScheds(true);
    try {
      await leaseService.generateSchedules(lease.id);
    } catch { /* silencieux */ }
    finally { setGeneratingScheds(false); }
  }

  return (
    <aside
      className="flex flex-col w-[420px] shrink-0 bg-surface border-l border-[#E5E7EB]
                 h-screen sticky top-0 overflow-hidden"
      aria-label={`Contrat : ${tenantName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#E5E7EB] shrink-0">
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {isActive && daysLeft <= 30 && (
              <Badge variant="warning" dot>{daysLeft}j restants</Badge>
            )}
          </div>
          <h2 className="font-semibold text-[17px] text-primary truncate">{tenantName}</h2>
          <p className="text-[12px] text-primary/40 mt-0.5">{unitLabel}</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/40
                     hover:text-primary hover:bg-primary/6 transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] shrink-0">
        {(['details', 'actions'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[13px] font-medium transition-colors
              ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-primary/40 hover:text-primary'}`}>
            {tab === 'details' ? 'Détails' : 'Actions'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5">

        {/* Details tab */}
        {activeTab === 'details' && (
          <>
            <DetailRow icon={User}     label="Locataire"    value={tenantName} />
            <DetailRow icon={DoorOpen} label="Local"        value={unitLabel} />
            <DetailRow icon={Wallet}   label="Loyer mensuel"
              value={<span className="tabular-nums">{formatXOF(lease.rentAmount)}</span>} />
            {lease.depositAmount != null && (
              <DetailRow icon={CreditCard} label="Caution"
                value={<span className="tabular-nums">{formatXOF(lease.depositAmount)}</span>} />
            )}
            <DetailRow icon={RefreshCw}  label="Fréquence"   value={FREQ_LABELS[lease.paymentFrequency]} />
            <DetailRow icon={Calendar}   label="Début"       value={formatDate(lease.startDate)} />
            <DetailRow icon={Calendar}   label="Fin"
              value={
                <span className={isActive && daysLeft <= 30 ? 'text-secondary font-semibold' : ''}>
                  {formatDate(lease.endDate)}
                  {isActive && daysLeft > 0 && ` (${daysLeft} j)`}
                </span>
              }
            />
            {lease.terminationDate && (
              <DetailRow icon={XCircle} label="Résilié le" value={formatDate(lease.terminationDate)} />
            )}
            {lease.terminationReason && (
              <div className="py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-1.5">
                  Motif de résiliation
                </p>
                <p className="text-[13px] text-primary/70">{lease.terminationReason}</p>
              </div>
            )}
          </>
        )}

        {/* Actions tab */}
        {activeTab === 'actions' && (
          <div className="py-4 space-y-2.5">
            <ActionButton icon={Pencil}    label="Modifier le contrat"        onClick={() => onEdit(lease)} />
            <ActionButton icon={FileDown}  label="Télécharger le PDF"         onClick={handleDownloadPdf}      loading={downloadingPdf} />
            <ActionButton icon={RefreshCw} label="Générer les échéances"      onClick={handleGenerateSchedules} loading={generatingScheds} />
            {isActive && (
              <ActionButton icon={XCircle} label="Résilier le contrat"        onClick={() => onTerminate(lease)} variant="danger" />
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
