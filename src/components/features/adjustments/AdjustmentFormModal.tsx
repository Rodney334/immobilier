"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Percent, Gift, AlertTriangle, Wrench, TrendingUp, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { adjustmentService } from "@/lib/services/adjustment.service";
import { leaseService } from "@/lib/services/lease.service";
import { rentScheduleService } from "@/lib/services/rent-schedule.service";
import { incidentService } from "@/lib/services/incident.service";
import type {
  AdjustmentAppliesTo,
  AdjustmentBaseReference,
  AdjustmentType,
  AdjustmentValueMode,
  Incident,
  Lease,
  RentSchedule,
  WaiveUpcomingPayload,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** La liste est toujours rechargée par le parent après sauvegarde. */
  onSaved: () => void;
};

type Scope = "months" | "specific" | "single" | "full";
type WaiverMode = "total" | "fixed";

// ─── Constantes ───────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("fr-FR");

const TYPE_OPTIONS: { value: AdjustmentType; label: string; icon: React.ElementType }[] = [
  { value: "DISCOUNT", label: "Remise", icon: Percent },
  { value: "WAIVER", label: "Exonération", icon: Gift },
  { value: "PENALTY", label: "Pénalité", icon: AlertTriangle },
  { value: "CORRECTION", label: "Correction", icon: Wrench },
  { value: "RENT_REVISION", label: "Révision loyer", icon: TrendingUp },
];

