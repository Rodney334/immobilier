"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Users,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  Archive,
  RotateCcw,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCircle2,
} from "lucide-react";
import { userService } from "@/lib/services/user.service";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import type { User, UserRole, PaginationMeta } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  superadmin: { label: "Super Administrateur", variant: "success" },
  admin: { label: "Administrateur", variant: "danger" },
  user: { label: "Utilisateur", variant: "neutral" },
};

const ROLES_ORDERED: UserRole[] = ["superadmin", "admin", "user"];

// ─── Filter types ─────────────────────────────────────────────────────────────

type RoleFilter = UserRole | "all";
type StatusFilter = "all" | "active" | "unverified" | "archived";

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Tous les rôles" },
  { value: "admin", label: "Administrateur" },
  { value: "user", label: "Utilisateur" },
];

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "unverified", label: "Non vérifié" },
  { value: "archived", label: "Archivé" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function UserCard({ user, onClick }: { user: User; onClick: () => void }) {
  const cfg = ROLE_CONFIG[user.role];
  const initials = getInitials(user.name);
  const isArchived = user.isArchived ?? false;

  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border-custom rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99] transition-all duration-150 ${isArchived ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isArchived ? "bg-primary/5" : "bg-primary/8"}`}
          >
            <span className="text-[13px] font-semibold text-primary/60">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-primary truncate">
              {user.name}
            </p>
            <p className="text-[12px] text-primary/50 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          {isArchived ? (
            <Badge variant="neutral">Archivé</Badge>
          ) : user.isEmailVerified ? (
            <Badge variant="success">Actif</Badge>
          ) : (
            <Badge variant="warning">Non vérifié</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function UserRow({
  user,
  selected,
  onClick,
}: {
  user: User;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = ROLE_CONFIG[user.role];
  const initials = getInitials(user.name);
  const isArchived = user.isArchived ?? false;

  return (
    <tr
      onClick={onClick}
      className={`ep-tr ${isArchived ? "opacity-50" : ""}`}
      style={selected ? { background: "var(--secondary-soft)", borderLeft: "2px solid var(--secondary)" } : undefined}
    >
      <td className="ep-td">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isArchived ? "bg-primary/5" : "bg-primary/8"
            }`}
          >
            <span className="text-[12px] font-semibold text-primary/60">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-primary truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-primary/40 truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="ep-td">
        <Badge variant={cfg.variant} stamp>{cfg.label}</Badge>
      </td>
      <td className="ep-td text-primary/50">
        {user.phoneNumber
          ? `${user.countryCode ?? ""} ${user.phoneNumber}`.trim()
          : "—"}
      </td>
      <td className="ep-td">
        {isArchived ? (
          <Badge variant="neutral" stamp>Archivé</Badge>
        ) : user.isEmailVerified ? (
          <Badge variant="success" stamp>Actif</Badge>
        ) : (
          <Badge variant="warning" stamp>Non vérifié</Badge>
        )}
      </td>
      <td className="ep-td ep-mono text-primary/40 tabular-nums whitespace-nowrap">
        {formatDate(user.createdAt)}
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
      <span>{from}–{to} sur {total} utilisateur{total > 1 ? "s" : ""}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button className="ep-page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1}><ChevronLeft size={13} /></button>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "0 8px" }}>Page {page} / {totalPages}</span>
        <button className="ep-page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages}><ChevronRight size={13} /></button>
      </div>
    </div>
  );
}

// ─── Detail Row (sidebar) ─────────────────────────────────────────────────────

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
        <Icon size={14} className="text-primary/50" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35 mb-0.5">
          {label}
        </p>
        <div className="text-[13px] text-primary">{value}</div>
      </div>
    </div>
  );
}

// ─── User Detail Panel ────────────────────────────────────────────────────────

