"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Info,
  ChevronDown,
  ChevronRight,
  Wallet,
  Download,
  Check,
  X as XIcon,
  RotateCcw,
  Building2,
} from "lucide-react";
import { ownerService } from "@/lib/services/owner.service";
import { Badge } from "@/components/ui/Badge";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { CreatePayoutModal } from "@/components/features/owners/CreatePayoutModal";
import { ResetAccountModal } from "@/components/features/owners/ResetAccountModal";
import type { OwnerStatement, OwnerPayout, OwnerPayoutStatus } from "@/types";

type Props = {
  ownerId: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtFull = (n: number | undefined | null) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(n ?? 0))} FCFA`;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateShort(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const PAYOUT_STATUS_BADGE: Record<OwnerPayoutStatus, { label: string; variant: "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Brouillon", variant: "warning" },
  PAID: { label: "Versé", variant: "success" },
  CANCELLED: { label: "Annulé", variant: "danger" },
};

// ─── Section repliable générique ──────────────────────────────────────────────

function CollapsibleSection({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", background: "var(--paper-raised)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {title}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)", fontWeight: 400 }}>
            ({count})
          </span>
        </span>
      </button>
      {open && <div style={{ borderTop: "1px solid var(--paper-line)" }}>{children}</div>}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function OwnerAccountPanel({ ownerId }: Props) {
  const [statement, setStatement] = useState<OwnerStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ignoreCutoff, setIgnoreCutoff] = useState(false);

  const [payouts, setPayouts] = useState<OwnerPayout[]>([]);
  const [payoutsTotal, setPayoutsTotal] = useState(0);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsLimit, setPayoutsLimit] = useState(10);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busyPayoutId, setBusyPayoutId] = useState<string | null>(null);

  const loadStatement = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await ownerService.getStatement(ownerId, {
        from: from || undefined,
        to: to || undefined,
        ignoreCutoff: ignoreCutoff || undefined,
      });
      setStatement(res.data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Impossible de charger le relevé de compte.");
      setStatement(null);
    } finally {
      setLoading(false);
    }
  }, [ownerId, from, to, ignoreCutoff]);

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const res = await ownerService.getPayouts(ownerId, { page: payoutsPage, limit: payoutsLimit });
      setPayouts(res.data);
      setPayoutsTotal(res.meta?.total ?? res.data.length);
    } catch {
      /* silent */
    } finally {
      setPayoutsLoading(false);
    }
  }, [ownerId, payoutsPage, payoutsLimit]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  function refreshAll() {
    loadStatement();
    loadPayouts();
  }

  async function handleConfirmPayout(id: string) {
    setBusyPayoutId(id);
    try {
      await ownerService.markPayoutPaid(id, { paidAt: new Date().toISOString() });
      refreshAll();
    } catch {
      alert("Impossible de confirmer ce versement.");
    } finally {
      setBusyPayoutId(null);
    }
  }

  async function handleCancelPayout(id: string) {
    if (!confirm("Annuler ce versement ? La période redeviendra exigible et réapparaîtra dans le prochain relevé.")) return;
    setBusyPayoutId(id);
    try {
      await ownerService.cancelPayout(id);
      refreshAll();
    } catch {
      alert("Impossible d'annuler ce versement.");
    } finally {
      setBusyPayoutId(null);
    }
  }

  async function handleDownloadReceipt(id: string, reference?: string | null) {
    setBusyPayoutId(id);
    try {
      const blob = await ownerService.downloadPayoutReceipt(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-${reference ?? id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Reçu indisponible pour ce versement.");
    } finally {
      setBusyPayoutId(null);
    }
  }

  if (loading && !statement) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
      </div>
    );
  }

  if (loadError && !statement) {
    return (
      <div style={{ padding: "14px 18px", background: "var(--rouge-soft)", border: "1px solid rgba(168,67,47,0.2)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--rouge)" }}>
        {loadError}
      </div>
    );
  }

  const s = statement?.summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── En-tête : période + historique complet ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Du</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ep-chip"
            style={{ height: 32, cursor: "pointer" }}
          />
          <label style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>au</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ep-chip"
            style={{ height: 32, cursor: "pointer" }}
          />
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); }}
              className="ep-btn ep-btn-ghost"
              style={{ padding: "5px 10px", fontSize: 11.5 }}
            >
              Réinitialiser
            </button>
          )}
        </div>
        <button
          onClick={() => setIgnoreCutoff((v) => !v)}
          className={ignoreCutoff ? "ep-chip active" : "ep-chip"}
          style={{ height: 32 }}
        >
          {ignoreCutoff ? "Historique complet" : "Voir tout l'historique"}
        </button>
        {loading && <Loader2 size={14} className="animate-spin" style={{ color: "var(--ink-soft)" }} />}
      </div>

      {/* ── Bandeau borne de remise à zéro ── */}
      {statement?.period.cutoffApplied && statement.period.cutoff && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "#FAEEDA",
            border: "1px solid rgba(186,117,23,0.25)",
            borderRadius: "var(--r-md)",
          }}
        >
          <Info size={15} style={{ color: "#854F0B", flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "#5c3a08", lineHeight: 1.5 }}>
            Compte arrêté au <strong>{fmtDate(statement.period.cutoff.periodEnd)}</strong> ({statement.period.cutoff.label}).
            Les écritures antérieures ne sont plus comptées.{" "}
            <button
              onClick={() => setIgnoreCutoff(true)}
              style={{ color: "#854F0B", textDecoration: "underline", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}
            >
              Voir tout l&apos;historique
            </button>
          </p>
        </div>
      )}

      {/* ── Cascade de calcul ── */}
      {s && (
        <div className="ep-side-card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <p className="ep-side-card-title">Synthèse de la période</p>
          {[
            { label: "Loyers encaissés", value: s.rentCollected, strong: false },
            { label: "− Interventions à sa charge", value: -s.incidentCharges, strong: false },
            { label: "− Retenues sur loyer", value: -s.adjustmentCharges, strong: false },
            { label: `− Commission de gestion (${s.managementFeePercent}%)`, value: -s.managementFeeAmount, strong: false },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, color: "var(--ink-soft)" }}>
              <span>{row.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: row.value < 0 ? "var(--rouge)" : "var(--ink)" }}>
                {row.value < 0 ? "−" : ""}{fmtFull(Math.abs(row.value))}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--paper-line)", marginTop: 4, fontSize: 14, fontWeight: 600 }}>
            <span style={{ color: "var(--ink)" }}>= Net dû</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{fmtFull(s.netDue)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, color: "var(--ink-soft)" }}>
            <span>− Déjà reversé</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{fmtFull(s.paidInPeriod)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0 4px",
              borderTop: "1px solid var(--paper-line)",
              marginTop: 4,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            <span style={{ color: "var(--sauge)" }}>= Reste à reverser</span>
            <span style={{ fontFamily: "var(--font-display)", color: "var(--sauge)" }}>{fmtFull(s.balanceDue)}</span>
          </div>

          {/* Mentions hors calcul */}
          {(s.incidentsRebilled > 0 || s.depositDeductions > 0) && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--paper-line)", display: "flex", flexDirection: "column", gap: 4 }}>
              {s.incidentsRebilled > 0 && (
                <p style={{ fontSize: 11.5, color: "var(--ink-soft)", opacity: 0.8 }}>
                  dont {fmtFull(s.incidentsRebilled)} refacturé au locataire — sans impact sur ce compte
                </p>
              )}
              {s.depositDeductions > 0 && (
                <p style={{ fontSize: 11.5, color: "var(--ink-soft)", opacity: 0.8 }}>
                  dont {fmtFull(s.depositDeductions)} retenu sur caution — sans impact sur ce compte
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <button onClick={() => setCreateOpen(true)} className="ep-btn ep-btn-primary">
          <Wallet size={14} aria-hidden="true" />
          Enregistrer un reversement
        </button>
        <button
          onClick={() => setResetOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-soft)", textDecoration: "underline", display: "flex", alignItems: "center", gap: 6 }}
        >
          <RotateCcw size={12} aria-hidden="true" />
          Remettre le compte à zéro
        </button>
      </div>

      {/* ── Tableaux détaillés ── */}
      {statement && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="ep-section-label" style={{ margin: "6px 0 0" }}>Détail de la période</div>

          <CollapsibleSection title="Loyers encaissés" count={statement.details.rent.length}>
            {statement.details.rent.length === 0 ? (
              <p style={{ padding: "16px", fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>Aucun loyer encaissé sur cette période.</p>
            ) : (
              <table className="ep-table">
                <thead>
                  <tr>
                    <th className="ep-th">Date</th>
                    <th className="ep-th">Local</th>
                    <th className="ep-th">Locataire</th>
                    <th className="ep-th">Mode</th>
                    <th className="ep-th" style={{ textAlign: "right" }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.details.rent.map((r) => (
                    <tr key={r.id} className="ep-tr" style={{ cursor: "default" }}>
                      <td className="ep-td">{fmtDateShort(r.date)}</td>
                      <td className="ep-td">{r.unitLabel}</td>
                      <td className="ep-td">{r.tenantName}</td>
                      <td className="ep-td ep-mono">{r.method}</td>
                      <td className="ep-td" style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmtFull(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Incidents" count={statement.details.incidents.length}>
            {statement.details.incidents.length === 0 ? (
              <p style={{ padding: "16px", fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>Aucun incident sur cette période.</p>
            ) : (
              <table className="ep-table">
                <thead>
                  <tr>
                    <th className="ep-th">Date</th>
                    <th className="ep-th">Local</th>
                    <th className="ep-th">Intervention</th>
                    <th className="ep-th">Imputation</th>
                    <th className="ep-th" style={{ textAlign: "right" }}>Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.details.incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className="ep-tr"
                      style={{ cursor: "default", opacity: inc.chargedToOwner ? 1 : 0.55 }}
                    >
                      <td className="ep-td">{fmtDateShort(inc.date)}</td>
                      <td className="ep-td">{inc.unitLabel}</td>
                      <td className="ep-td">{inc.title}</td>
                      <td className="ep-td">
                        {inc.chargedToOwner ? (
                          <Badge variant="neutral">À sa charge</Badge>
                        ) : (
                          <Badge variant="info">Refacturé au locataire</Badge>
                        )}
                      </td>
                      <td className="ep-td" style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmtFull(inc.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Ajustements" count={statement.details.adjustments.length}>
            {statement.details.adjustments.length === 0 ? (
              <p style={{ padding: "16px", fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>Aucun ajustement sur cette période.</p>
            ) : (
              <table className="ep-table">
                <thead>
                  <tr>
                    <th className="ep-th">Date</th>
                    <th className="ep-th">Local</th>
                    <th className="ep-th">Locataire</th>
                    <th className="ep-th">Motif</th>
                    <th className="ep-th">Imputé sur</th>
                    <th className="ep-th" style={{ textAlign: "right" }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.details.adjustments.map((adj) => (
                    <tr key={adj.id} className="ep-tr" style={{ cursor: "default", opacity: adj.chargedToOwner ? 1 : 0.55 }}>
                      <td className="ep-td">{fmtDateShort(adj.date)}</td>
                      <td className="ep-td">{adj.unitLabel}</td>
                      <td className="ep-td">{adj.tenantName}</td>
                      <td className="ep-td">{adj.label || adj.reason || "—"}</td>
                      <td className="ep-td">
                        {adj.appliesTo === "DEPOSIT" ? (
                          <Badge variant="success">Caution</Badge>
                        ) : (
                          <Badge variant="warning">Loyer</Badge>
                        )}
                      </td>
                      <td className="ep-td" style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmtFull(adj.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CollapsibleSection>
        </div>
      )}

      {/* ── Ventilation par bien ── */}
      {statement && statement.byProperty.length > 0 && (
        <div>
          <div className="ep-section-label">Ventilation par bien</div>
          <div style={{ border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--paper-raised)" }}>
            <table className="ep-table">
              <thead>
                <tr>
                  <th className="ep-th">Bien</th>
                  <th className="ep-th" style={{ textAlign: "right" }}>Locaux</th>
                  <th className="ep-th" style={{ textAlign: "right" }}>Occupation</th>
                  <th className="ep-th" style={{ textAlign: "right" }}>Encaissé</th>
                  <th className="ep-th" style={{ textAlign: "right" }}>Charges</th>
                  <th className="ep-th" style={{ textAlign: "right" }}>Net avant commission</th>
                </tr>
              </thead>
              <tbody>
                {statement.byProperty.map((p) => (
                  <tr key={p.propertyId} className="ep-tr" style={{ cursor: "default" }}>
                    <td className="ep-td" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Building2 size={13} style={{ color: "var(--ink-soft)" }} />
                      {p.propertyName}
                    </td>
                    <td className="ep-td" style={{ textAlign: "right" }}>{p.occupiedUnits}/{p.unitsCount}</td>
                    <td className="ep-td" style={{ textAlign: "right" }}>{Math.round(p.occupancyRate)}%</td>
                    <td className="ep-td" style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmtFull(p.rentCollected)}</td>
                    <td className="ep-td" style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmtFull(p.totalCharges)}</td>
                    <td className="ep-td" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmtFull(p.netBeforeFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Historique des reversements ── */}
      <div>
        <div className="ep-section-label">Historique des reversements</div>
        {payoutsLoading && payouts.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <Loader2 size={16} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
          </div>
        ) : payouts.length === 0 ? (
          <p style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--ink-soft)", opacity: 0.65 }}>
            Aucun reversement enregistré pour ce propriétaire.
          </p>
        ) : (
          <div style={{ border: "1px solid var(--paper-line)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--paper-raised)" }}>
            <table className="ep-table">
              <thead>
                <tr>
                  <th className="ep-th">Référence</th>
                  <th className="ep-th">Période</th>
                  <th className="ep-th">Date</th>
                  <th className="ep-th">Mode</th>
                  <th className="ep-th">Statut</th>
                  <th className="ep-th" style={{ textAlign: "right" }}>Montant</th>
                  <th className="ep-th" style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => {
                  const isReset = p.kind === "RESET";
                  const badge = PAYOUT_STATUS_BADGE[p.status];
                  const busy = busyPayoutId === p.id;
                  return (
                    <tr key={p.id} className="ep-tr" style={{ cursor: "default", opacity: p.status === "CANCELLED" ? 0.55 : 1 }}>
                      <td className="ep-td ep-mono">
                        {p.reference ?? p.id}
                        {isReset && (
                          <span style={{ marginLeft: 8 }}>
                            <Badge variant="neutral">Remise à zéro</Badge>
                          </span>
                        )}
                      </td>
                      <td className="ep-td">{fmtDateShort(p.periodStart)} → {fmtDateShort(p.periodEnd)}</td>
                      <td className="ep-td">{p.paidAt ? fmtDateShort(p.paidAt) : "—"}</td>
                      <td className="ep-td ep-mono">{p.method ?? "—"}</td>
                      <td className="ep-td"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="ep-td" style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        {isReset ? "—" : fmtFull(Number(p.amountPaid))}
                      </td>
                      <td className="ep-td" style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                          {p.status === "DRAFT" && !isReset && (
                            <button
                              onClick={() => handleConfirmPayout(p.id)}
                              disabled={busy}
                              className="ep-icon-btn"
                              title="Confirmer le versement"
                            >
                              {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                          )}
                          {p.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancelPayout(p.id)}
                              disabled={busy}
                              className="ep-icon-btn"
                              title="Annuler"
                              style={{ color: "var(--rouge)" }}
                            >
                              <XIcon size={13} />
                            </button>
                          )}
                          {p.status === "PAID" && !isReset && (
                            <button
                              onClick={() => handleDownloadReceipt(p.id, p.reference)}
                              disabled={busy}
                              className="ep-icon-btn"
                              title="Télécharger le reçu"
                            >
                              <Download size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "6px 12px" }}>
              <PaginationBar
                total={payoutsTotal}
                page={payoutsPage}
                limit={payoutsLimit}
                itemLabel="reversements"
                onPage={setPayoutsPage}
                onLimit={(l) => { setPayoutsLimit(l); setPayoutsPage(1); }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      <CreatePayoutModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        ownerId={ownerId}
        statement={statement}
        onSaved={() => { setCreateOpen(false); refreshAll(); }}
      />
      <ResetAccountModal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        ownerId={ownerId}
        onSaved={() => refreshAll()}
      />
    </div>
  );
}
