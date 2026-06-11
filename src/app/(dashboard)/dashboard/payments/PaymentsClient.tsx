"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  CreditCard,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
} from "lucide-react";
import { paymentService } from "@/lib/services/payment.service";
import { useToast } from "@/components/ui/Toast";
import { PaymentDetailPanel } from "@/components/features/payments/PaymentDetailPanel";
import { PaymentFormModal } from "@/components/features/payments/PaymentFormModal";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Payment, PaymentStatus, PaginationMeta } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  RECORDED: { label: "Réussi", variant: "success" },
  REVERSED: { label: "En attente", variant: "warning" },
  CANCELLED: { label: "Annulé", variant: "neutral" },
  failed: { label: "Échoué", variant: "danger" },
};

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Virement",
  CASH: "Espèces",
  CHECK: "Chèque",
  MOBILE_MONEY: "Mobile Money",
  OTHER: "Autre",
};

const FILTER_OPTIONS: { label: string; value: PaymentStatus | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "Réussis", value: "RECORDED" },
  { label: "En attente", value: "REVERSED" },
  { label: "Annulés", value: "CANCELLED" },
  { label: "Échoués", value: "failed" },
];

const fmt = new Intl.NumberFormat("fr-FR");

function formatAmount(amount: number) {
  return `${fmt.format(amount)} XOF`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function PaymentRowActions({
  payment,
  onEdit,
  onMarkPaid,
  onDelete,
}: {
  payment: Payment;
  onEdit: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const alreadyRecorded = payment.status === "RECORDED";
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded-md flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/6 transition-colors"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]">
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors"
            >
              Modifier
            </button>
            {!alreadyRecorded && (
              <button
                onClick={() => {
                  setOpen(false);
                  onMarkPaid();
                }}
                className="w-full text-left px-4 py-2 hover:bg-success/6 text-success transition-colors flex items-center gap-2"
              >
                <CheckCircle size={12} /> Marquer comme payé
              </button>
            )}
            <div className="my-1 border-t border-border-custom" />
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full text-left px-4 py-2 hover:bg-danger/6 text-danger transition-colors"
            >
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function PaymentRow({
  payment,
  selected,
  onClick,
  onEdit,
  onMarkPaid,
  onDelete,
}: {
  payment: Payment;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CONFIG[payment.status];
  const tenant = payment.lease?.tenant;
  const tenantName = tenant
    ? (tenant.fullName ?? `${tenant.firstName} ${tenant.lastName}`)
    : "—";
  const initials = tenant
    ? `${tenant.firstName && tenant.firstName[0]}${tenant.lastName && tenant.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors duration-100
        ${
          selected
            ? "bg-secondary/8 border-l-2 border-l-secondary"
            : "hover:bg-primary/3 border-l-2 border-l-transparent"
        }`}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
            <span className="text-[12px] font-semibold text-primary/60">
              {initials}
            </span>
          </div>
          <p className="text-[13px] font-medium text-primary truncate">
            {tenantName}
          </p>
        </div>
      </td>
      <td className="px-4 py-3.5 text-[13px] font-semibold text-primary tabular-nums whitespace-nowrap">
        {formatAmount(parseFloat(payment.amount))}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-primary/60">
        {payment.paymentMethod
          ? (METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod)
          : "—"}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-primary/50 font-mono">
        {payment.reference ?? "—"}
      </td>
      <td className="px-4 py-3.5 text-[12px] text-primary/40 tabular-nums whitespace-nowrap">
        {formatDate(payment.paymentDate!)}
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </td>
      <td className="px-3 py-3.5">
        <PaymentRowActions
          payment={payment}
          onEdit={onEdit}
          onMarkPaid={onMarkPaid}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

function PaginationBar({
  meta,
  onPage,
}: {
  meta: PaginationMeta;
  onPage: (p: number) => void;
}) {
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border-custom bg-surface shrink-0">
      <p className="text-[12px] text-primary/40 tabular-nums">
        {from}–{to} sur {total} paiement{total > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-3 text-[13px] font-medium text-primary tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/50 hover:text-primary hover:bg-primary/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

export function PaymentsClient() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getAll({
        page,
        limit: PAGE_LIMIT,
        status: statusFilter !== "all" ? statusFilter : undefined,
        tenant: debouncedQ || undefined,
      });
      setPayments(res.data);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les paiements.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(p: Payment) {
    setPayments((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = p;
        return n;
      }
      return [p, ...prev];
    });
    if (selected?.id === p.id) setSelected(p);
    setFormOpen(false);
    load();
  }

  async function handleMarkPaid(p: Payment) {
    try {
      const res = await paymentService.update(p.id, { status: "RECORDED" });
      const updated = res.data;
      setPayments((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      if (selected?.id === updated.id) setSelected(updated);
      toast({
        variant: "success",
        title: "Paiement marqué comme payé",
        duration: 3000,
      });
    } catch {
      toast({
        variant: "danger",
        title: "Échec de la mise à jour",
        duration: 4000,
      });
    }
  }

  function handlePaymentUpdate(p: Payment) {
    setPayments((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    if (selected?.id === p.id) setSelected(p);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await paymentService.delete(deleteTarget.id);
      setPayments((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteError("Impossible de supprimer ce paiement.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-custom shrink-0">
            <div>
              <h1 className="font-semibold text-[20px] text-primary">
                Paiements
              </h1>
              {pagination && !loading && (
                <p className="text-[12px] text-primary/40 mt-0.5">
                  {pagination.total} paiement{pagination.total > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35 pointer-events-none"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un locataire…"
                  className="pl-9 pr-4 h-9 w-60 rounded-lg border border-border-custom bg-white text-[13px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
              <button
                onClick={() => setFormOpen(true)}
                className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors"
              >
                <Plus size={15} /> Enregistrer un paiement
              </button>
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border-custom bg-surface shrink-0 overflow-x-auto">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors
                  ${
                    statusFilter === opt.value
                      ? "bg-primary text-white"
                      : "bg-primary/6 text-primary/60 hover:bg-primary/10"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger shrink-0">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={22} className="animate-spin text-primary/30" />
              </div>
            ) : payments.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CreditCard}
                  title="Aucun paiement"
                  description={
                    statusFilter !== "all"
                      ? "Aucun paiement avec ce statut."
                      : "Enregistrez votre premier paiement."
                  }
                  actionLabel={
                    statusFilter === "all"
                      ? "Enregistrer un paiement"
                      : undefined
                  }
                  onAction={
                    statusFilter === "all" ? () => setFormOpen(true) : undefined
                  }
                />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-neutral">
                  <tr className="border-b border-border-custom">
                    {[
                      "Locataire",
                      "Montant",
                      "Méthode",
                      "Référence",
                      "Date",
                      "Statut",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom bg-surface">
                  {payments.map((p) => (
                    <PaymentRow
                      key={p.id}
                      payment={p}
                      selected={selected?.id === p.id}
                      onClick={() =>
                        setSelected((prev) => (prev?.id === p.id ? null : p))
                      }
                      onEdit={() => setSelected(p)}
                      onMarkPaid={() => handleMarkPaid(p)}
                      onDelete={() => setDeleteTarget(p)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <PaginationBar meta={pagination} onPage={setPage} />
          )}
        </div>

        {/* Right panel */}
        {selected && (
          <PaymentDetailPanel
            payment={selected}
            onClose={() => setSelected(null)}
            onUpdate={handlePaymentUpdate}
            onDelete={(p) => setDeleteTarget(p)}
          />
        )}
      </div>

      <PaymentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        title="Supprimer ce paiement ?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Supprimer définitivement
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[14px] text-primary/70 leading-relaxed">
            Vous êtes sur le point de supprimer le paiement de{" "}
            <span className="font-semibold text-primary">
              {deleteTarget
                ? new Intl.NumberFormat("fr-FR").format(
                    parseFloat(deleteTarget.amount),
                  ) + " XOF"
                : ""}
            </span>
            . Cette action est irréversible.
          </p>
          {deleteError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-[13px] text-danger">
              <AlertTriangle size={14} /> {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
