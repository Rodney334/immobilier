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
  Download,
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
  onDownloadReceipt,
}: {
  payment: Payment;
  onEdit: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
  onDownloadReceipt: () => void;
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
          <div className="absolute right-0 top-8 z-20 w-52 bg-white rounded-lg shadow-lg border border-border-custom py-1 text-[13px]">
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors"
            >
              Modifier
            </button>
            {!alreadyRecorded && (
              <button
                onClick={() => { setOpen(false); onMarkPaid(); }}
                className="w-full text-left px-4 py-2 hover:bg-success/6 text-success transition-colors flex items-center gap-2"
              >
                <CheckCircle size={12} /> Marquer comme payé
              </button>
            )}
            {alreadyRecorded && (
              <button
                onClick={() => { setOpen(false); onDownloadReceipt(); }}
                className="w-full text-left px-4 py-2 hover:bg-primary/4 text-primary/70 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Download size={12} /> Télécharger le reçu
              </button>
            )}
            <div className="my-1 border-t border-border-custom" />
            <button
              onClick={() => { setOpen(false); onDelete(); }}
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

// ─── Mobile card ─────────────────────────────────────────────────────────────

function PaymentCard({
  payment,
  onClick,
  onEdit,
  onMarkPaid,
  onDelete,
  onDownloadReceipt,
}: {
  payment: Payment;
  onClick: () => void;
  onEdit: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
  onDownloadReceipt: () => void;
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
    <div
      onClick={onClick}
      className="bg-surface border border-border-custom rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-semibold text-primary/60">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-primary truncate">{tenantName}</p>
            <p className="text-[12px] text-primary/50 truncate">{payment.reference ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <PaymentRowActions
            payment={payment}
            onEdit={onEdit}
            onMarkPaid={onMarkPaid}
            onDelete={onDelete}
            onDownloadReceipt={onDownloadReceipt}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Montant</p>
          <p className="text-[12px] font-semibold text-primary tabular-nums">{formatAmount(parseFloat(payment.amount))}</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Méthode</p>
          <p className="text-[12px] text-primary/70">{payment.paymentMethod ? (METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod) : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Référence</p>
          <p className="text-[12px] text-primary/70 font-mono">{payment.reference ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Date</p>
          <p className="text-[12px] text-primary/70 tabular-nums">{formatDate(payment.paymentDate!)}</p>
        </div>
      </div>
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
  onDownloadReceipt,
}: {
  payment: Payment;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
  onDownloadReceipt: () => void;
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
      className="ep-tr"
      onClick={onClick}
      style={{ background: selected ? "rgba(193,98,45,0.06)" : undefined }}
    >
      <td className="ep-td">
        <div className="ep-person">
          <div className="ep-avatar">{initials}</div>
          <div className="ep-person-name">{tenantName}</div>
        </div>
      </td>
      <td className="ep-td ep-amount">{formatAmount(parseFloat(payment.amount))}</td>
      <td className="ep-td" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
        {payment.paymentMethod ? (METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod) : "—"}
      </td>
      <td className="ep-td ep-mono">{payment.reference ?? "—"}</td>
      <td className="ep-td ep-mono">{formatDate(payment.paymentDate!)}</td>
      <td className="ep-td"><Badge variant={cfg.variant} stamp>{cfg.label}</Badge></td>
      <td className="ep-td" style={{ width: 40 }} onClick={(e) => e.stopPropagation()}>
        <PaymentRowActions
          payment={payment}
          onEdit={onEdit}
          onMarkPaid={onMarkPaid}
          onDelete={onDelete}
          onDownloadReceipt={onDownloadReceipt}
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
    <div className="ep-pagination">
      <span>{from}–{to} sur {total} paiement{total > 1 ? "s" : ""}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button className="ep-page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1}><ChevronLeft size={13} /></button>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "0 8px" }}>Page {page} / {totalPages}</span>
        <button className="ep-page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages}><ChevronRight size={13} /></button>
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

  async function handleDownloadReceipt(p: Payment) {
    try {
      const blob = await paymentService.downloadReceiptPdf(p.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-${p.reference ?? p.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "danger", title: "Impossible de télécharger le reçu", duration: 4000 });
    }
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
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Topbar */}
          <div className="ep-topbar" style={{ paddingBottom: 20 }}>
            <div>
              <p className="ep-eyebrow">Gestion locative</p>
              <h1 className="ep-page-title">Paiements</h1>
              {pagination && !loading && (
                <p className="ep-page-desc">{pagination.total} paiement{pagination.total > 1 ? "s" : ""} enregistré{pagination.total > 1 ? "s" : ""}</p>
              )}
            </div>
            <div className="ep-topbar-actions">
              <button className="ep-btn ep-btn-primary" onClick={() => setFormOpen(true)}>
                <Plus size={14} /> Enregistrer un paiement
              </button>
            </div>
          </div>

          {/* Filtres + recherche */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 32px 16px", flexWrap: "wrap" }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="ep-chip"
                data-active={statusFilter === opt.value ? "true" : "false"}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <div className="ep-search" style={{ marginLeft: "auto", minWidth: 220 }}>
              <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un locataire…" />
            </div>
          </div>

          {error && (
            <div style={{ margin: "0 32px 16px", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--rouge-soft)", border: "1px solid var(--rouge)", fontSize: 13, color: "var(--rouge)" }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Table */}
          <div style={{ flex: 1, overflow: "hidden", padding: "0 32px 32px", display: "flex", flexDirection: "column" }}>
            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
                <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
              </div>
            ) : payments.length === 0 ? (
              <div className="ep-panel" style={{ padding: 24 }}>
                <EmptyState
                  icon={CreditCard}
                  title="Aucun paiement"
                  description={statusFilter !== "all" ? "Aucun paiement avec ce statut." : "Enregistrez votre premier paiement."}
                  actionLabel={statusFilter === "all" ? "Enregistrer un paiement" : undefined}
                  onAction={statusFilter === "all" ? () => setFormOpen(true) : undefined}
                />
              </div>
            ) : (
              <>
                {/* Table desktop */}
                <div className="hidden lg:flex ep-panel" style={{ flex: 1, flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                  <table className="ep-table">
                    <thead>
                      <tr>
                        {["Locataire","Montant","Méthode","Référence","Date","Statut",""].map((h, i) => (
                          <th key={i} className="ep-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <PaymentRow
                          key={p.id}
                          payment={p}
                          selected={selected?.id === p.id}
                          onClick={() => setSelected((prev) => (prev?.id === p.id ? null : p))}
                          onEdit={() => setSelected(p)}
                          onMarkPaid={() => handleMarkPaid(p)}
                          onDelete={() => setDeleteTarget(p)}
                          onDownloadReceipt={() => handleDownloadReceipt(p)}
                        />
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {pagination && pagination.totalPages > 1 && (
                    <PaginationBar meta={pagination} onPage={setPage} />
                  )}
                </div>
                {/* Cards mobiles */}
                <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {payments.map((p) => (
                    <PaymentCard
                      key={p.id}
                      payment={p}
                      onClick={() =>
                        setSelected((prev) => (prev?.id === p.id ? null : p))
                      }
                      onEdit={() => setSelected(p)}
                      onMarkPaid={() => handleMarkPaid(p)}
                      onDelete={() => setDeleteTarget(p)}
                      onDownloadReceipt={() => handleDownloadReceipt(p)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
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
