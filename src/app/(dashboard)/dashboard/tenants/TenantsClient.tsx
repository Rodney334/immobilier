"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
} from "lucide-react";
import { tenantService } from "@/lib/services/tenant.service";
import { TenantFormModal } from "@/components/features/tenants/TenantFormModal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
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
  const fullName = (tenant.fullName || `${tenant.firstName ?? ""} ${tenant.lastName ?? ""}`.trim()) || "—";
  const initials =
    `${tenant.firstName?.[0] ?? ""}${tenant.lastName?.[0] ?? ""}`.toUpperCase() ||
    fullName[0]?.toUpperCase() ||
    "?";

  return (
    <div
      onClick={onClick}
      className="bg-surface p-4 cursor-pointer active:bg-primary/3 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tenant.status === "BLACKLISTED" ? "bg-danger/10" : "bg-primary/8"}`}>
            <span className={`text-[13px] font-semibold ${tenant.status === "BLACKLISTED" ? "text-danger" : "text-primary/60"}`}>{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-primary truncate">{fullName}</p>
            <p className="text-[12px] text-primary/50 truncate">{tenant.email ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Téléphone</p>
          <p className="text-[12px] text-primary/70">{tenant.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-primary/40 uppercase tracking-wide mb-0.5">Inscrit le</p>
          <p className="text-[12px] text-primary/70 tabular-nums">{formatDate(tenant.createdAt)}</p>
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
  const fullName = (tenant.fullName || `${tenant.firstName ?? ""} ${tenant.lastName ?? ""}`.trim()) || "—";
  const initials =
    `${tenant.firstName?.[0] ?? ""}${tenant.lastName?.[0] ?? ""}`.toUpperCase() ||
    fullName[0]?.toUpperCase() ||
    "?";

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors duration-100 hover:bg-primary/3 border-l-2 border-l-transparent group"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            tenant.status === "BLACKLISTED" ? "bg-danger/10" : "bg-primary/8"
          }`}>
            <span className={`text-[12px] font-semibold ${
              tenant.status === "BLACKLISTED" ? "text-danger" : "text-primary/60"
            }`}>
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-primary truncate">
              {fullName}
            </p>
            {tenant.email && (
              <p className="text-[11px] text-primary/40 truncate">
                {tenant.email}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-primary/60">
        {tenant.phone ?? "—"}
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-primary/50">
        {tenant.address ?? "—"}
      </td>
      <td className="px-4 py-3.5 text-[12px] text-primary/40 tabular-nums whitespace-nowrap">
        {formatDate(tenant.createdAt)}
      </td>
      <td className="px-3 py-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight size={14} className="text-primary/30" />
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
        {from}–{to} sur {total} locataire{total > 1 ? "s" : ""}
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

export function TenantsClient() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
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
        limit: PAGE_LIMIT,
        search: debouncedQ || undefined,
      });
      setTenants(res.data);
      setPagination(res.meta ?? null);
    } catch {
      setError("Impossible de charger les locataires.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(t: Tenant) {
    setTenants((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = t; return n; }
      return [t, ...prev];
    });
    setFormOpen(false);
    load();
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-surface">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-4 bg-surface border-b border-border-custom shrink-0">
            <div>
              <h1 className="font-semibold text-[18px] lg:text-[20px] text-primary">
                Locataires
              </h1>
              {pagination && !loading && (
                <p className="text-[12px] text-primary/40 mt-0.5">
                  {pagination.total} locataire{pagination.total > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 lg:flex-none">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35 pointer-events-none"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="pl-9 pr-4 h-9 w-full lg:w-56 rounded-lg border border-border-custom bg-white text-[13px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
              <button
                onClick={() => setFormOpen(true)}
                className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] transition-colors shrink-0"
              >
                <Plus size={15} /> Nouveau locataire
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
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-neutral">
                      <tr className="border-b border-border-custom">
                        {[
                          "Locataire",
                          "Téléphone",
                          "Statut",
                          "Ville",
                          "Créé le",
                          "",
                        ].map((h, index) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/40"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom bg-surface">
                      {tenants.map((t) => (
                        <TenantRow
                          key={t.id}
                          tenant={t}
                          onClick={() => router.push(`/dashboard/tenants/${t.id}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Cards mobiles */}
                <div className="lg:hidden divide-y divide-border-custom">
                  {tenants.map((t) => (
                    <TenantCard
                      key={t.id}
                      tenant={t}
                      onClick={() => router.push(`/dashboard/tenants/${t.id}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <PaginationBar meta={pagination} onPage={setPage} />
          )}
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
