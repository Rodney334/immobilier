"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  Loader2,
  AlertTriangle,
  ChevronRight as ArrowRight,
} from "lucide-react";
import { tenantService } from "@/lib/services/tenant.service";
import { TenantFormModal } from "@/components/features/tenants/TenantFormModal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import type { Tenant, TenantStatus, PaginationMeta } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TenantStatus,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  ACTIVE: { label: "Actif", variant: "success" },
  INACTIVE: { label: "Inactif", variant: "warning" },
  BLACKLISTED: { label: "Archivé", variant: "danger" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function TenantCard({
  tenant,
  onClick,
}: {
  tenant: Tenant;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[tenant.status];
  const fullName =
    tenant.fullName ||
    `${tenant.firstName ?? ""} ${tenant.lastName ?? ""}`.trim() ||
    "—";
  const initials =
    `${tenant.firstName?.[0] ?? ""}${tenant.lastName?.[0] ?? ""}`.toUpperCase() ||
    fullName[0]?.toUpperCase() ||
    "?";

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border-custom rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tenant.status === "BLACKLISTED" ? "bg-danger/10" : "bg-primary/8"}`}
          >
            <span
              className={`text-[13px] font-semibold ${tenant.status === "BLACKLISTED" ? "text-danger" : "text-primary/60"}`}
            >
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-primary truncate">
              {fullName}
            </p>
            <p className="text-[12px] text-primary/50 truncate">
              {tenant.email ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Téléphone
          </p>
          <p className="text-[12px] text-primary/70">{tenant.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">
            Inscrit le
          </p>
          <p className="text-[12px] text-primary/70 tabular-nums">
            {formatDate(tenant.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TenantRow({
  tenant,
  onClick,
}: {
  tenant: Tenant;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[tenant.status];
  const fullName =
    tenant.fullName ||
    `${tenant.firstName ?? ""} ${tenant.lastName ?? ""}`.trim() ||
    "—";
  const initials =
    `${tenant.firstName?.[0] ?? ""}${tenant.lastName?.[0] ?? ""}`.toUpperCase() ||
    fullName[0]?.toUpperCase() ||
    "?";

  return (
    <tr className="ep-tr" onClick={onClick}>
      <td className="ep-td">
        <div className="ep-person">
          <div className="ep-avatar" style={{ background: tenant.status === "BLACKLISTED" ? "var(--rouge-soft)" : undefined, color: tenant.status === "BLACKLISTED" ? "var(--rouge)" : undefined }}>
            {initials}
          </div>
          <div>
            <div className="ep-person-name">{fullName}</div>
            {tenant.email && <div className="ep-person-sub">{tenant.email}</div>}
          </div>
        </div>
      </td>
      <td className="ep-td ep-mono">{tenant.phone ?? "—"}</td>
      <td className="ep-td"><Badge variant={cfg.variant} stamp>{cfg.label}</Badge></td>
      <td className="ep-td" style={{ fontSize: 13, color: "var(--ink-soft)" }}>{tenant.address ?? "—"}</td>
      <td className="ep-td ep-mono">{formatDate(tenant.createdAt)}</td>
      <td className="ep-td" style={{ width: 32, color: "var(--ink-soft)", opacity: 0.4 }}>›</td>
    </tr>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TenantsClient() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenantService.getAll({
        page,
        limit,
        search: debouncedQ || undefined,
      });
      setTenants(res.data);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les locataires.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(t: Tenant) {
    setTenants((prev) => {
      const idx = prev.findIndex((x) => x._id === t._id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = t;
        return n;
      }
      return [t, ...prev];
    });
    setFormOpen(false);
    load();
  }

  return (
    <>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Topbar */}
          <div className="ep-topbar" style={{ paddingBottom: 20 }}>
            <div>
              <p className="ep-eyebrow">Parc immobilier</p>
              <h1 className="ep-page-title">Locataires</h1>
              {pagination && !loading && (
                <p className="ep-page-desc">{pagination.total} locataire{pagination.total > 1 ? "s" : ""} enregistré{pagination.total > 1 ? "s" : ""}</p>
              )}
            </div>
            <div className="ep-topbar-actions">
              <div className="ep-search" style={{ minWidth: 200 }}>
                <Search size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" />
              </div>
              <button className="ep-btn ep-btn-primary" onClick={() => setFormOpen(true)}>
                <Plus size={14} /> Nouveau locataire
              </button>
            </div>
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
            ) : tenants.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Users}
                  title="Aucun locataire"
                  description={
                    debouncedQ
                      ? `Aucun résultat pour « ${debouncedQ} ».`
                      : "Ajoutez votre premier locataire."
                  }
                  actionLabel={debouncedQ ? undefined : "Ajouter un locataire"}
                  onAction={debouncedQ ? undefined : () => setFormOpen(true)}
                />
              </div>
            ) : (
              <>
                {/* Table desktop */}
                <div className="hidden lg:block" style={{ padding: "0 32px 32px" }}>
                  <div className="ep-panel">
                  <table className="ep-table">
                    <thead>
                      <tr>
                        {["Locataire","Téléphone","Statut","Ville","Créé le",""].map((h, i) => (
                          <th key={i} className="ep-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((t) => (
                        <TenantRow
                          key={t._id}
                          tenant={t}
                          onClick={() => router.push(`/dashboard/tenants/${t._id}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                {/* Cards mobiles */}
                <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {tenants.map((t) => (
                    <TenantCard
                      key={t._id}
                      tenant={t}
                      onClick={() => router.push(`/dashboard/tenants/${t._id}`)}
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
            itemLabel="locataires"
            onPage={setPage}
            onLimit={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      </div>

      <TenantFormModal
        isOpen={formOpen}
        tenant={null}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
