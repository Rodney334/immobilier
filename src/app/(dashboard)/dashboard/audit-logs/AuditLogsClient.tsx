"use client";

import { useEffect, useState, useCallback, useActionState, useRef } from "react";
import {
  Activity,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ClipboardList,
  Monitor,
  Wifi,
  User as UserIcon,
  Calendar,
  Tag,
  Hash,
} from "lucide-react";
import { auditLogService } from "@/lib/services/audit-log.service";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type {
  AuditLog,
  AuditAction,
  AuditEntityType,
  PaginationMeta,
  CreateAuditLogPayload,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIONS: AuditAction[] = [
  "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
  "ARCHIVE", "RESTORE", "TERMINATE", "TRANSFER",
  "CANCEL", "REFUND", "APPROVE", "REJECT",
];

const ENTITY_TYPES: AuditEntityType[] = [
  "USER", "PROPERTY", "UNIT", "TENANT", "LEASE",
  "PAYMENT", "RENT_SCHEDULE", "ADJUSTMENT", "RECEIPT",
  "INCIDENT", "DEPOSIT", "NEIGHBORHOOD",
];

type ActionVariant = "success" | "danger" | "warning" | "neutral" | "info";

const ACTION_CONFIG: Record<string, { label: string; variant: ActionVariant }> = {
  CREATE:    { label: "Création",     variant: "success" },
  UPDATE:    { label: "Modification", variant: "info" },
  DELETE:    { label: "Suppression",  variant: "danger" },
  LOGIN:     { label: "Connexion",    variant: "neutral" },
  LOGOUT:    { label: "Déconnexion",  variant: "neutral" },
  ARCHIVE:   { label: "Archivage",    variant: "warning" },
  RESTORE:   { label: "Restauration", variant: "info" },
  TERMINATE: { label: "Résiliation",  variant: "danger" },
  TRANSFER:  { label: "Transfert",    variant: "warning" },
  CANCEL:    { label: "Annulation",   variant: "warning" },
  REFUND:    { label: "Remboursement",variant: "info" },
  APPROVE:   { label: "Approbation",  variant: "success" },
  REJECT:    { label: "Rejet",        variant: "danger" },
};

const ENTITY_LABELS: Record<string, string> = {
  USER: "Utilisateur", PROPERTY: "Propriété", UNIT: "Local",
  TENANT: "Locataire", LEASE: "Contrat", PAYMENT: "Paiement",
  RENT_SCHEDULE: "Échéance", ADJUSTMENT: "Ajustement", RECEIPT: "Reçu",
  INCIDENT: "Incident", DEPOSIT: "Garantie", NEIGHBORHOOD: "Quartier",
};

function getActionCfg(action: string) {
  return ACTION_CONFIG[action] ?? { label: action, variant: "neutral" as ActionVariant };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── JSON diff viewer ─────────────────────────────────────────────────────────

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> | null | undefined }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold text-primary/40 uppercase tracking-[0.06em] mb-2">{label}</p>
      <pre className="bg-neutral border border-border-custom rounded-lg px-4 py-3 text-[12px] text-primary/80 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const [detail, setDetail] = useState<AuditLog>(log);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch full detail (includes oldValue/newValue)
    setLoading(true);
    auditLogService.getById(log.id || log._id)
      .then(res => { if (res.data) setDetail(res.data); })
      .catch(() => {/* keep log as-is */})
      .finally(() => setLoading(false));
  }, [log.id, log._id]);

  const cfg = getActionCfg(detail.action);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-custom shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-primary">Détail du log</h2>
          <p className="text-[12px] text-primary/40 mt-0.5">{fmtDate(detail.createdAt)}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-primary/40 hover:text-primary hover:bg-primary/6 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-primary/40" />
        </div>
      )}

      {!loading && (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral border border-border-custom rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Tag size={12} className="text-primary/40" />
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">Action</p>
              </div>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <div className="bg-neutral border border-border-custom rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={12} className="text-primary/40" />
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">Entité</p>
              </div>
              <p className="text-[13px] font-medium text-primary">
                {ENTITY_LABELS[detail.entityType] ?? detail.entityType}
              </p>
            </div>
            {detail.entityId && (
              <div className="bg-neutral border border-border-custom rounded-lg p-3 col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Hash size={12} className="text-primary/40" />
                  <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">ID de l'entité</p>
                </div>
                <p className="text-[12px] font-mono text-primary/70 truncate">{detail.entityId}</p>
              </div>
            )}
            <div className="bg-neutral border border-border-custom rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <UserIcon size={12} className="text-primary/40" />
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">Utilisateur</p>
              </div>
              <p className="text-[13px] font-medium text-primary">
                {detail.user?.name ?? detail.userId ?? "—"}
              </p>
              {detail.user?.email && (
                <p className="text-[11px] text-primary/40">{detail.user.email}</p>
              )}
            </div>
            <div className="bg-neutral border border-border-custom rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wifi size={12} className="text-primary/40" />
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">IP</p>
              </div>
              <p className="text-[12px] font-mono text-primary/70">{detail.ipAddress ?? "—"}</p>
            </div>
            <div className="bg-neutral border border-border-custom rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={12} className="text-primary/40" />
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">Date</p>
              </div>
              <p className="text-[12px] text-primary/70">{fmtDateShort(detail.createdAt)}</p>
            </div>
          </div>

          {/* User agent */}
          {detail.userAgent && (
            <div>
              <p className="text-[11px] font-semibold text-primary/40 uppercase tracking-[0.06em] mb-2">
                Navigateur / Agent
              </p>
              <div className="bg-neutral border border-border-custom rounded-lg px-4 py-3 flex items-start gap-2">
                <Monitor size={13} className="text-primary/40 mt-0.5 shrink-0" />
                <p className="text-[12px] text-primary/60 break-all leading-relaxed">{detail.userAgent}</p>
              </div>
            </div>
          )}

          {/* JSON blocks */}
          <JsonBlock label="Ancienne valeur" data={detail.oldValue} />
          <JsonBlock label="Nouvelle valeur" data={detail.newValue} />
          <JsonBlock label="Changements" data={detail.changes} />
        </div>
      )}
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────

