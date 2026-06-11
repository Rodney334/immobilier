"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Briefcase,
  CreditCard,
  Calendar,
  Home,
  Pencil,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Clock,
  Minus,
  RotateCcw,
  Eye,
  Ban,
} from "lucide-react";
import { tenantService } from "@/lib/services/tenant.service";
import { leaseService } from "@/lib/services/lease.service";
import { rentScheduleService } from "@/lib/services/rent-schedule.service";
import { paymentService } from "@/lib/services/payment.service";
import { receiptService } from "@/lib/services/receipt.service";
import { adjustmentService } from "@/lib/services/adjustment.service";
import { TenantFormModal } from "@/components/features/tenants/TenantFormModal";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type {
  Tenant,
  Lease,
  RentSchedule,
  RentScheduleStatus,
  Payment,
  Receipt,
  Adjustment,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "overview" | "payments" | "receipts" | "adjustments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_FR_SHORT = [
  "Jan","Fév","Mar","Avr","Mai","Jun",
  "Jul","Aoû","Sep","Oct","Nov","Déc",
];

const fmt = new Intl.NumberFormat("fr-FR");

function formatAmount(v: string | number) {
  return fmt.format(Number(v)) + " FCFA";
}

function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("fr-FR", opts ?? {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatMonthLong(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "long", year: "numeric",
  });
}

function monthsElapsed(startIso: string): number {
  const start = new Date(startIso);
  const now = new Date();
  return (
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  );
}

function buildHistoryGrid(
  schedules: RentSchedule[],
): Array<{ year: number; month: number; schedule: RentSchedule | null }> {
  const grid: Array<{ year: number; month: number; schedule: RentSchedule | null }> = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const schedule =
      schedules.find((s) => {
        const sd = new Date(s.dueDate);
        return sd.getFullYear() === y && sd.getMonth() + 1 === m;
      }) ?? null;
    grid.push({ year: y, month: m, schedule });
  }
  return grid;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// --- Stat card ---

function StatCard({
  label,
  value,
  sub,
  valueColor = "text-primary",
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="flex-1 min-w-[140px] bg-surface border border-border-custom rounded-xl p-4">
      <p className="text-[12px] font-medium text-primary/40 mb-1 truncate">{label}</p>
      <p className={`text-[22px] font-bold tabular-nums leading-tight ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-primary/35 mt-0.5">{sub}</p>}
    </div>
  );
}

// --- Toggle decoratif (contrats) ---

function LeaseToggle({ active }: { active: boolean }) {
  return (
    <div
      className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${
        active ? "bg-success" : "bg-primary/20"
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
          active ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </div>
  );
}

// --- Cellule de l'historique ---

const SCHEDULE_CELL: Record<
  RentScheduleStatus,
  { bg: string; iconEl: React.ReactNode; text: string }
> = {
  PAID:           { bg: "bg-success",           iconEl: <Check size={11} strokeWidth={3} />, text: "text-white" },
  PARTIALLY_PAID: { bg: "bg-amber-400",          iconEl: <Clock size={11} strokeWidth={2.5} />, text: "text-white" },
  OVERDUE:        { bg: "bg-danger",             iconEl: <X size={11} strokeWidth={3} />, text: "text-white" },
  PENDING:        { bg: "bg-primary/8 border border-border-custom", iconEl: null, text: "text-primary/30" },
  CANCELLED:      { bg: "bg-primary/10",         iconEl: <Minus size={11} strokeWidth={2} />, text: "text-primary/30" },
};

function HistoryCell({
  year,
  month,
  schedule,
}: {
  year: number;
  month: number;
  schedule: RentSchedule | null;
}) {
  const label = `${MONTHS_FR_SHORT[month - 1]} ${String(year).slice(2)}`;

  if (!schedule) {
    return (
      <div
        title="Sans contrat"
        className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/4 border border-border-custom cursor-default"
      >
        <span className="text-[9px] font-medium text-primary/25 leading-tight">{label}</span>
        <Minus size={10} className="text-primary/20 mt-0.5" />
      </div>
    );
  }

  const cfg = SCHEDULE_CELL[schedule.status];
  return (
    <div
      title={`${label} — ${schedule.status}`}
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${cfg.bg} cursor-default`}
    >
      <span className={`text-[9px] font-medium leading-tight ${cfg.text}`}>{label}</span>
      {cfg.iconEl ? (
        <span className={`mt-0.5 ${cfg.text}`}>{cfg.iconEl}</span>
      ) : (
        <span className={`text-[9px] mt-0.5 ${cfg.text}`}>—</span>
      )}
    </div>
  );
}

