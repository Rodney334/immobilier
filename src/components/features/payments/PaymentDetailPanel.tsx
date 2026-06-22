"use client";

import { useState } from "react";
import {
  X,
  User,
  CreditCard,
  Calendar,
  Hash,
  Wallet,
  Trash2,
  Download,
  Ban,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { paymentService } from "@/lib/services/payment.service";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Payment, PaymentStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  RECORDED: { label: "Enregistré", variant: "success" },
  REVERSED: { label: "Annulé", variant: "warning" },
  CANCELLED: { label: "Annulé", variant: "neutral" },
  failed: { label: "Échoué", variant: "danger" },
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virement bancaire",
  cash: "Espèces",
  check: "Chèque",
  mobile_money: "Mobile Money",
  other: "Autre",
};

const fmt = new Intl.NumberFormat("fr-FR");

function formatAmount(amount: string) {
  return `${fmt.format(Number(amount))} XOF`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-custom last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-primary/50" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-0.5">
          {label}
        </p>
        <p className="text-[13px] text-primary">{value}</p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  payment: Payment;
  onClose: () => void;
  onUpdate: (p: Payment) => void;
  onDelete: (p: Payment) => void;
};

export function PaymentDetailPanel({
  payment,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const config = STATUS_CONFIG[payment.status];
  const tenantName = payment.lease?.tenant?.fullName || "Locataire inconnu";
  const initials = payment.lease?.tenant
    ? `${payment.lease.tenant.firstName?.[0] ?? ""}${payment.lease.tenant.lastName?.[0] ?? ""}`.toUpperCase() ||
      "?"
    : "?";

  const canCancel =
    payment.status === "RECORDED" || payment.status === "REVERSED";

  async function handleDownloadReceipt() {
    setDownloading(true);
    try {
      const blob = await paymentService.downloadReceiptPdf(payment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-paiement-${payment.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencieux
    } finally {
      setDownloading(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      setCancelError("Le motif d'annulation est obligatoire.");
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await paymentService.cancel(payment.id, {
        reason: cancelReason.trim(),
      });
      onUpdate(res.data);
      setCancelOpen(false);
      setCancelReason("");
    } catch {
      setCancelError("Impossible d'annuler ce paiement.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <aside
        className="flex flex-col w-105 shrink-0 bg-surface border-l border-border-custom h-screen sticky top-0 overflow-hidden"
        aria-label={`Détails du paiement`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border-custom shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
            <div className="w-11 h-11 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
              <span className="text-[15px] font-semibold text-primary/60">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-[18px] text-primary truncate">
                {formatAmount(payment.amount)}
              </h2>
              <p className="text-[12px] text-primary/50 truncate mt-0.5">
                {tenantName}
              </p>
              <div className="mt-1">
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/6 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border-custom shrink-0">
          {payment.status === "RECORDED" && (
            <button
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-primary border border-border-custom hover:border-primary/30 hover:bg-primary/4 transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download size={13} aria-hidden="true" />
              )}
              Télécharger le reçu
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => {
                setCancelReason("");
                setCancelError(null);
                setCancelOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-secondary border border-secondary/20 hover:bg-secondary/5 transition-colors"
            >
              <Ban size={13} aria-hidden="true" /> Annuler
            </button>
          )}

          <button
            onClick={() => onDelete(payment)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-danger border border-danger/20 hover:border-danger/40 hover:bg-danger/5 transition-colors"
          >
            <Trash2 size={13} aria-hidden="true" /> Supprimer
          </button>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-5">
          <DetailRow icon={User} label="Locataire" value={tenantName} />
          <DetailRow
            icon={Wallet}
            label="Montant"
            value={
              <span className="font-semibold tabular-nums">
                {formatAmount(payment.amount)}
              </span>
            }
          />
          <DetailRow
            icon={Calendar}
            label="Date de paiement"
            value={
              payment.paymentDate ? formatDate(payment.paymentDate) : undefined
            }
          />
          <DetailRow
            icon={CreditCard}
            label="Méthode de paiement"
            value={
              payment.paymentMethod
                ? (METHOD_LABELS[payment.paymentMethod] ??
                  payment.paymentMethod)
                : undefined
            }
          />
          <DetailRow icon={Hash} label="Référence" value={payment.reference} />
          <DetailRow
            icon={Calendar}
            label="Enregistré le"
            value={formatDate(payment.createdAt)}
          />
          {payment.allocations && payment.allocations.length > 0 && (
            <div className="py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-2">
                Allocations ({payment.allocations.length})
              </p>
              <div className="space-y-2">
                {payment.allocations.map((alloc) => (
                  <div
                    key={alloc.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/3 border border-border-custom"
                  >
                    <span className="text-[12px] text-primary/60 font-mono truncate">
                      {/* {alloc.rentScheduleId.slice(0, 8)}… */}
                      {new Date(alloc.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[13px] font-semibold text-primary tabular-nums">
                      {fmt.format(Number(alloc.allocatedAmount))} XOF
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Cancel modal */}
      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Annuler ce paiement"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="h-10 px-5 bg-secondary text-white rounded-lg text-[14px] font-medium hover:bg-secondary/90 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {cancelling && <Loader2 size={14} className="animate-spin" />}
              Confirmer l&apos;annulation
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary/8 border border-secondary/20">
            <AlertTriangle
              size={15}
              className="text-secondary mt-0.5 shrink-0"
            />
            <p className="text-[13px] text-primary/70 leading-relaxed">
              L&apos;annulation d&apos;un paiement est irréversible. Les
              allocations associées seront également annulées.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Motif d&apos;annulation <span className="text-danger">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Expliquez la raison de l'annulation…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors resize-none"
            />
            {cancelError && (
              <p className="text-[12px] text-danger">{cancelError}</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