type KVPair = { key: string; value: string };

function KVBuilder({ label, pairs, onChange }: {
  label: string;
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
}) {
  function addPair() { onChange([...pairs, { key: "", value: "" }]); }
  function removePair(i: number) { onChange(pairs.filter((_, idx) => idx !== i)); }
  function updatePair(i: number, field: "key" | "value", val: string) {
    onChange(pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[12px] font-medium text-primary/60">{label}</label>
        <button
          type="button"
          onClick={addPair}
          className="text-[11px] text-secondary hover:underline"
        >
          + Ajouter
        </button>
      </div>
      {pairs.length === 0 && (
        <p className="text-[12px] text-primary/30 italic">Aucun champ</p>
      )}
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Clé"
              value={p.key}
              onChange={e => updatePair(i, "key", e.target.value)}
              className="flex-1 h-8 px-3 text-[12px] bg-surface border border-border-custom rounded-lg outline-none focus:border-primary/30"
            />
            <input
              type="text"
              placeholder="Valeur"
              value={p.value}
              onChange={e => updatePair(i, "value", e.target.value)}
              className="flex-1 h-8 px-3 text-[12px] bg-surface border border-border-custom rounded-lg outline-none focus:border-primary/30"
            />
            <button
              type="button"
              onClick={() => removePair(i)}
              className="w-8 h-8 flex items-center justify-center text-primary/30 hover:text-danger transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [oldPairs, setOldPairs] = useState<KVPair[]>([]);
  const [newPairs, setNewPairs] = useState<KVPair[]>([]);

  function pairsToObj(pairs: KVPair[]): Record<string, unknown> {
    return Object.fromEntries(pairs.filter(p => p.key.trim()).map(p => [p.key.trim(), p.value]));
  }

  const [state, action, pending] = useActionState(async (
    _: { error?: string } | null,
    formData: FormData,
  ): Promise<{ error?: string } | null> => {
    const entityType = formData.get("entityType") as string;
    const entityId   = (formData.get("entityId") as string).trim();
    const act        = formData.get("action") as AuditAction;
    const ipAddress  = (formData.get("ipAddress") as string).trim();
    const userAgent  = (formData.get("userAgent") as string).trim();

    if (!entityType || !act) {
      return { error: "Type d'entité et action sont obligatoires." };
    }

    const payload: CreateAuditLogPayload = {
      entityType,
      action: act,
      entityId: entityId || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    };
    const old = pairsToObj(oldPairs);
    const nw  = pairsToObj(newPairs);
    if (Object.keys(old).length > 0) payload.oldValue = old;
    if (Object.keys(nw).length > 0)  payload.newValue = nw;

    try {
      await auditLogService.create(payload);
      onCreated();
      onClose();
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création.";
      return { error: msg };
    }
  }, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-danger text-[13px]">
          <AlertTriangle size={14} />
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-primary/60 mb-1.5">
            Type d'entité <span className="text-danger">*</span>
          </label>
          <select
            name="entityType"
            required
            className="w-full h-10 px-3 text-[13px] bg-surface border border-border-custom rounded-lg outline-none focus:border-primary/30 text-primary"
          >
            <option value="">— Sélectionner —</option>
            {ENTITY_TYPES.map(e => (
              <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-primary/60 mb-1.5">
            Action <span className="text-danger">*</span>
          </label>
          <select
            name="action"
            required
            className="w-full h-10 px-3 text-[13px] bg-surface border border-border-custom rounded-lg outline-none focus:border-primary/30 text-primary"
          >
            <option value="">— Sélectionner —</option>
            {ACTIONS.map(a => (
              <option key={a} value={a}>{getActionCfg(a).label} ({a})</option>
            ))}
          </select>
        </div>
      </div>

      <Input name="entityId" label="ID de l'entité (optionnel)" placeholder="ex: 64f3b2a1..." />

      <KVBuilder label="Ancienne valeur (oldValue)" pairs={oldPairs} onChange={setOldPairs} />
      <KVBuilder label="Nouvelle valeur (newValue)" pairs={newPairs} onChange={setNewPairs} />

      <div className="grid grid-cols-2 gap-3">
        <Input name="ipAddress" label="Adresse IP (optionnel)" placeholder="ex: 192.168.1.1" />
        <Input name="userAgent" label="User Agent (optionnel)" placeholder="ex: Mozilla/5.0..." />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-4 rounded-lg border border-border-custom text-[13px] font-medium text-primary hover:bg-primary/4 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 h-9 px-5 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] disabled:opacity-60 transition-colors"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          Créer le log
        </button>
      </div>
    </form>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AuditLogsClient() {
  const { toast } = useToast();

  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [meta, setMeta]           = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [page, setPage]           = useState(1);

  const [selectedLog, setSelectedLog]   = useState<AuditLog | null>(null);
  const [showCreate, setShowCreate]     = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: number, s: string, a: string, e: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditLogService.getAll({
        page: p,
        limit: 20,
        user: s || undefined,
        action: (a as AuditAction) || undefined,
        entityType: e || undefined,
      });
      setLogs(res.data ?? []);
      if (res.meta) setMeta(res.meta);
    } catch {
      setError("Impossible de charger les logs d'audit.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(1, search, filterAction, filterEntity);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, filterAction, filterEntity, load]);

  useEffect(() => {
    load(page, search, filterAction, filterEntity);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleCreated() {
    toast({ variant: "success", title: "Log créé avec succès." });
    load(1, search, filterAction, filterEntity);
  }

  const FILTER_ACTIONS = [
    { label: "Toutes les actions", value: "" },
    ...ACTIONS.map(a => ({ label: getActionCfg(a).label, value: a })),
  ];

  const FILTER_ENTITIES = [
    { label: "Toutes les entités", value: "" },
    ...ENTITY_TYPES.map(e => ({ label: ENTITY_LABELS[e] ?? e, value: e })),
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="ep-topbar" style={{ paddingBottom: 20 }}>
          <div>
            <p className="ep-eyebrow">Suivi</p>
            <h1 className="ep-page-title">Logs d&apos;audit</h1>
          </div>
          <div className="ep-topbar-actions">
            <button
              onClick={() => setShowCreate(true)}
              className="ep-btn ep-btn-primary"
            >
              <Plus size={15} />
              Créer un log
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-surface border-b border-border-custom shrink-0 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="ep-search">
            <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
            <input
              type="search"
              placeholder="Rechercher par utilisateur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Action filter */}
          <select
            value={filterAction}
            onChange={e => { setFilterAction(e.target.value as AuditAction | ""); setPage(1); }}
            className="h-9 px-3 bg-neutral border border-border-custom rounded-lg text-[13px] text-primary outline-none focus:border-primary/30"
          >
            {FILTER_ACTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Entity filter */}
          <select
            value={filterEntity}
            onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-neutral border border-border-custom rounded-lg text-[13px] text-primary outline-none focus:border-primary/30"
          >
            {FILTER_ENTITIES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {(filterAction || filterEntity || search) && (
            <button
              onClick={() => { setSearch(""); setFilterAction(""); setFilterEntity(""); setPage(1); }}
              className="flex items-center gap-1.5 h-9 px-3 text-[12px] text-primary/50 hover:text-primary border border-border-custom rounded-lg hover:bg-primary/4 transition-colors"
            >
              <X size={12} /> Effacer
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={20} className="animate-spin text-primary/40" />
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center gap-2 mx-6 mt-6 px-4 py-3 bg-danger/8 border border-danger/20 rounded-lg text-danger text-[13px]">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}
          {!loading && !error && logs.length === 0 && (
            <div className="flex items-center justify-center h-48">
              <EmptyState
                icon={Activity}
                title="Aucun log trouvé"
                description="Aucun événement ne correspond à vos filtres."
              />
            </div>
          )}
          {!loading && !error && logs.length > 0 && (
            <div className="px-4 lg:px-6 py-3">
            <div className="ep-panel">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border-custom">
                  <th className="ep-th w-40">
                    Date
                  </th>
                  <th className="ep-th">
                    Utilisateur
                  </th>
                  <th className="ep-th w-36">
                    Action
                  </th>
                  <th className="ep-th w-36">
                    Entité
                  </th>
                  <th className="ep-th hidden lg:table-cell">
                    ID Entité
                  </th>
                  <th className="ep-th hidden lg:table-cell w-32">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const cfg = getActionCfg(log.action);
                  const isActive = selectedLog?.id === log.id || selectedLog?._id === log._id;
                  return (
                    <tr
                      key={log.id || log._id}
                      onClick={() => setSelectedLog(isActive ? null : log)}
                      className="ep-tr"
                      style={isActive ? { background: "var(--primary-soft)" } : undefined}
                    >
                      <td className="ep-td ep-mono text-primary/50 whitespace-nowrap">
                        {fmtDate(log.createdAt)}
                      </td>
                      <td className="ep-td">
                        <p className="font-medium text-primary truncate max-w-[160px]">
                          {log.user?.name ?? log.userId ?? "—"}
                        </p>
                        {log.user?.email && (
                          <p className="text-[11px] text-primary/40 truncate max-w-[160px]">{log.user.email}</p>
                        )}
                      </td>
                      <td className="ep-td">
                        <Badge variant={cfg.variant} stamp>{cfg.label}</Badge>
                      </td>
                      <td className="ep-td text-primary/70">
                        {ENTITY_LABELS[log.entityType] ?? log.entityType}
                      </td>
                      <td className="ep-td hidden lg:table-cell">
                        {log.entityId ? (
                          <span className="ep-mono text-[12px] text-primary/50 truncate block max-w-[180px]">
                            {log.entityId}
                          </span>
                        ) : (
                          <span className="text-primary/25">—</span>
                        )}
                      </td>
                      <td className="ep-td hidden lg:table-cell ep-mono text-[12px] text-primary/40">
                        {log.ipAddress ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="ep-pagination">
            <span>{meta.total} résultat{meta.total > 1 ? "s" : ""}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className="ep-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.page <= 1}><ChevronLeft size={13} /></button>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "0 8px" }}>Page {meta.page} / {meta.totalPages}</span>
              <button className="ep-page-btn" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={meta.page >= meta.totalPages}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail slide-over ── */}
      {selectedLog && (
        <div className="w-96 shrink-0 border-l border-border-custom bg-surface overflow-hidden flex flex-col">
          <DetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
      )}

      {/* ── Create modal ── */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Créer un log manuellement"

      >
        <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      </Modal>
    </div>
  );
}
