"use client";

import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  Minus,
} from "lucide-react";
import { depositService } from "@/lib/services/deposit.service";
import { leaseService } from "@/lib/services/lease.service";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type {
  Deposit,
  DepositStatus,
  Lease,
  AddDeductionPayload,
  RefundDepositPayload,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DepositStatus,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  HELD: { label: "Retenu", variant: "warning" },
  PARTIALLY_REFUNDED: { label: "Part. remboursé", variant: "neutral" },
  REFUNDED: { label: "Remboursé", variant: "success" },
};

function formatCurrency(n?: number) {
  if (n === undefined || n === null) return "—";
  return (
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) +
    " XOF"
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Add Deduction Modal ──────────────────────────────────────────────────────

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

function DeductionModal({
  leaseId,
  isOpen,
  onClose,
  onSaved,
}: {
  leaseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (d: Deposit) => void;
}) {
  type FormState = { error: string | null; success: boolean };

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const label = (formData.get("label") as string).trim();
      const amount = (formData.get("amount") as string).trim();
      const reason = (formData.get("reason") as string).trim();

      if (!label || !amount || Number(amount) <= 0) {
        return {
          error: "Libellé et montant (> 0) sont obligatoires.",
          success: false,
        };
      }

      const payload: AddDeductionPayload = {
        label,
        amount: Number(amount),
        reason: reason || undefined,
      };
      try {
        const res = await depositService.addDeduction(leaseId, payload);
        onSaved(res.data);
        onClose();
        return { error: null, success: true };
      } catch (err: unknown) {
        return {
          error: err instanceof Error ? err.message : "Erreur.",
          success: false,
        };
      }
    },
    { error: null, success: false },
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une déduction">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger"
          >
            {state.error}
          </div>
        )}
        <Input
          name="label"
          label="Libellé"
          placeholder="ex : Réparation fenêtre"
          required
        />
        <Input
          name="amount"
          type="number"
          label="Montant (XOF)"
          placeholder="ex : 25000"
          required
        />
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Motif (optionnel)
          </label>
          <textarea
            name="reason"
            rows={2}
            placeholder="Explication..."
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors"
          >
            Annuler
          </button>
          <SubmitButton label="Ajouter" />
        </div>
      </form>
    </Modal>
  );
}

// ─── Refund Modal ─────────────────────────────────────────────────────────────

function RefundModal({
  leaseId,
  maxAmount,
  isOpen,
  onClose,
  onSaved,
}: {
  leaseId: string;
  maxAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (d: Deposit) => void;
}) {
  type FormState = { error: string | null; success: boolean };

  const [state, formAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const refundedAmount = (formData.get("refundedAmount") as string).trim();
      const notes = (formData.get("notes") as string).trim();

      if (!refundedAmount || Number(refundedAmount) <= 0) {
        return {
          error: "Le montant remboursé doit être supérieur à 0.",
          success: false,
        };
      }
      if (Number(refundedAmount) > maxAmount) {
        return {
          error: `Le montant ne peut pas dépasser ${formatCurrency(maxAmount)}.`,
          success: false,
        };
      }

      const payload: RefundDepositPayload = {
        refundedAmount: Number(refundedAmount),
        notes: notes || undefined,
      };
      try {
        const res = await depositService.refund(leaseId, payload);
        onSaved(res.data);
        onClose();
        return { error: null, success: true };
      } catch (err: unknown) {
        return {
          error: err instanceof Error ? err.message : "Erreur.",
          success: false,
        };
      }
    },
    { error: null, success: false },
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rembourser la caution">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger"
          >
            {state.error}
          </div>
        )}
        <div className="px-4 py-3 rounded-lg bg-primary/5 border border-border-custom text-[13px] text-primary/70">
          Montant remboursable maximum :{" "}
          <span className="font-semibold text-primary">
            {formatCurrency(maxAmount)}
          </span>
        </div>
        <Input
          name="refundedAmount"
          type="number"
          label="Montant remboursé (XOF)"
          placeholder={`max ${maxAmount}`}
          required
        />
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Notes (optionnel)
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Informations sur le remboursement..."
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom hover:border-primary/30 transition-colors"
          >
            Annuler
          </button>
          <SubmitButton label="Rembourser" />
        </div>
      </form>
    </Modal>
  );
}