function UserDetailPanel({
  user,
  onClose,
  onUpdated,
}: {
  user: User;
  onClose: () => void;
  onUpdated: (u: User) => void;
}) {
  const { toast } = useToast();
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(user.role);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const isArchived = user.isArchived ?? false;
  const cfg = ROLE_CONFIG[user.role];
  const initials = getInitials(user.name);

  async function handlePromote() {
    if (newRole === user.role) {
      setPromoteError("Veuillez sélectionner un rôle différent.");
      return;
    }
    setPromoting(true);
    setPromoteError(null);
    try {
      const res = await userService.promote(user.id ?? user._id, {
        role: newRole,
      });
      onUpdated(res.data);
      setPromoteOpen(false);
      toast({ variant: "success", title: "Rôle mis à jour", duration: 3000 });
    } catch {
      setPromoteError("Impossible de modifier le rôle.");
    } finally {
      setPromoting(false);
    }
  }

  async function handleArchive() {
    setArchiving(true);
    try {
      const res = await userService.archive(user.id ?? user._id);
      onUpdated(res.data);
      setArchiveOpen(false);
      toast({
        variant: "success",
        title: "Utilisateur archivé",
        duration: 3000,
      });
    } catch {
      toast({
        variant: "danger",
        title: "Impossible d'archiver",
        duration: 4000,
      });
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const res = await userService.restore(user.id ?? user._id);
      onUpdated(res.data);
      setRestoreOpen(false);
      toast({
        variant: "success",
        title: "Utilisateur restauré",
        duration: 3000,
      });
    } catch {
      toast({
        variant: "danger",
        title: "Impossible de restaurer",
        duration: 4000,
      });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <>
      <aside className="flex flex-col w-100 shrink-0 bg-surface border-l border-border-custom h-screen sticky top-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border-custom shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isArchived ? "bg-primary/5" : "bg-primary/8"}`}
            >
              <span className="text-[16px] font-semibold text-primary/60">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-[18px] text-primary truncate">
                {user.name}
              </h2>
              <p className="text-[12px] text-primary/50 truncate mt-0.5">
                {user.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                {isArchived && <Badge variant="neutral">Archivé</Badge>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/6 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border-custom shrink-0">
          <button
            onClick={() => {
              setNewRole(user.role);
              setPromoteError(null);
              setPromoteOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-primary border border-border-custom hover:border-primary/30 hover:bg-primary/4 transition-colors"
          >
            <ShieldCheck size={13} />
            Changer de rôle
          </button>

          {isArchived ? (
            <button
              onClick={() => setRestoreOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-success border border-success/20 hover:bg-success/5 transition-colors"
            >
              <RotateCcw size={13} />
              Restaurer
            </button>
          ) : (
            <button
              onClick={() => setArchiveOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-danger border border-danger/20 hover:bg-danger/5 transition-colors"
            >
              <Archive size={13} />
              Archiver
            </button>
          )}
        </div>

        {/* Détails */}
        <div className="flex-1 overflow-y-auto px-5">
          <DetailRow icon={Mail} label="Email" value={user.email} />
          <DetailRow
            icon={Phone}
            label="Téléphone"
            value={
              user.phoneNumber
                ? `${user.countryCode ?? ""} ${user.phoneNumber}`.trim()
                : undefined
            }
          />
          <DetailRow
            icon={Shield}
            label="Rôle"
            value={<Badge variant={cfg.variant}>{cfg.label}</Badge>}
          />
          <DetailRow
            icon={UserCircle2}
            label="Vérification email"
            value={
              user.isEmailVerified ? (
                <span className="text-success text-[13px]">Vérifié</span>
              ) : (
                <span className="text-warning text-[13px]">Non vérifié</span>
              )
            }
          />
          <DetailRow
            icon={Calendar}
            label="Membre depuis"
            value={formatDate(user.createdAt)}
          />
          <DetailRow
            icon={Calendar}
            label="Dernière mise à jour"
            value={formatDate(user.updatedAt)}
          />
        </div>
      </aside>

      {/* Modal : changer de rôle */}
      <Modal
        isOpen={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Changer le rôle"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPromoteOpen(false)}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handlePromote}
              disabled={promoting}
              className="h-10 px-5 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-[#263447] disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {promoting && <Loader2 size={14} className="animate-spin" />}
              Confirmer
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-[14px] text-primary/60">
            Sélectionnez le nouveau rôle pour{" "}
            <span className="font-semibold text-primary">{user.name}</span>.
          </p>
          <div className="space-y-2">
            {ROLES_ORDERED.map((role) => {
              const rc = ROLE_CONFIG[role];
              return (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    newRole === role
                      ? "border-primary bg-primary/4"
                      : "border-border-custom hover:border-primary/30 hover:bg-primary/2"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={newRole === role}
                    onChange={() => setNewRole(role)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-primary">
                      {rc.label}
                    </p>
                    <p className="text-[11px] text-primary/40">
                      {role === "admin" || role === "superadmin"
                        ? "Accès complet à toutes les fonctionnalités"
                        : "Accès en lecture seule"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          {promoteError && (
            <p className="text-[12px] text-danger">{promoteError}</p>
          )}
        </div>
      </Modal>

      {/* Modal : archiver */}
      <Modal
        isOpen={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archiver cet utilisateur ?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setArchiveOpen(false)}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className="h-10 px-5 bg-danger text-white rounded-lg text-[14px] font-medium hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {archiving && <Loader2 size={14} className="animate-spin" />}
              Archiver
            </button>
          </div>
        }
      >
        <p className="text-[14px] text-primary/70 leading-relaxed">
          L'utilisateur{" "}
          <span className="font-semibold text-primary">{user.name}</span> ne
          pourra plus se connecter. Vous pourrez le restaurer ultérieurement.
        </p>
      </Modal>

      {/* Modal : restaurer */}
      <Modal
        isOpen={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restaurer cet utilisateur ?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setRestoreOpen(false)}
              className="h-10 px-5 rounded-lg text-[14px] font-medium text-primary/60 hover:text-primary border border-border-custom transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoring}
              className="h-10 px-5 bg-success text-white rounded-lg text-[14px] font-medium hover:bg-success/90 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {restoring && <Loader2 size={14} className="animate-spin" />}
              Restaurer
            </button>
          </div>
        }
      >
        <p className="text-[14px] text-primary/70 leading-relaxed">
          L'utilisateur{" "}
          <span className="font-semibold text-primary">{user.name}</span> pourra
          à nouveau se connecter.
        </p>
      </Modal>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 15;

export function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getAll({
        page,
        limit: PAGE_LIMIT,
        search: debouncedQ || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        isArchived:
          statusFilter === "archived"
            ? true
            : statusFilter === "active" || statusFilter === "unverified"
              ? false
              : undefined,
      });

      // Filtre "non vérifié" côté client si l'API ne le supporte pas nativement
      let data = res.data;
      if (statusFilter === "unverified") {
        data = data.filter((u) => !u.isEmailVerified);
      } else if (statusFilter === "active") {
        data = data.filter((u) => u.isEmailVerified);
      }

      setUsers(data);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, roleFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function handleUpdated(updated: User) {
    const id = updated.id ?? updated._id;
    setUsers((prev) =>
      prev.map((u) => (u.id === id || u._id === id ? updated : u)),
    );
    setSelected(updated);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* List */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="ep-topbar" style={{ paddingBottom: 20 }}>
          <div>
            <p className="ep-eyebrow">Administration</p>
            <h1 className="ep-page-title">Utilisateurs</h1>
          </div>
          <div className="ep-topbar-actions">
            <div className="ep-search">
              <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, prénom, email…"
              />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4 px-6 py-2.5 border-b border-border-custom bg-surface shrink-0 overflow-x-auto">
          {/* Role filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-medium uppercase tracking-wider text-primary/40 mr-0.5">
              Rôle :
            </span>
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                className="ep-chip"
                data-active={roleFilter === opt.value ? "true" : "false"}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border-custom shrink-0" />

          {/* Status filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-medium uppercase tracking-wider text-primary/40 mr-0.5">
              Statut :
            </span>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className="ep-chip"
                data-active={statusFilter === opt.value ? "true" : "false"}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Reset button — shown only when filters are active */}
          {(roleFilter !== "all" || statusFilter !== "all" || debouncedQ) && (
            <>
              <div className="h-4 w-px bg-border-custom shrink-0" />
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="text-[12px] text-primary/40 hover:text-primary transition-colors whitespace-nowrap shrink-0"
              >
                Réinitialiser
              </button>
            </>
          )}
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
          ) : users.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Aucun utilisateur"
                description={
                  debouncedQ || roleFilter !== "all" || statusFilter !== "all"
                    ? "Aucun utilisateur ne correspond aux filtres sélectionnés."
                    : "Aucun utilisateur trouvé."
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
                        "Utilisateur",
                        "Rôle",
                        "Téléphone",
                        "Statut",
                        "Créé le",
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
                  <tbody className="divide-y divide-border-custom bg-surface">
                    {users.map((u) => {
                      const uid = u.id ?? u._id;
                      const sid = selected
                        ? (selected.id ?? selected._id)
                        : null;
                      return (
                        <UserRow
                          key={uid}
                          user={u}
                          selected={sid === uid}
                          onClick={() =>
                            setSelected((prev) =>
                              (prev?.id ?? prev?._id) === uid ? null : u,
                            )
                          }
                        />
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
              {/* Cards mobiles */}
              <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {users.map((u) => {
                  const uid = u.id ?? u._id;
                  return (
                    <UserCard
                      key={uid}
                      user={u}
                      onClick={() =>
                        setSelected((prev) =>
                          (prev?.id ?? prev?._id) === uid ? null : u,
                        )
                      }
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <PaginationBar meta={pagination} onPage={setPage} />
        )}
      </div>

      {/* Right sidebar */}
      {selected && (
        <UserDetailPanel
          key={selected.id ?? selected._id}
          user={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