// --- Carte contrat ---

function LeaseCard({
  lease,
  label,
}: {
  lease: Lease;
  label: string;
}) {
  const isActive = lease.status === "ACTIVE";
  return (
    <div className="flex-1 border border-border-custom rounded-xl p-4 bg-surface">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary/40">
          {label}
        </span>
        <LeaseToggle active={isActive} />
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-primary/40 mb-1">
        <Calendar size={10} />
        {lease.startDate ? formatDate(lease.startDate, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
        {" → "}
        {lease.endDate ? formatDate(lease.endDate, { day: "2-digit", month: "2-digit", year: "numeric" }) : "…"}
      </div>
      <p className="text-[18px] font-bold text-primary tabular-nums">
        {formatAmount(lease.monthlyRent)}/mois
      </p>
      {lease.contractNumber && (
        <p className="text-[11px] font-mono text-primary/30 mt-1">{lease.contractNumber}</p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TenantProfileClient({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  // Core data
  const [tenant,    setTenant]    = useState<Tenant | null>(null);
  const [leases,    setLeases]    = useState<Lease[]>([]);
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Stats (computed from fetched data)
  const [totalPaid,    setTotalPaid]    = useState(0);
  const [totalUnpaid,  setTotalUnpaid]  = useState(0);
  const [adjTotal,     setAdjTotal]     = useState(0);
  const [adjPos,       setAdjPos]       = useState(0);
  const [adjNeg,       setAdjNeg]       = useState(0);

  // Tabs
  const [activeTab,     setActiveTab]     = useState<ActiveTab>("overview");
  const [tabPayments,   setTabPayments]   = useState<Payment[]>([]);
  const [tabReceipts,   setTabReceipts]   = useState<Receipt[]>([]);
  const [tabAdjustments,setTabAdjustments]= useState<Adjustment[]>([]);
  const [tabLoading,    setTabLoading]    = useState(false);
  const loadedTabs = useState(() => new Set<ActiveTab>())[0];

  // Actions
  const [editOpen,      setEditOpen]      = useState(false);
  const [restoring,     setRestoring]     = useState(false);
  const [incidentsOpen, setIncidentsOpen] = useState(false);

  // Derived
  const activeLease    = leases.find((l) => l.status === "ACTIVE") ?? null;
  const previousLeases = leases.filter((l) => l.status !== "ACTIVE" && l.status !== "DRAFT");
  const lastPrevLease  = previousLeases.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )[0] ?? null;

  const historyGrid = buildHistoryGrid(schedules);
  const monthsPresent = activeLease ? monthsElapsed(activeLease.startDate) : 0;
  const isBlacklisted = tenant?.status === "BLACKLISTED";
  const isInactive    = tenant?.status === "INACTIVE";

  const fullName = tenant
    ? (tenant.fullName || `${tenant.firstName ?? ""} ${tenant.lastName ?? ""}`.trim())
    : "—";
  const initials = tenant
    ? `${tenant.firstName?.[0] ?? ""}${tenant.lastName?.[0] ?? ""}`.toUpperCase() || fullName[0]?.toUpperCase() || "?"
    : "?";

  // ── Load core data ──

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantRes, leasesRes, paymentsRes] = await Promise.all([
        tenantService.getById(tenantId),
        leaseService.getAll({ tenant: tenantId, limit: 50 }),
        paymentService.getAll({ tenant: tenantId, limit: 200 }),
      ]);

      setTenant(tenantRes.data);
      const ls = Array.isArray(leasesRes.data) ? leasesRes.data : [];
      setLeases(ls);

      // Compute total paid
      const pmts = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      const paid = pmts
        .filter((p) => p.status !== "CANCELLED" && p.status !== "REVERSED")
        .reduce((s, p) => s + Number(p.amount), 0);
      setTotalPaid(paid);

      // Load schedules + adjustments for active lease
      const active = ls.find((l) => l.status === "ACTIVE") ?? null;
      if (active) {
        const [schRes, adjRes] = await Promise.all([
          rentScheduleService.getAll({ lease: active.id, limit: 50 }),
          adjustmentService.getAll({ lease: active.id }),
        ]);
        const sched = Array.isArray(schRes.data) ? schRes.data : [];
        setSchedules(sched);

        const unpaid = sched
          .filter((s) => s.status === "OVERDUE" || s.status === "PARTIALLY_PAID")
          .reduce((sum, s) => sum + (s.balance ?? s.remainingAmount ?? s.amount ?? 0), 0);
        setTotalUnpaid(unpaid);

        const adjs = Array.isArray(adjRes.data) ? adjRes.data : [];
        const total = adjs.reduce((s, a) => s + a.amount, 0);
        setAdjTotal(total);
        setAdjPos(adjs.filter((a) => a.amount > 0).length);
        setAdjNeg(adjs.filter((a) => a.amount < 0).length);
      }
    } catch {
      setError("Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadCore(); }, [loadCore]);

  // ── Lazy-load tab data ──

  useEffect(() => {
    if (loadedTabs.has(activeTab)) return;
    if (activeTab === "overview") return;

    setTabLoading(true);
    loadedTabs.add(activeTab);

    (async () => {
      try {
        if (activeTab === "payments") {
          const res = await paymentService.getAll({ tenant: tenantId, limit: 100 });
          setTabPayments(Array.isArray(res.data) ? res.data : []);
        } else if (activeTab === "receipts") {
          const res = await receiptService.getAll({ tenant: tenantId, limit: 100 });
          setTabReceipts(Array.isArray(res.data) ? res.data : []);
        } else if (activeTab === "adjustments") {
          if (activeLease) {
            const res = await adjustmentService.getAll({ lease: activeLease.id });
            setTabAdjustments(Array.isArray(res.data) ? res.data : []);
          }
        }
      } catch {
        // pas bloquant
      } finally {
        setTabLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Unblacklist ──

  async function handleRestore() {
    if (!tenant) return;
    setRestoring(true);
    try {
      const res = await tenantService.restore(tenant.id);
      setTenant(res.data);
      toast({ variant: "success", title: "Locataire réintégré", duration: 3000 });
    } catch {
      toast({ variant: "danger", title: "Impossible de réintégrer", duration: 4000 });
    } finally {
      setRestoring(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={28} className="animate-spin text-primary/30" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-danger text-[14px]">
          <AlertTriangle size={16} />
          {error ?? "Locataire introuvable."}
        </div>
        <button
          onClick={() => router.push("/dashboard/tenants")}
          className="mt-4 text-[13px] text-primary/50 hover:text-primary flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={13} /> Retour aux locataires
        </button>
      </div>
    );
  }

  // Status colors for left card background accent
  const cardAccent = isBlacklisted
    ? "border-l-4 border-l-danger"
    : isInactive
      ? "border-l-4 border-l-primary/20"
      : "";

  const statusBadge = isBlacklisted ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-danger/10 text-danger">
      <Ban size={10} /> Blacklisté
    </span>
  ) : isInactive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/8 text-primary/50">
      Inactif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success">
      <span className="w-1.5 h-1.5 rounded-full bg-success" /> Actif
    </span>
  );

  return (
    <>
      {/* ── Page shell ── */}
      <div className="flex flex-col h-screen overflow-hidden bg-neutral">

        {/* Back bar */}
        <div className="flex items-center gap-3 px-6 py-3 bg-surface border-b border-border-custom shrink-0">
          <button
            onClick={() => router.push("/dashboard/tenants")}
            className="flex items-center gap-1.5 text-[13px] text-primary/50 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Locataires
          </button>
          <span className="text-primary/20">/</span>
          <span className="text-[13px] font-medium text-primary truncate">{fullName}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6 items-start">

            {/* ──────────────────────────────────────────────────────────────
                LEFT — Profile card
            ────────────────────────────────────────────────────────────── */}
            <div className={`w-80 shrink-0 bg-surface rounded-xl border border-border-custom overflow-hidden ${cardAccent}`}>

              {/* Blacklist banner */}
              {isBlacklisted && (
                <div className="bg-danger/10 border-b border-danger/20 px-4 py-3">
                  <p className="text-[11px] font-semibold text-danger uppercase tracking-wide mb-0.5">
                    Mis en liste noire
                  </p>
                  {tenant.blacklistReason && (
                    <p className="text-[12px] text-danger/80">
                      Motif : {tenant.blacklistReason}
                    </p>
                  )}
                  {tenant.blacklistedAt && (
                    <p className="text-[11px] text-danger/60 mt-0.5">
                      Le {formatDate(tenant.blacklistedAt)}
                    </p>
                  )}
                  {!tenant.blacklistReason && tenant.notes && (
                    <p className="text-[12px] text-danger/80 line-clamp-2">{tenant.notes}</p>
                  )}
                </div>
              )}

              {/* Inactive banner */}
              {isInactive && (
                <div className="bg-primary/4 border-b border-border-custom px-4 py-2.5">
                  <p className="text-[11px] font-medium text-primary/40 uppercase tracking-wide">
                    Compte inactif
                  </p>
                </div>
              )}

              <div className="p-5">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-5">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                      isBlacklisted
                        ? "bg-danger/15"
                        : isInactive
                          ? "bg-primary/8"
                          : "bg-primary"
                    }`}
                  >
                    <span
                      className={`text-[22px] font-bold ${
                        isBlacklisted
                          ? "text-danger"
                          : isInactive
                            ? "text-primary/40"
                            : "text-white"
                      }`}
                    >
                      {initials}
                    </span>
                  </div>
                  <h1 className="text-[17px] font-semibold text-primary text-center leading-snug mb-2">
                    {fullName}
                  </h1>
                  {statusBadge}
                </div>

                {/* Divider */}
                <div className="border-t border-border-custom mb-4" />

                {/* Contact rows */}
                <div className="space-y-2.5 mb-4">
                  {[
                    { icon: Phone,     label: "Téléphone", val: tenant.phone,       href: tenant.phone ? `tel:${tenant.phone}` : undefined },
                    { icon: Mail,      label: "Email",     val: tenant.email,       href: tenant.email ? `mailto:${tenant.email}` : undefined },
                    { icon: Briefcase, label: "Profession",val: tenant.profession,   href: undefined },
                    { icon: CreditCard,label: "NPI",       val: tenant.identityNumber, href: undefined },
                  ].map(({ icon: Icon, label, val, href }) =>
                    val ? (
                      <div key={label} className="flex items-start gap-2.5">
                        <Icon size={13} className="text-primary/30 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-primary/35">{label}</span>
                          {href ? (
                            <a href={href} className="block text-[13px] text-secondary truncate hover:underline">
                              {val}
                            </a>
                          ) : (
                            <p className="text-[13px] text-primary truncate">{val}</p>
                          )}
                        </div>
                      </div>
                    ) : null,
                  )}

                  {/* Depuis (lease start date) */}
                  {activeLease && (
                    <div className="flex items-start gap-2.5">
                      <Calendar size={13} className="text-primary/30 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-primary/35">Depuis</span>
                        <p className="text-[13px] text-primary">
                          {formatMonthLong(activeLease.startDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Local actuel */}
                {activeLease?.unit && (
                  <>
                    <div className="border-t border-border-custom my-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary/35 mb-2">
                      Local actuel
                    </p>
                    <div className="rounded-lg border border-border-custom p-3 mb-2">
                      <p className="text-[13px] font-medium text-primary">
                        {activeLease.unit.property?.name
                          ? `${activeLease.unit.property.name}, Apt ${activeLease.unit.unitNumber}`
                          : `Local ${activeLease.unit.unitNumber}`}
                      </p>
                      <p className="text-[12px] text-secondary font-medium mt-0.5">
                        {formatAmount(activeLease.monthlyRent)} / mois
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/units`}
                      className="text-[12px] text-secondary hover:underline block"
                    >
                      Voir le local →
                    </Link>
                  </>
                )}

                {/* Actions */}
                <div className="border-t border-border-custom mt-4 pt-4 space-y-2">
                  {isBlacklisted ? (
                    <>
                      <button
                        onClick={() => setIncidentsOpen(true)}
                        className="w-full h-9 rounded-lg border border-border-custom text-[13px] font-medium text-primary hover:bg-primary/4 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={13} /> Voir les incidents
                      </button>
                      <button
                        onClick={handleRestore}
                        disabled={restoring}
                        className="w-full text-[13px] font-medium text-secondary hover:underline disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {restoring ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                        Retirer de la liste noire
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditOpen(true)}
                        className="w-full h-9 rounded-lg border border-border-custom text-[13px] font-medium text-primary hover:bg-primary/4 transition-colors flex items-center justify-center gap-2"
                      >
                        <Pencil size={13} /> Modifier le profil
                      </button>
                      {activeLease && (
                        <button
                          onClick={() =>
                            router.push(`/dashboard/leases`)
                          }
                          className="w-full text-[13px] font-medium text-danger hover:underline"
                        >
                          Résilier le contrat
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ──────────────────────────────────────────────────────────────
                RIGHT — Stats + Tabs
            ────────────────────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">

              {/* Stat cards */}
              <div className="flex gap-3 flex-wrap">
                <StatCard
                  label="Total payé"
                  value={fmt.format(totalPaid)}
                  sub="FCFA"
                  valueColor="text-success"
                />
                <StatCard
                  label="Impayés"
                  value={fmt.format(totalUnpaid)}
                  sub="FCFA"
                  valueColor={totalUnpaid > 0 ? "text-danger" : "text-primary"}
                />
                <StatCard
                  label="Mois de présence"
                  value={String(monthsPresent)}
                  sub="mois"
                />
                <StatCard
                  label="Ajustements"
                  value={(adjTotal >= 0 ? "+" : "") + fmt.format(adjTotal)}
                  sub={adjPos > 0 || adjNeg > 0 ? `+${adjPos} / -${adjNeg}` : undefined}
                  valueColor={adjTotal < 0 ? "text-danger" : adjTotal > 0 ? "text-success" : "text-primary"}
                />
              </div>

              {/* Tab bar */}
              <div className="bg-surface rounded-xl border border-border-custom overflow-hidden">
                <div className="flex border-b border-border-custom px-1">
                  {(
                    [
                      { id: "overview",     label: "Vue d'ensemble" },
                      { id: "payments",     label: "Paiements" },
                      { id: "receipts",     label: "Reçus" },
                      { id: "adjustments",  label: "Ajustements" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-4 py-3 text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === t.id
                          ? "text-primary"
                          : "text-primary/40 hover:text-primary/70"
                      }`}
                    >
                      {t.label}
                      {activeTab === t.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-5">
                  {activeTab === "overview" && (
                    <OverviewTab
                      grid={historyGrid}
                      activeLease={activeLease}
                      lastPrevLease={lastPrevLease}
                    />
                  )}
                  {activeTab === "payments" && (
                    <PaymentsTab rows={tabPayments} loading={tabLoading} />
                  )}
                  {activeTab === "receipts" && (
                    <ReceiptsTab rows={tabReceipts} loading={tabLoading} />
                  )}
                  {activeTab === "adjustments" && (
                    <AdjustmentsTab rows={tabAdjustments} loading={tabLoading} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit modal ── */}
      <TenantFormModal
        isOpen={editOpen}
        tenant={tenant}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setTenant(updated);
          setEditOpen(false);
          toast({ variant: "success", title: "Profil mis à jour", duration: 3000 });
        }}
      />

      {/* ── Incidents modal ── */}
      <Modal
        isOpen={incidentsOpen}
        onClose={() => setIncidentsOpen(false)}
        title="Incidents / Motifs de blacklistage"
      >
        <div className="space-y-3">
          {tenant.blacklistReason && (
            <div className="rounded-lg bg-danger/6 border border-danger/15 px-4 py-3">
              <p className="text-[12px] font-semibold text-danger uppercase tracking-wide mb-1">Motif principal</p>
              <p className="text-[14px] text-primary">{tenant.blacklistReason}</p>
            </div>
          )}
          {tenant.blacklistedAt && (
            <p className="text-[13px] text-primary/50">
              Blacklisté le : <span className="font-medium text-primary">{formatDate(tenant.blacklistedAt)}</span>
            </p>
          )}
          {tenant.notes && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-primary/35 mb-1">Notes</p>
              <p className="text-[13px] text-primary/70 leading-relaxed">{tenant.notes}</p>
            </div>
          )}
          {!tenant.blacklistReason && !tenant.notes && (
            <p className="text-[13px] text-primary/40">Aucun incident enregistré.</p>
          )}
        </div>
      </Modal>
    </>
  );
}

// ─── Tab : Vue d'ensemble ─────────────────────────────────────────────────────

function OverviewTab({
  grid,
  activeLease,
  lastPrevLease,
}: {
  grid: Array<{ year: number; month: number; schedule: RentSchedule | null }>;
  activeLease: Lease | null;
  lastPrevLease: Lease | null;
}) {
  return (
    <div className="space-y-6">
      {/* Historique des paiements */}
      {grid.some((c) => c.schedule !== null) && (
        <div>
          <h3 className="text-[14px] font-semibold text-primary mb-3">
            Historique des paiements
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {grid.map(({ year, month, schedule }) => (
              <HistoryCell
                key={`${year}-${month}`}
                year={year}
                month={month}
                schedule={schedule}
              />
            ))}
          </div>
          {/* Légende */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { bg: "bg-success",        label: "Payé à temps" },
              { bg: "bg-amber-400",      label: "Payé en retard" },
              { bg: "bg-amber-400",      label: "Partiel", extra: true },
              { bg: "bg-danger",         label: "Impayé" },
              { bg: "bg-primary/8 border border-border-custom", label: "Sans contrat" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${l.bg} shrink-0`} />
                <span className="text-[11px] text-primary/50">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contrats */}
      {(activeLease || lastPrevLease) && (
        <div>
          <h3 className="text-[14px] font-semibold text-primary mb-3">Contrats</h3>
          <div className="flex gap-3 flex-wrap">
            {activeLease && (
              <LeaseCard lease={activeLease} label="Bail en cours" />
            )}
            {lastPrevLease && (
              <LeaseCard lease={lastPrevLease} label="Bail précédent" />
            )}
          </div>
        </div>
      )}

      {!activeLease && !lastPrevLease && (
        <p className="text-[13px] text-primary/40">Aucun contrat pour ce locataire.</p>
      )}
    </div>
  );
}

// ─── Tab : Paiements ──────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RECORDED:  { label: "Enregistré", color: "text-success" },
  CANCELLED: { label: "Annulé",     color: "text-danger" },
  REVERSED:  { label: "Inversé",    color: "text-primary/40" },
  failed:    { label: "Échoué",     color: "text-danger" },
};

function PaymentsTab({ rows, loading }: { rows: Payment[]; loading: boolean }) {
  if (loading) return <TabLoader />;
  if (!rows.length) return <TabEmpty label="Aucun paiement enregistré" />;

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-custom">
            {["Date", "Montant", "Méthode", "Réf.", "Statut"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom">
          {rows.map((p) => {
            const sc = PAYMENT_STATUS_LABELS[p.status] ?? { label: p.status, color: "text-primary/50" };
            return (
              <tr key={p.id} className="hover:bg-primary/2">
                <td className="px-5 py-3 text-[12px] text-primary/50 tabular-nums whitespace-nowrap">
                  {p.paymentDate ? formatDate(p.paymentDate) : "—"}
                </td>
                <td className="px-5 py-3 text-[13px] font-semibold text-primary tabular-nums whitespace-nowrap">
                  {formatAmount(p.amount)}
                </td>
                <td className="px-5 py-3 text-[12px] text-primary/60">{p.paymentMethod ?? "—"}</td>
                <td className="px-5 py-3 text-[12px] font-mono text-primary/40">{p.reference ?? "—"}</td>
                <td className="px-5 py-3 text-[12px] font-medium">
                  <span className={sc.color}>{sc.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab : Reçus ──────────────────────────────────────────────────────────────

const RECEIPT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  GENERATED: { label: "Généré",   color: "text-success" },
  PENDING:   { label: "En cours", color: "text-secondary" },
  CANCELLED: { label: "Annulé",   color: "text-danger" },
};

function ReceiptsTab({ rows, loading }: { rows: Receipt[]; loading: boolean }) {
  if (loading) return <TabLoader />;
  if (!rows.length) return <TabEmpty label="Aucun reçu disponible" />;

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-custom">
            {["N° Reçu", "Date", "Montant", "Statut"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom">
          {rows.map((r) => {
            const sc = RECEIPT_STATUS_LABELS[r.status] ?? { label: r.status, color: "text-primary/50" };
            const date = r.receiptDate ?? r.issuedAt ?? "";
            return (
              <tr key={r.id} className="hover:bg-primary/2">
                <td className="px-5 py-3 text-[12px] font-mono text-primary/70">{r.receiptNumber ?? "—"}</td>
                <td className="px-5 py-3 text-[12px] text-primary/50 tabular-nums whitespace-nowrap">
                  {date ? formatDate(date) : "—"}
                </td>
                <td className="px-5 py-3 text-[13px] font-semibold text-primary tabular-nums whitespace-nowrap">
                  {formatAmount(r.amount)}
                </td>
                <td className="px-5 py-3 text-[12px] font-medium">
                  <span className={sc.color}>{sc.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab : Ajustements ────────────────────────────────────────────────────────

const ADJ_TYPE_LABELS: Record<string, string> = {
  DISCOUNT:      "Remise",
  PENALTY:       "Pénalité",
  CORRECTION:    "Correction",
  RENT_REVISION: "Révision loyer",
  WAIVER:        "Dispense",
};

function AdjustmentsTab({ rows, loading }: { rows: Adjustment[]; loading: boolean }) {
  if (loading) return <TabLoader />;
  if (!rows.length) return <TabEmpty label="Aucun ajustement pour ce bail" />;

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-custom">
            {["Date", "Type", "Montant", "Motif"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-primary/35">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom">
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-primary/2">
              <td className="px-5 py-3 text-[12px] text-primary/50 tabular-nums whitespace-nowrap">
                {formatDate(a.appliedDate)}
              </td>
              <td className="px-5 py-3 text-[12px] text-primary/70">
                {ADJ_TYPE_LABELS[a.type] ?? a.type}
              </td>
              <td className="px-5 py-3 text-[13px] font-semibold tabular-nums whitespace-nowrap">
                <span className={a.amount < 0 ? "text-danger" : "text-success"}>
                  {a.amount >= 0 ? "+" : ""}{fmt.format(a.amount)} FCFA
                </span>
              </td>
              <td className="px-5 py-3 text-[12px] text-primary/60 max-w-xs truncate">
                {a.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 size={20} className="animate-spin text-primary/30" />
    </div>
  );
}

function TabEmpty({ label }: { label: string }) {
  return (
    <p className="py-10 text-center text-[13px] text-primary/35">{label}</p>
  );
}