// ─── Deposit detail card ──────────────────────────────────────────────────────

function DepositDetail({
  deposit,
  onAddDeduction,
  onRefund,
  onDownloadPdf,
}: {
  deposit: Deposit;
  onAddDeduction: () => void;
  onRefund: () => void;
  onDownloadPdf: () => void;
}) {
  const [showDeductions, setShowDeductions] = useState(true);
  const sc = STATUS_CONFIG[deposit.status] ?? {
    label: deposit.status ?? "—",
    variant: "neutral" as const,
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-surface rounded-xl border border-border-custom p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[12px] text-primary/50 mb-1">Locataire</p>
            <p className="text-[15px] font-semibold text-primary">
              {/* {(deposit.lease?.tenant?.fullName ||
                `${deposit.lease?.tenant?.firstName ?? ""} ${deposit.lease?.tenant?.lastName ?? ""}`.trim()) ||
                "—"} */}
              {deposit.tenantName}
            </p>
            {/* {deposit?.unit && (
              <p className="text-[12px] text-primary/50 mt-0.5">
                Local {deposit.unit.unitNumber}
                {deposit.unit.property ? ` — ${deposit.unit.property.name}` : ""}
              </p>
            )} */}
          </div>
          <Badge variant={sc.variant}>{sc.label}</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Caution initiale",
              value: formatCurrency(deposit.depositAmount),
            },
            {
              label: "Déductions",
              value: formatCurrency(deposit.totalDeductions),
              negative: true,
            },
            {
              label: "Remboursé",
              value: formatCurrency(deposit.refundedAmount || 0),
            },
            {
              label: "Net remboursable",
              value: formatCurrency(deposit.refundableAmount),
              positive: true,
            },
          ].map((row, i) => (
            <div key={i}>
              <p className="text-[11px] text-primary/50 mb-0.5">{row.label}</p>
              <p
                className={`text-[16px] font-bold ${row.negative ? "text-danger" : row.positive ? "text-success" : "text-primary"}`}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAddDeduction}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border-custom text-[13px] font-medium text-primary/70 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <Minus size={14} />
          Ajouter une déduction
        </button>
        {deposit.status !== "REFUNDED" && deposit.refundableAmount! > 0 && (
          <button
            onClick={onRefund}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-success/10 border border-success/20 text-[13px] font-medium text-success hover:bg-success/20 transition-colors"
          >
            <ShieldCheck size={14} />
            Rembourser
          </button>
        )}
        <button
          onClick={onDownloadPdf}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border-custom text-[13px] font-medium text-primary/70 hover:text-primary hover:border-primary/30 transition-colors ml-auto"
        >
          <Download size={14} />
          Télécharger PDF
        </button>
      </div>

      {/* Déductions */}
      {deposit.deductions.length > 0 && (
        <div className="bg-surface rounded-xl border border-border-custom overflow-hidden">
          <button
            onClick={() => setShowDeductions(!showDeductions)}
            className="w-full flex items-center justify-between px-5 py-3 text-left"
          >
            <span className="text-[13px] font-semibold text-primary">
              Déductions ({deposit.deductions.length})
            </span>
            {showDeductions ? (
              <ChevronUp size={15} className="text-primary/40" />
            ) : (
              <ChevronDown size={15} className="text-primary/40" />
            )}
          </button>
          {showDeductions && (
            <div className="divide-y divide-border-custom border-t border-border-custom">
              {deposit.deductions.map((d, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between px-5 py-3 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-primary truncate">
                      {d.label}
                    </p>
                    {d.reason && (
                      <p className="text-[12px] text-primary/50 truncate">
                        {d.reason}
                      </p>
                    )}
                    <p className="text-[11px] text-primary/40">
                      {formatDate(d.createdAt)}
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold text-danger shrink-0">
                    -{formatCurrency(d.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* {deposit.refundNotes && (
        <div className="px-4 py-3 rounded-lg bg-success/5 border border-success/20 text-[13px] text-primary/70">
          <span className="font-medium">Note remboursement :</span> {deposit.refundNotes}
          {deposit.refundedAt && <span className="text-primary/40"> · {formatDate(deposit.refundedAt)}</span>}
        </div>
      )} */}
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function DepositsClient() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>("");
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [loadingLeases, setLoadingLeases] = useState(true);
  const [loadingDeposit, setLoadingDeposit] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    leaseService
      .getAll({ limit: 200 })
      .then((res) => setLeases(res.data))
      .catch(() => {})
      .finally(() => setLoadingLeases(false));
  }, []);

  useEffect(() => {
    if (!selectedLeaseId) {
      setDeposit(null);
      return;
    }
    setLoadingDeposit(true);
    setDepositError(null);
    depositService
      .getByLease(selectedLeaseId)
      .then((res) => setDeposit(res.data))
      .catch((err) => {
        setDeposit(null);
        setDepositError(
          err instanceof Error
            ? err.message
            : "Impossible de charger la garantie.",
        );
      })
      .finally(() => setLoadingDeposit(false));
  }, [selectedLeaseId]);

  const handleDownloadPdf = async () => {
    if (!selectedLeaseId) return;
    setDownloading(true);
    try {
      const blob = await depositService.downloadPdf(selectedLeaseId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `garantie-${selectedLeaseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors du téléchargement.");
    } finally {
      setDownloading(false);
    }
  };

  const leaseName = (l: Lease) => {
    const tenant =
      l.tenant?.fullName ??
      `${l.tenant?.firstName ?? ""} ${l.tenant?.lastName ?? ""}`.trim();
    const unit = l.unit ? `Local ${l.unit.unitNumber}` : "";
    return (
      [tenant, unit].filter(Boolean).join(" — ") || l.contractNumber || l.id
    );
  };

  return (
    <div className="min-h-full bg-bg">
      {/* Header */}
      <div className="ep-topbar" style={{ paddingBottom: 20 }}>
        <div>
          <p className="ep-eyebrow">Gestion locative</p>
          <h1 className="ep-page-title">Garanties / Dépôts</h1>
        </div>
        <div className="ep-topbar-actions">
          <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
            <ShieldCheck size={18} className="text-success" />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 lg:px-6 space-y-6">
        {/* Lease selector */}
        <div className="bg-surface rounded-xl border border-border-custom p-5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60 mb-2">
            Sélectionner un contrat de bail
          </label>
          {loadingLeases ? (
            <div className="flex items-center gap-2 h-11 text-[13px] text-primary/40">
              <Loader2 size={14} className="animate-spin" /> Chargement...
            </div>
          ) : (
            <select
              value={selectedLeaseId}
              onChange={(e) => setSelectedLeaseId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="">— Choisir un bail —</option>
              {leases.map((l, i) => (
                <option key={i} value={l.id}>
                  {leaseName(l)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content */}
        {!selectedLeaseId && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ShieldCheck size={36} className="text-primary/15" />
            <p className="text-[14px] text-primary/40">
              Sélectionnez un contrat pour voir la garantie
            </p>
          </div>
        )}

        {selectedLeaseId && loadingDeposit && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary/40" size={28} />
          </div>
        )}

        {selectedLeaseId && !loadingDeposit && depositError && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertTriangle size={28} className="text-danger/50" />
            <p className="text-[14px] text-primary/60">{depositError}</p>
          </div>
        )}

        {selectedLeaseId && !loadingDeposit && deposit && (
          <DepositDetail
            deposit={deposit}
            onAddDeduction={() => setDeductionModalOpen(true)}
            onRefund={() => setRefundModalOpen(true)}
            onDownloadPdf={handleDownloadPdf}
          />
        )}
      </div>

      {/* Modals */}
      {selectedLeaseId && (
        <>
          <DeductionModal
            leaseId={selectedLeaseId}
            isOpen={deductionModalOpen}
            onClose={() => setDeductionModalOpen(false)}
            onSaved={(d) => setDeposit(d)}
          />
          <RefundModal
            leaseId={selectedLeaseId}
            maxAmount={deposit?.refundableAmount ?? 0}
            isOpen={refundModalOpen}
            onClose={() => setRefundModalOpen(false)}
            onSaved={(d) => setDeposit(d)}
          />
        </>
      )}
    </div>
  );
}
