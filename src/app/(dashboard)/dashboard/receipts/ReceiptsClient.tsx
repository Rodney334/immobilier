"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Receipt,
  Loader2,
  AlertTriangle,
  Download,
  Eye,
  FileEdit,
  Ban,
} from "lucide-react";
import { receiptService } from "@/lib/services/receipt.service";
import { paymentService } from "@/lib/services/payment.service";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowActionMenu } from "@/components/ui/RowActionMenu";
import { PaginationBar } from "@/components/ui/PaginationBar";
import type {
  Receipt as ReceiptType,
  ReceiptStatus,
  PaginationMeta,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReceiptStatus,
  { label: string; dot: string; row: string }
> = {
  GENERATED: { label: "Genere", dot: "bg-success", row: "" },
  CANCELLED: { label: "Annule", dot: "bg-danger", row: "bg-danger/6" },
};

const STATUS_FILTERS: { value: ReceiptStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "GENERATED", label: "Genere" },
  { value: "CANCELLED", label: "Annule" },
];

const MONTHS_FR = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

function formatAmount(v: string | number) {
  return new Intl.NumberFormat("fr-FR").format(Number(v)) + " FCFA";
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ReceiptStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
      <span className="text-[12px] text-primary/70">{cfg.label}</span>
    </span>
  );
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function ReceiptRowActions({
  receipt,
  onViewDetails,
  onEditNotes,
  onDownload,
  onCancel,
}: {
  receipt: ReceiptType;
  onViewDetails: () => void;
  onEditNotes: () => void;
  onDownload: () => void;
  onCancel: () => void;
}) {
  const isCancelled = receipt.status === "CANCELLED";

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Download rapide */}
      {!isCancelled && (
        <button
          onClick={onDownload}
          title="Télécharger PDF"
          className="w-7 h-7 rounded-md flex items-center justify-center text-primary/35 hover:text-primary hover:bg-primary/6 transition-colors"
        >
          <Download size={13} />
        </button>
      )}

      {/* Menu ⋮ */}
      <RowActionMenu
        width={208}
        items={[
          { label: "Voir les détails", icon: <Eye size={13} />, onClick: onViewDetails },
          { label: "Modifier les notes", icon: <FileEdit size={13} />, onClick: onEditNotes },
          { label: "Télécharger PDF", icon: <Download size={13} />, onClick: onDownload },
          { label: "Annuler le reçu", icon: <Ban size={13} />, onClick: onCancel, variant: "danger", dividerBefore: true, hidden: isCancelled },
        ]}
      />
    </div>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function ReceiptCard({
  receipt,
  onClick,
  onViewDetails,
  onEditNotes,
  onDownload,
  onCancel,
}: {
  receipt: ReceiptType;
  onClick: () => void;
  onViewDetails: () => void;
  onEditNotes: () => void;
  onDownload: () => void;
  onCancel: () => void;
}) {
  const tenantName =
    (receipt.tenant?.fullName ??
      `${receipt.tenant?.firstName ?? ""} ${receipt.tenant?.lastName ?? ""}`.trim()) ||
    "—";
  const date = receipt.receiptDate ?? receipt.issuedAt ?? "";

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border-custom rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-primary font-mono truncate">{receipt.receiptNumber ?? "—"}</p>
          <p className="text-[12px] text-primary/50 truncate">{tenantName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusDot status={receipt.status} />
          <ReceiptRowActions
            receipt={receipt}
            onViewDetails={onViewDetails}
            onEditNotes={onEditNotes}
            onDownload={onDownload}
            onCancel={onCancel}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Montant</p>
          <p className="text-[12px] font-semibold text-primary tabular-nums">{receipt.amount ? formatAmount(receipt.amount) : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Date</p>
          <p className="text-[12px] text-primary/70 tabular-nums">{date ? formatDate(date) : "—"}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Detail panel (slide-in) ──────────────────────────────────────────────────

function ReceiptDetailPanel({
  receipt,
  onClose,
  onEditNotes,
  onCancel,
  onDownload,
}: {
  receipt: ReceiptType;
  onClose: () => void;
  onEditNotes: () => void;
  onCancel: () => void;
  onDownload: () => void;
}) {
  const cfg = STATUS_CONFIG[receipt.status];
  const tenantName =
    (receipt.tenant?.fullName ??
      `${receipt.tenant?.firstName ?? ""} ${receipt.tenant?.lastName ?? ""}`.trim()) ||
    "—";
  const contractRef =
    receipt.lease?.contractNumber ?? receipt.leaseId?.slice(-8) ?? "—";
  const date = receipt.receiptDate ?? receipt.issuedAt ?? receipt.createdAt;

  return (
    <aside className="flex flex-col w-100 shrink-0 bg-surface border-l border-border-custom h-screen sticky top-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border-custom shrink-0">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40 mb-1">
            {receipt.receiptNumber ?? "—"}
          </p>
          <h2 className="font-semibold text-[18px] text-primary truncate">
            {formatAmount(receipt.amount)}
          </h2>
          <p className="text-[12px] text-primary/50 mt-0.5">{tenantName}</p>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/6">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/6 transition-colors shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-border-custom shrink-0">
        {receipt.status !== "CANCELLED" && (
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-primary border border-border-custom hover:bg-primary/4 transition-colors"
          >
            <Download size={13} /> Telecharger PDF
          </button>
        )}
        <button
          onClick={onEditNotes}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-primary border border-border-custom hover:bg-primary/4 transition-colors"
        >
          <FileEdit size={13} /> Modifier notes
        </button>
        {receipt.status !== "CANCELLED" && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-danger border border-danger/20 hover:bg-danger/5 transition-colors"
          >
            <Ban size={13} /> Annuler
          </button>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {[
          { label: "Numero de recu", value: receipt.receiptNumber ?? "—" },
          { label: "Locataire", value: tenantName },
          { label: "Contrat", value: contractRef },
          { label: "Montant", value: formatAmount(receipt.amount) },
          { label: "Date d emission", value: date ? formatDate(date) : "—" },
          { label: "Statut", value: cfg.label },
          { label: "Notes", value: receipt.notes || "—" },
          { label: "Cree le", value: formatDate(receipt.createdAt) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-start gap-3 py-3 border-b border-border-custom last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-0.5">
                {label}
              </p>
              <p className="text-[13px] text-primary">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

// ─── Main ─────────────────────────────────────────────────────────────────────

const now = new Date();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

export function ReceiptsClient() {
  const { toast } = useToast();

  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | "all">(
    "all",
  );
  const [month, setMonth] = useState<number | "">("");
  const [year, setYear] = useState<number | "">(now.getFullYear());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<ReceiptType | null>(null);

  // Modals
  const [notesTarget, setNotesTarget] = useState<ReceiptType | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<ReceiptType | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Stats
  const stats = {
    total: pagination?.total ?? receipts.length,
    generated: receipts.filter((r) => r.status === "GENERATED").length,
    cancelled: receipts.filter((r) => r.status === "CANCELLED").length,
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, month, year]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receiptService.getAll({
        page,
        limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedQ || undefined,
        month: month !== "" ? month : undefined,
        year: year !== "" ? year : undefined,
      });
      const list: ReceiptType[] = Array.isArray(res.data) ? res.data : [];
      setReceipts(list);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les recus.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, debouncedQ, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Handlers ──

  function handleDownload(r: ReceiptType) {
    toast({
      variant: "warning",
      title: "Telechargement en cours...",
      duration: 3000,
    });
    // Utilise la route paiement /api/v1/payments/:paymentId/receipt/pdf
    paymentService
      .downloadReceiptPdf(r.paymentId)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recu-${r.receiptNumber ?? r.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() =>
        toast({
          variant: "danger",
          title: "Echec du telechargement",
          duration: 4000,
        }),
      );
  }

  async function handleSaveNotes() {
    if (!notesTarget) return;
    setNotesSaving(true);
    try {
      const res = await receiptService.update(notesTarget.id, {
        notes: notesValue,
      });
      const updated = res.data;
      setReceipts((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      if (selected?.id === updated.id) setSelected(updated);
      setNotesTarget(null);
      toast({
        variant: "success",
        title: "Notes mises a jour",
        duration: 3000,
      });
    } catch {
      toast({
        variant: "danger",
        title: "Impossible de sauvegarder",
        duration: 4000,
      });
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await receiptService.cancel(cancelTarget.id);
      const updated = res.data;
      setReceipts((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      if (selected?.id === updated.id) setSelected(updated);
      setCancelTarget(null);
      toast({ variant: "success", title: "Recu annule", duration: 3000 });
    } catch {
      toast({
        variant: "danger",
        title: "Impossible d annuler ce recu",
        duration: 4000,
      });
    } finally {
      setCancelling(false);
    }
  }

  function openEditNotes(r: ReceiptType) {
    setNotesTarget(r);
    setNotesValue(r.notes ?? "");
  }

  // ── Month/Year label ──
  const monthYearLabel =
    month !== "" && year !== ""
      ? `${MONTHS_FR[(month as number) - 1]} ${year}`
      : year !== ""
        ? String(year)
        : "Toutes periodes";

  return (
    <>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* List column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="ep-topbar" style={{ paddingBottom: 20 }}>
            <div>
              <p className="ep-eyebrow">Gestion locative</p>
              <h1 className="ep-page-title">Recus</h1>
            </div>
            <div className="ep-topbar-actions">
              <div className="ep-search">
                <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chercher un recu..."
                />
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="px-6 py-2.5 border-b border-border-custom bg-surface shrink-0 flex flex-wrap items-center gap-3">
            {/* Status pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-primary/40 mr-1">
                Statut :
              </span>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className="ep-chip"
                  data-active={statusFilter === f.value ? "true" : "false"}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border-custom" />

            {/* Mois */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-primary/40">
                Mois/Annee :
              </span>
              <select
                value={month}
                onChange={(e) =>
                  setMonth(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="h-8 px-2 rounded-lg border border-border-custom text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value="">Tous</option>
                {MONTHS_FR.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) =>
                  setYear(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="h-8 px-2 rounded-lg border border-border-custom text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value="">Toutes</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {(month !== "" || year !== now.getFullYear()) && (
                <button
                  onClick={() => {
                    setMonth("");
                    setYear(now.getFullYear());
                  }}
                  className="text-[12px] text-primary/40 hover:text-primary transition-colors"
                >
                  Effacer
                </button>
              )}
              {(month !== "" || year !== "") && (
                <span className="text-[12px] text-primary/50 font-medium">
                  {monthYearLabel}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div style={{ margin: "0 32px 16px", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--rouge-soft)", border: "1px solid var(--rouge)", fontSize: 13, color: "var(--rouge)" }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={22} className="animate-spin text-primary/30" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Receipt}
                  title="Aucun recu"
                  description={
                    statusFilter !== "all"
                      ? "Aucun recu pour ce statut."
                      : "Les recus seront generes automatiquement lors des paiements."
                  }
                />
              </div>
            ) : (
              <>
                {/* Table desktop */}
                <div className="hidden lg:block px-4 lg:px-6 py-3">
                  <div className="ep-panel">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border-custom">
                        {[
                          "N° RECU",
                          "LOCATAIRE",
                          "BAIL",
                          "MONTANT",
                          "DATE EMISSION",
                          "STATUT",
                          "",
                        ].map((h, i) => (
                          <th
                            key={i}
                            className="ep-th"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {receipts.map((r) => {
                        const cfg = STATUS_CONFIG[r.status];
                        const tenantName =
                          (r.tenant?.fullName ??
                            `${r.tenant?.firstName ?? ""} ${r.tenant?.lastName ?? ""}`.trim()) ||
                          "—";
                        const contractRef =
                          r.lease?.contractNumber ??
                          (r.leaseId ? r.leaseId.slice(-8) : "—");
                        const date = r.receiptDate ?? r.issuedAt ?? "";
                        const isSelected = selected?.id === r.id;

                        return (
                          <tr
                            key={r.id}
                            onClick={() =>
                              setSelected((p) => (p?.id === r.id ? null : r))
                            }
                            className={`ep-tr ${cfg.row ?? ""}`}
                            style={isSelected ? { background: "var(--secondary-soft)", borderLeft: "2px solid var(--secondary)" } : undefined}
                          >
                            <td className="ep-td ep-mono font-medium text-primary/80 whitespace-nowrap">
                              {r.receiptNumber ?? "—"}
                            </td>
                            <td className="ep-td font-medium text-primary max-w-40 truncate">
                              {tenantName}
                            </td>
                            <td className="ep-td ep-mono text-primary/60">
                              {contractRef}
                            </td>
                            <td className="ep-td ep-mono ep-amount whitespace-nowrap">
                              {r.amount ? formatAmount(r.amount) : "—"}
                            </td>
                            <td className="ep-td ep-mono text-primary/50 tabular-nums whitespace-nowrap">
                              {date ? formatDate(date) : "—"}
                            </td>
                            <td className="ep-td">
                              <StatusDot status={r.status} />
                            </td>
                            <td className="ep-td">
                              <ReceiptRowActions
                                receipt={r}
                                onViewDetails={() => setSelected(r)}
                                onEditNotes={() => openEditNotes(r)}
                                onDownload={() => handleDownload(r)}
                                onCancel={() => setCancelTarget(r)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
                {/* Cards mobiles */}
                <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {receipts.map((r) => (
                    <ReceiptCard
                      key={r.id}
                      receipt={r}
                      onClick={() =>
                        setSelected((p) => (p?.id === r.id ? null : r))
                      }
                      onViewDetails={() => setSelected(r)}
                      onEditNotes={() => openEditNotes(r)}
                      onDownload={() => handleDownload(r)}
                      onCancel={() => setCancelTarget(r)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <PaginationBar
            total={pagination?.total ?? 0}
            page={page}
            limit={limit}
            itemLabel="reçus"
            onPage={setPage}
            onLimit={(l) => { setLimit(l); setPage(1); }}
          />
        </div>

        {/* Detail panel */}
        {selected && (
          <ReceiptDetailPanel
            receipt={selected}
            onClose={() => setSelected(null)}
            onEditNotes={() => openEditNotes(selected)}
            onDownload={() => handleDownload(selected)}
            onCancel={() => setCancelTarget(selected)}
          />
        )}
      </div>

      {/* Modal : modifier les notes */}
      <Modal
        isOpen={!!notesTarget}
        onClose={() => setNotesTarget(null)}
        title="Modifier les notes"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setNotesTarget(null)}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {notesSaving && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] text-primary/60">
            Recu{" "}
            <span className="font-mono font-semibold text-primary">
              {notesTarget?.receiptNumber ?? "—"}
            </span>
          </p>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={4}
            placeholder="Ajouter des notes sur ce recu..."
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
          />
        </div>
      </Modal>

      {/* Modal : annuler le recu */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Annuler ce recu ?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {cancelling && <Loader2 size={14} className="animate-spin" />}
              Confirmer l&apos;annulation
            </button>
          </div>
        }
      >
        <p className="text-[14px] text-primary/70 leading-relaxed">
          Vous etes sur le point d&apos;annuler le recu{" "}
          <span className="font-mono font-semibold text-primary">
            {cancelTarget?.receiptNumber ?? "—"}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-primary">
            {cancelTarget ? formatAmount(cancelTarget.amount) : ""}
          </span>
          . Cette action est irreversible.
        </p>
      </Modal>
    </>
  );
}