const SCOPE_OPTIONS: { value: Scope; label: string; desc: string }[] = [
  { value: "months", label: "Les prochains mois", desc: "Exonère/réduit les N prochaines échéances non payées" },
  { value: "specific", label: "Échéances précises", desc: "Choisir des mois non consécutifs (ex: juillet et septembre)" },
  { value: "single", label: "Une seule échéance", desc: "Cible une échéance déjà existante" },
  { value: "full", label: "Jusqu'à la fin du bail", desc: "Toutes les échéances restantes, sans limite" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scheduleBalance(s: RentSchedule): number {
  if (typeof s.balance === "number") return s.balance;
  if (typeof s.remainingAmount === "number") return s.remainingAmount;
  const due = s.amountDue ?? s.amount ?? 0;
  const paid = s.amountPaid ?? s.paidAmount ?? 0;
  return Math.max(due - paid, 0);
}

function formatPeriod(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function leaseLabel(l: Lease): string {
  const ref = l.contractNumber ? `#${l.contractNumber}` : `#${(l.id ?? "").slice(-8).toUpperCase()}`;
  const tenant = l.tenant ? (l.tenant.fullName ?? `${l.tenant.firstName ?? ""} ${l.tenant.lastName ?? ""}`.trim()) : "";
  const unit = l.unit ? `${l.unit.property?.name ?? ""} ${l.unit.unitNumber ? `Apt ${l.unit.unitNumber}` : ""}`.trim() : "";
  return [ref, tenant, unit].filter(Boolean).join(" — ");
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AdjustmentFormModal({ isOpen, onClose, onSaved }: Props) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loadingLeases, setLoadingLeases] = useState(false);
  const [leaseId, setLeaseId] = useState("");

  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [incidentId, setIncidentId] = useState("");

  const [appliesTo, setAppliesTo] = useState<AdjustmentAppliesTo>("RENT");

  const [type, setType] = useState<AdjustmentType>("DISCOUNT");
  const [scope, setScope] = useState<Scope>("months");
  const [waiverMode, setWaiverMode] = useState<WaiverMode>("fixed");

  const [amount, setAmount] = useState("");
  const [valueModeChoice, setValueModeChoice] = useState<AdjustmentValueMode>("FIXED");
  const [baseReference, setBaseReference] = useState<AdjustmentBaseReference>("LEASE_MONTHLY_RENT");
  const [monthsCount, setMonthsCount] = useState("3");
  const [startFromDate, setStartFromDate] = useState("");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [singleScheduleId, setSingleScheduleId] = useState("");
  const [correctionSign, setCorrectionSign] = useState<"+" | "-">("-");
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWaiverGroup = type === "DISCOUNT" || type === "WAIVER";
  const isDeposit = appliesTo === "DEPOSIT";
  const selectedLease = leases.find((l) => l.id === leaseId) ?? null;
  const rentAmount = selectedLease ? Number(selectedLease.monthlyRent) : 0;
  const unitBaseRent = selectedLease?.unit?.baseRent ? Number(selectedLease.unit.baseRent) : 0;

  // Le montant peut être exprimé en % plutôt qu'en FCFA pour Remise,
  // Exonération (en mode "montant fixe"), Pénalité et Correction.
  // Exclu pour Révision loyer (le back fixe le loyer AU résultat du calcul,
  // pas à une augmentation — mieux vaut rester en FIXED, cf. doc API) et pour
  // une retenue sur caution (non documenté, on reste prudent en FIXED).
  const percentageEligible =
    !isDeposit &&
    ((isWaiverGroup && waiverMode === "fixed") || type === "PENALTY" || type === "CORRECTION");
  const isPercentageMode = percentageEligible && valueModeChoice === "PERCENTAGE";
  // Montant FCFA équivalent — utilisé pour l'affichage et pour les portées
  // groupées (waive-upcoming), qui n'acceptent qu'un montant fixe en FCFA.
  const baseAmountForPercentage = baseReference === "UNIT_BASE_RENT" ? unitBaseRent : rentAmount;
  const effectiveAmountFcfa = isPercentageMode
    ? Math.round((baseAmountForPercentage * Number(amount || 0)) / 100)
    : Number(amount || 0);

  // ── Reset à l'ouverture ──
  useEffect(() => {
    if (!isOpen) return;
    setLeaseId("");
    setSchedules([]);
    setIncidents([]);
    setIncidentId("");
    setAppliesTo("RENT");
    setType("DISCOUNT");
    setScope("months");
    setWaiverMode("fixed");
    setAmount("");
    setValueModeChoice("FIXED");
    setBaseReference("LEASE_MONTHLY_RENT");
    setMonthsCount("3");
    setStartFromDate("");
    setSelectedScheduleIds([]);
    setSingleScheduleId("");
    setCorrectionSign("-");
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setReason("");
    setError(null);
    setLoadingLeases(true);
    leaseService
      .getAll({ limit: 200, status: "ACTIVE" })
      .then((res) => setLeases(res.data))
      .catch(() => {})
      .finally(() => setLoadingLeases(false));
  }, [isOpen]);

  // ── Charger les échéances + incidents du bail sélectionné ──
  useEffect(() => {
    if (!leaseId) {
      setSchedules([]);
      setIncidents([]);
      return;
    }
    setLoadingSchedules(true);
    rentScheduleService
      .getAll({ lease: leaseId, limit: 500 })
      .then((res) => {
        // Filtre de sécurité : le paramètre "lease" de l'API ne semble pas
        // toujours appliqué côté serveur (des échéances d'autres baux
        // remontaient dans la liste). On ne garde que celles du bail choisi.
        const list = (res.data ?? [])
          .filter((s) => s.leaseId === leaseId)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setSchedules(list);
      })
      .catch(() => setSchedules([]))
      .finally(() => setLoadingSchedules(false));

    setLoadingIncidents(true);
    incidentService
      .getAll({ leaseId, limit: 100 })
      .then((res) => setIncidents(res.data ?? []))
      .catch(() => setIncidents([]))
      .finally(() => setLoadingIncidents(false));
  }, [leaseId]);

  // ── Réinitialiser les champs spécifiques au type quand il change ──
  useEffect(() => {
    setAmount("");
    setValueModeChoice("FIXED");
    setSelectedScheduleIds([]);
    setSingleScheduleId("");
    if (type === "WAIVER") setWaiverMode("total");
    if (type === "DISCOUNT") setWaiverMode("fixed");
    if (type === "PENALTY" || type === "CORRECTION") setScope("single");
    else setScope("months");
  }, [type]);

  // ── Contraintes spécifiques à "Caution" (DEPOSIT) ──
  // Une retenue sur caution ne se rattache à aucune échéance : pas de portée,
  // pas de sélection d'échéance, pas de mode pourcentage, et une révision de
  // loyer n'a pas de sens ici.
  useEffect(() => {
    if (!isDeposit) return;
    setScope("single");
    setWaiverMode("fixed");
    setValueModeChoice("FIXED");
    setSingleScheduleId("");
    setSelectedScheduleIds([]);
    if (type === "RENT_REVISION") setType("CORRECTION");
  }, [isDeposit, type]);

  const targetableSchedules = useMemo(
    () => schedules.filter((s) => s.status !== "CANCELLED"),
    [schedules],
  );
  const waivableSchedules = useMemo(
    () => schedules.filter((s) => s.status !== "PAID" && s.status !== "CANCELLED"),
    [schedules],
  );

  // ── Texte d'information dynamique ──
  const infoText = useMemo(() => {
    const amtNum = Number(amount);
    // Libellé de la réduction : "X FCFA" ou "X% (≈ Y FCFA)" si mode pourcentage.
    const reductionLabel = isPercentageMode
      ? `${amtNum}% (≈ ${fmt.format(effectiveAmountFcfa)} FCFA)`
      : `${fmt.format(amtNum)} FCFA`;

    if (isDeposit) {
      if (!amount) return "";
      if (type === "CORRECTION") {
        return `La caution sera ${correctionSign === "-" ? "réduite" : "augmentée"} de ${fmt.format(amtNum)} FCFA.`;
      }
      if (type === "PENALTY") {
        return `Une retenue de ${fmt.format(amtNum)} FCFA sera appliquée sur la caution.`;
      }
      if (isWaiverGroup) {
        return `La caution sera réduite de ${fmt.format(amtNum)} FCFA.`;
      }
      return "";
    }

    if (isWaiverGroup) {
      if (scope === "months") {
        const n = Number(monthsCount) || 0;
        if (n <= 0) return "";
        return waiverMode === "total"
          ? `Le locataire ne paiera rien sur ${n === 1 ? "sa prochaine échéance" : `ses ${n} prochaines échéances`} (${fmt.format(rentAmount)} FCFA/mois).`
          : amount
            ? `${n} échéance${n > 1 ? "s" : ""} réduite${n > 1 ? "s" : ""} de ${reductionLabel} chacune${startFromDate ? `, à partir de ${formatPeriod(startFromDate)}` : ""}.`
            : "";
      }
      if (scope === "specific") {
        const n = selectedScheduleIds.length;
        if (n === 0) return "";
        return waiverMode === "total"
          ? `${n} échéance${n > 1 ? "s" : ""} sélectionnée${n > 1 ? "s" : ""} seront intégralement exonérées.`
          : amount
            ? `${n} échéance${n > 1 ? "s" : ""} sélectionnée${n > 1 ? "s" : ""} seront réduites de ${reductionLabel} chacune.`
            : "";
      }
      if (scope === "full") {
        return waiverMode === "total"
          ? "Toutes les échéances restantes de ce bail seront intégralement exonérées."
          : amount
            ? `Toutes les échéances restantes seront réduites de ${reductionLabel} chacune.`
            : "";
      }
      if (scope === "single") {
        if (!singleScheduleId) return "";
        return waiverMode === "total"
          ? "L'échéance sélectionnée sera intégralement exonérée."
          : amount
            ? `L'échéance sélectionnée sera réduite de ${reductionLabel}.`
            : "";
      }
    }
    if (type === "RENT_REVISION" && amount) {
      return `Le loyer mensuel passera à ${fmt.format(amtNum)} FCFA à partir du ${formatDateShort(effectiveDate)}.`;
    }
    if (type === "PENALTY" && amount && singleScheduleId) {
      return `Une pénalité de ${reductionLabel} sera ajoutée à l'échéance sélectionnée.`;
    }
    if (type === "CORRECTION" && amount && singleScheduleId) {
      return `Le montant dû sera ${correctionSign === "-" ? "réduit" : "augmenté"} de ${reductionLabel}.`;
    }
    return "";
  }, [isDeposit, isWaiverGroup, scope, waiverMode, amount, monthsCount, startFromDate, selectedScheduleIds, singleScheduleId, type, effectiveDate, correctionSign, rentAmount, isPercentageMode, effectiveAmountFcfa]);

  function toggleScheduleId(id: string) {
    setSelectedScheduleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    setError(null);
    if (!leaseId) {
      setError("Sélectionnez un bail.");
      return;
    }

    setSubmitting(true);
    try {
      const isoEffectiveDate = new Date(effectiveDate).toISOString();
      const appliesToPayload = isDeposit ? ("DEPOSIT" as const) : undefined;
      const incidentIdPayload = incidentId || undefined;

      if (isWaiverGroup) {
        const amtRaw = waiverMode === "fixed" ? Number(amount) : undefined;
        if (waiverMode === "fixed" && (!amount || isNaN(amtRaw as number) || (amtRaw as number) <= 0)) {
          throw new Error("Le montant de la remise doit être supérieur à 0.");
        }
        if (isPercentageMode && (amtRaw as number) > 100) {
          throw new Error("Le pourcentage ne peut pas dépasser 100%.");
        }

        if (scope === "single") {
          if (!isDeposit && !singleScheduleId) throw new Error("Sélectionnez une échéance.");
          const target = !isDeposit ? schedules.find((s) => s.id === singleScheduleId) : undefined;

          if (waiverMode === "total") {
            // Exonération totale : on calcule le solde restant de l'échéance
            // ciblée (jamais disponible pour une caution — cas exclu par l'UI).
            const finalAmount = target ? scheduleBalance(target) : 0;
            if (!finalAmount || finalAmount <= 0) {
              throw new Error("Cette échéance ne peut pas être ajustée (montant dû nul).");
            }
            await adjustmentService.create({
              rentScheduleId: isDeposit ? undefined : singleScheduleId,
              leaseId,
              type,
              amount: String(finalAmount),
              appliesTo: appliesToPayload,
              incidentId: incidentIdPayload,
              reason: reason || (type === "WAIVER" ? "Exonération" : "Remise"),
              effectiveDate: isoEffectiveDate,
            });
          } else if (isPercentageMode) {
            // Mode pourcentage : on n'envoie pas "amount", le back le calcule
            // à partir de percentage + baseReference.
            if (!amount || Number(amount) <= 0 || Number(amount) > 100) {
              throw new Error("Le pourcentage doit être compris entre 0 et 100.");
            }
            await adjustmentService.create({
              rentScheduleId: singleScheduleId,
              leaseId,
              type,
              valueMode: "PERCENTAGE",
              percentage: String(Number(amount)),
              baseReference,
              appliesTo: appliesToPayload,
              incidentId: incidentIdPayload,
              reason: reason || "Remise",
              effectiveDate: isoEffectiveDate,
            });
          } else {
            await adjustmentService.create({
              rentScheduleId: isDeposit ? undefined : singleScheduleId,
              leaseId,
              type,
              amount: String(amtRaw),
              appliesTo: appliesToPayload,
              incidentId: incidentIdPayload,
              reason: reason || (type === "WAIVER" ? "Exonération" : "Remise"),
              effectiveDate: isoEffectiveDate,
            });
          }
        } else {
          // Les portées groupées (waive-upcoming) n'ont pas de notion de
          // pourcentage — on convertit en FCFA côté client avant l'envoi.
          // (Non disponible pour une retenue sur caution, cas exclu par l'UI.)
          const payload: WaiveUpcomingPayload = {
            leaseId,
            amount: waiverMode === "fixed" ? effectiveAmountFcfa : undefined,
            reason: reason || undefined,
          };
          if (scope === "months") {
            const n = Number(monthsCount);
            if (!n || n <= 0) throw new Error("Le nombre de mois doit être supérieur à 0.");
            payload.monthsCount = n;
            if (startFromDate) payload.startFromDate = startFromDate;
          } else if (scope === "specific") {
            if (selectedScheduleIds.length === 0) throw new Error("Sélectionnez au moins une échéance.");
            payload.rentScheduleIds = selectedScheduleIds;
          } else if (scope === "full") {
            if (startFromDate) payload.startFromDate = startFromDate;
          }
          await adjustmentService.waiveUpcoming(payload);
        }
      } else if (type === "RENT_REVISION") {
        if (!amount || Number(amount) <= 0) {
          throw new Error("Le nouveau montant du loyer doit être supérieur à 0.");
        }
        await adjustmentService.create({
          leaseId,
          type: "RENT_REVISION",
          amount: String(Number(amount)),
          reason: reason || "Révision de loyer",
          effectiveDate: isoEffectiveDate,
        });
      } else {
        // PENALTY / CORRECTION → une seule échéance obligatoire (sauf caution)
        if (!isDeposit && !singleScheduleId) throw new Error("Sélectionnez une échéance à cibler.");
        if (!amount || Number(amount) <= 0) throw new Error("Le montant doit être supérieur à 0.");

        if (isPercentageMode) {
          if (Number(amount) > 100) throw new Error("Le pourcentage ne peut pas dépasser 100%.");
          // Mode pourcentage : pas de "amount", le back calcule à partir de
          // percentage + baseReference. Pour la Correction, le signe porte
          // aussi sur le pourcentage (même logique qu'en mode montant fixe).
          const signedPercentage =
            type === "CORRECTION" && correctionSign === "-" ? -Number(amount) : Number(amount);
          await adjustmentService.create({
            rentScheduleId: isDeposit ? undefined : singleScheduleId,
            leaseId,
            type,
            valueMode: "PERCENTAGE",
            percentage: String(signedPercentage),
            baseReference,
            appliesTo: appliesToPayload,
            incidentId: incidentIdPayload,
            reason: reason || (type === "PENALTY" ? "Pénalité" : "Correction"),
            effectiveDate: isoEffectiveDate,
          });
        } else {
          const signedAmount =
            type === "CORRECTION" && correctionSign === "-" ? -Number(amount) : Number(amount);
          await adjustmentService.create({
            rentScheduleId: isDeposit ? undefined : singleScheduleId,
            leaseId,
            type,
            amount: String(signedAmount),
            appliesTo: appliesToPayload,
            incidentId: incidentIdPayload,
            reason: reason || (type === "PENALTY" ? "Pénalité" : "Correction"),
            effectiveDate: isoEffectiveDate,
          });
        }
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  const showScopeSelector = isWaiverGroup && !isDeposit;
  const showAmountToggle = isWaiverGroup;
  const showAmountField =
    (isWaiverGroup && waiverMode === "fixed") ||
    type === "RENT_REVISION" ||
    type === "PENALTY" ||
    type === "CORRECTION";
  const showSingleScheduleSelect =
    !isDeposit && ((isWaiverGroup && scope === "single") || type === "PENALTY" || type === "CORRECTION");
  const showSpecificSchedules = isWaiverGroup && scope === "specific" && !isDeposit;
  const showMonthsFields = isWaiverGroup && scope === "months" && !isDeposit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvel ajustement"
      maxWidth="540px"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} className="ep-btn ep-btn-ghost">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !leaseId}
            className="ep-btn ep-btn-primary"
            style={{ opacity: submitting || !leaseId ? 0.6 : 1, minWidth: 140 }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Appliquer
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--rouge-soft)",
              border: "1px solid rgba(168,67,47,0.2)",
              fontSize: 13,
              color: "var(--rouge)",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Bail */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Bail <span className="text-danger ml-1">*</span>
          </label>
          <select
            value={leaseId}
            onChange={(e) => setLeaseId(e.target.value)}
            disabled={loadingLeases}
            className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 disabled:bg-neutral transition-colors"
          >
            <option value="">{loadingLeases ? "Chargement..." : "Sélectionner un bail"}</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {leaseLabel(l)}
              </option>
            ))}
          </select>
          {selectedLease && (
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
              Loyer : {fmt.format(rentAmount)} FCFA/mois
            </p>
          )}
        </div>

        {/* S'applique à — Loyer / Caution */}
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>S&apos;applique à</div>
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { value: "RENT" as const, label: "Loyer" },
              { value: "DEPOSIT" as const, label: "Caution (dépôt de garantie)" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAppliesTo(value)}
                className="ep-btn"
                style={{
                  flex: 1,
                  fontSize: 13,
                  border: appliesTo === value ? "1px solid rgba(193,98,45,0.4)" : "1px solid var(--paper-line)",
                  background: appliesTo === value ? "rgba(193,98,45,0.08)" : "var(--paper-raised)",
                  color: appliesTo === value ? "var(--terracotta)" : "var(--ink)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {isDeposit && (
            <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6 }}>
              Une retenue sur caution ne se rattache à aucune échéance de loyer.
            </p>
          )}
        </div>

        {/* Type d'ajustement */}
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>Type d&apos;ajustement</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = type === value;
              const disabled = isDeposit && value === "RENT_REVISION";
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => !disabled && setType(value)}
                  disabled={disabled}
                  title={disabled ? "Non disponible pour une retenue sur caution" : undefined}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "10px 4px",
                    fontSize: 12,
                    borderRadius: "var(--r-md)",
                    border: active ? "1px solid rgba(193,98,45,0.4)" : "1px solid var(--paper-line)",
                    background: active ? "rgba(193,98,45,0.08)" : "var(--paper-raised)",
                    color: disabled ? "var(--ink-soft)" : active ? "var(--terracotta)" : "var(--ink)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.45 : 1,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <Icon size={18} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Portée — Remise / Exonération uniquement (pas pour une caution) */}
        {showScopeSelector && (
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>Portée</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SCOPE_OPTIONS.map(({ value, label, desc }) => {
                const active = scope === value;
                return (
                  <label
                    key={value}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: "var(--r-md)",
                      border: active ? "1px solid rgba(193,98,45,0.4)" : "1px solid var(--paper-line)",
                      background: active ? "rgba(193,98,45,0.05)" : "var(--paper-raised)",
                      cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={active}
                      onChange={() => setScope(value)}
                      style={{ marginTop: 3, flexShrink: 0, accentColor: "var(--terracotta)" }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{label}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Nombre de mois + à partir du (scope = months) */}
        {showMonthsFields && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre de mois"
              type="number"
              min={1}
              value={monthsCount}
              onChange={(e) => setMonthsCount(e.target.value)}
            />
            <Input
              label="À partir du (optionnel)"
              type="date"
              value={startFromDate}
              onChange={(e) => setStartFromDate(e.target.value)}
            />
          </div>
        )}

        {/* À partir du — scope = full uniquement */}
        {isWaiverGroup && !isDeposit && scope === "full" && (
          <Input
            label="À partir du (optionnel)"
            type="date"
            value={startFromDate}
            onChange={(e) => setStartFromDate(e.target.value)}
          />
        )}

        {/* Échéances précises (scope = specific) */}
        {showSpecificSchedules && (
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>
              Échéances à cibler{" "}
              <span style={{ opacity: 0.7 }}>({selectedScheduleIds.length} sélectionnée{selectedScheduleIds.length > 1 ? "s" : ""})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 220, overflowY: "auto" }}>
              {loadingSchedules ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
                </div>
              ) : waivableSchedules.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--ink-soft)", opacity: 0.7, padding: "8px 0" }}>
                  Aucune échéance non soldée pour ce bail.
                </p>
              ) : (
                waivableSchedules.map((s) => {
                  const checked = selectedScheduleIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: "var(--r-md)",
                        border: checked ? "1px solid rgba(193,98,45,0.4)" : "1px solid var(--paper-line)",
                        background: checked ? "rgba(193,98,45,0.05)" : "var(--paper-raised)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleScheduleId(s.id)}
                          style={{ accentColor: "var(--terracotta)" }}
                        />
                        <span style={{ fontSize: 13, color: "var(--ink)" }}>{formatPeriod(s.dueDate)}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>
                        {fmt.format(scheduleBalance(s))} FCFA
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Échéance unique — scope = single OU type PENALTY/CORRECTION (pas pour une caution) */}
        {showSingleScheduleSelect && (
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Échéance ciblée <span className="text-danger ml-1">*</span>
            </label>
            <select
              value={singleScheduleId}
              onChange={(e) => setSingleScheduleId(e.target.value)}
              disabled={loadingSchedules || !leaseId}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 disabled:bg-neutral transition-colors"
            >
              <option value="">
                {loadingSchedules ? "Chargement..." : "Sélectionner une échéance"}
              </option>
              {(isWaiverGroup ? waivableSchedules : targetableSchedules).map((s) => (
                <option key={s.id} value={s.id}>
                  {formatPeriod(s.dueDate)} — dû {formatDateShort(s.dueDate)} — reste {fmt.format(scheduleBalance(s))} FCFA
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Toggle exonération totale / montant fixe (masqué pour une caution) */}
        {showAmountToggle && !isDeposit && (
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>Type de réduction</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setWaiverMode("total")}
                className="ep-btn"
                style={{
                  flex: 1,
                  fontSize: 13,
                  border: waiverMode === "total" ? "1px solid rgba(193,98,45,0.4)" : "1px solid var(--paper-line)",
                  background: waiverMode === "total" ? "rgba(193,98,45,0.08)" : "var(--paper-raised)",
                  color: waiverMode === "total" ? "var(--terracotta)" : "var(--ink)",
                }}
              >
                Exonération totale
              </button>
              <button
                type="button"
                onClick={() => setWaiverMode("fixed")}
                className="ep-btn"
                style={{
                  flex: 1,
                  fontSize: 13,
                  border: waiverMode === "fixed" ? "1px solid rgba(193,98,45,0.4)" : "1px solid var(--paper-line)",
                  background: waiverMode === "fixed" ? "rgba(193,98,45,0.08)" : "var(--paper-raised)",
                  color: waiverMode === "fixed" ? "var(--terracotta)" : "var(--ink)",
                }}
              >
                Montant fixe
              </button>
            </div>
          </div>
        )}

        {/* Montant / Nouveau loyer + sign correction + date d'effet */}
        {(showAmountField || (isWaiverGroup && scope === "single")) && (
          <div className="grid grid-cols-2 gap-3">
            {showAmountField && (
              <div className={type === "CORRECTION" || percentageEligible ? "space-y-1.5" : undefined}>
                {type === "CORRECTION" ? (
                  <>
                    <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
                      Montant *
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <select
                        value={correctionSign}
                        onChange={(e) => setCorrectionSign(e.target.value as "+" | "-")}
                        className="h-11 px-2 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        style={{ width: 56, flexShrink: 0 }}
                      >
                        <option value="-">−</option>
                        <option value="+">+</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={valueModeChoice === "PERCENTAGE" ? 100 : undefined}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={valueModeChoice === "PERCENTAGE" ? "ex : 10" : "ex : 5000"}
                        className="flex-1 h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                      />
                      {percentageEligible && (
                        <select
                          value={valueModeChoice}
                          onChange={(e) => setValueModeChoice(e.target.value as AdjustmentValueMode)}
                          className="h-11 px-2 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                          style={{ width: 62, flexShrink: 0 }}
                        >
                          <option value="FIXED">FCFA</option>
                          <option value="PERCENTAGE">%</option>
                        </select>
                      )}
                    </div>
                  </>
                ) : percentageEligible ? (
                  <>
                    <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
                      {type === "PENALTY" ? "Montant de la pénalité *" : "Montant de la remise *"}
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="number"
                        min={1}
                        max={valueModeChoice === "PERCENTAGE" ? 100 : undefined}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={valueModeChoice === "PERCENTAGE" ? "ex : 10" : "ex : 20000"}
                        className="flex-1 h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                      />
                      <select
                        value={valueModeChoice}
                        onChange={(e) => setValueModeChoice(e.target.value as AdjustmentValueMode)}
                        className="h-11 px-2 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        style={{ width: 68, flexShrink: 0 }}
                      >
                        <option value="FIXED">FCFA</option>
                        <option value="PERCENTAGE">%</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <Input
                    label={
                      type === "RENT_REVISION"
                        ? "Nouveau loyer *"
                        : type === "PENALTY"
                          ? "Montant de la pénalité *"
                          : "Montant *"
                    }
                    type="number"
                    min={1}
                    placeholder="ex : 20000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                )}
              </div>
            )}
            {(type === "RENT_REVISION" ||
              type === "PENALTY" ||
              type === "CORRECTION" ||
              (isWaiverGroup && scope === "single")) && (
              <Input
                label="Date d'effet *"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            )}
          </div>
        )}

        {/* Base de calcul — uniquement en mode pourcentage */}
        {isPercentageMode && (
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Base de calcul
            </label>
            <select
              value={baseReference}
              onChange={(e) => setBaseReference(e.target.value as AdjustmentBaseReference)}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
            >
              <option value="LEASE_MONTHLY_RENT">Loyer du contrat ({fmt.format(rentAmount)} FCFA)</option>
              <option value="UNIT_BASE_RENT">Loyer de base du local ({fmt.format(unitBaseRent)} FCFA)</option>
            </select>
          </div>
        )}

        {/* Incident lié — uniquement pour une retenue sur caution */}
        {isDeposit && (
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
              Incident lié <span className="text-primary/30 font-normal normal-case tracking-normal">(optionnel)</span>
            </label>
            <select
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              disabled={loadingIncidents}
              className="w-full h-11 px-3 rounded-lg border border-border-custom bg-white text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 disabled:bg-neutral transition-colors"
            >
              <option value="">
                {loadingIncidents ? "Chargement..." : "Aucun incident lié"}
              </option>
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bandeau d'information dynamique */}
        {infoText && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              background: "rgba(28,43,39,0.03)",
              fontSize: 13,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
            }}
          >
            <Info size={15} style={{ flexShrink: 0, marginTop: 1, opacity: 0.6 }} />
            {infoText}
          </div>
        )}

        {/* Motif */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium uppercase tracking-[0.06em] text-primary/60">
            Motif <span className="text-primary/30 font-normal normal-case tracking-normal">(optionnel)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="ex : travaux dans le local pendant 3 mois"
            className="w-full px-3 py-2.5 rounded-lg border border-border-custom bg-white text-[14px] text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-colors"
          />
        </div>
      </div>
    </Modal>
  );
}
