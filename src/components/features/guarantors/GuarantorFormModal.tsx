"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { guarantorService } from "@/lib/services/guarantor.service";
import type { Guarantor, GuarantorPayload, Lease } from "@/types";

// ─── Options ──────────────────────────────────────────────────────────────────

const RELATION_OPTIONS = [
  { value: "", label: "— Relation —" },
  { value: "Famille", label: "Famille" },
  { value: "Ami(e)", label: "Ami(e)" },
  { value: "Employeur", label: "Employeur" },
  { value: "Collègue", label: "Collègue" },
  { value: "Propriétaire", label: "Propriétaire" },
  { value: "Autre", label: "Autre" },
];

const IDENTITY_TYPE_OPTIONS = [
  { value: "", label: "— Type de pièce —" },
  { value: "CNI", label: "CNI" },
  { value: "Passeport", label: "Passeport" },
  { value: "Permis", label: "Permis de conduire" },
  { value: "Titre séjour", label: "Titre de séjour" },
  { value: "Autre", label: "Autre" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function leaseLabel(l: Lease): string {
  const parts: string[] = [];
  if (l.contractNumber) parts.push(l.contractNumber);
  if (l.unit?.unitNumber) parts.push(l.unit?.unitNumber);
  else if (l.unit?.label) parts.push(l.unit.label);
  const start = new Date(l.startDate).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
  parts.push(`depuis ${start}`);
  return parts.join(" · ");
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 10px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--paper-line)",
  background: "var(--paper)",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  fontFamily: "var(--font-sans)",
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "var(--terracotta)",
  marginBottom: 10,
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={SECTION_LABEL_STYLE}>
      {children}
      <span style={{ flex: 1, height: 1, background: "var(--paper-line)" }} />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (guarantor: Guarantor) => void;
  /** Liste des baux actifs du locataire */
  leases: Lease[];
  /** Si fourni : mode édition */
  guarantor?: Guarantor;
};

// ─── Formulaire ───────────────────────────────────────────────────────────────

type FormData = {
  leaseId: string;
  fullName: string;
  relation: string;
  identityType: string;
  identityNumber: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  employer: string;
  jobTitle: string;
  monthlyIncome: string;
  notes: string;
};

const EMPTY: FormData = {
  leaseId: "",
  fullName: "",
  relation: "",
  identityType: "",
  identityNumber: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  address: "",
  employer: "",
  jobTitle: "",
  monthlyIncome: "",
  notes: "",
};

function fromGuarantor(g: Guarantor): FormData {
  return {
    leaseId: g.leaseId ?? "",
    fullName: g.fullName ?? "",
    relation: g.relation ?? "",
    identityType: g.identityType ?? "",
    identityNumber: g.identityNumber ?? "",
    phone: g.phone ?? "",
    secondaryPhone: g.secondaryPhone ?? "",
    email: g.email ?? "",
    address: g.address ?? "",
    employer: g.employer ?? "",
    jobTitle: g.jobTitle ?? "",
    monthlyIncome: g.monthlyIncome != null ? String(g.monthlyIncome) : "",
    notes: g.notes ?? "",
  };
}

export function GuarantorFormModal({
  isOpen,
  onClose,
  onSaved,
  leases,
  guarantor,
}: Props) {
  const isEdit = !!guarantor;
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplir à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (guarantor) {
        setForm(fromGuarantor(guarantor));
      } else {
        // En création : présélectionner le premier bail actif
        setForm({ ...EMPTY, leaseId: leases[0]?.id ?? "" });
      }
      setError(null);
    }
  }, [isOpen, guarantor, leases]);

  function set(field: keyof FormData) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.leaseId) {
      setError("Veuillez sélectionner un bail.");
      return;
    }
    if (!form.fullName.trim()) {
      setError("Le nom complet est obligatoire.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Le téléphone est obligatoire.");
      return;
    }

    const payload: GuarantorPayload = {
      leaseId: form.leaseId,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      secondaryPhone: form.secondaryPhone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      employer: form.employer.trim() || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
      monthlyIncome: form.monthlyIncome
        ? Number(form.monthlyIncome)
        : undefined,
      identityNumber: form.identityNumber.trim() || undefined,
      identityType: form.identityType || undefined,
      relation: form.relation || undefined,
      notes: form.notes.trim() || undefined,
    };

    setLoading(true);
    setError(null);
    try {
      const res = isEdit
        ? await guarantorService.update(guarantor!.id, payload)
        : await guarantorService.create(payload);
      onSaved(res.data);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le garant.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier le garant" : "Ajouter un garant"}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: 16,
              borderRadius: "var(--r-sm)",
              background: "var(--rouge-soft)",
              border: "1px solid var(--rouge)",
              fontSize: 13,
              color: "var(--rouge)",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Bail ── */}
        <SectionLabel>Bail concerné</SectionLabel>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--ink-soft)",
              marginBottom: 4,
            }}
          >
            Contrat de bail
          </label>
          {leases.length === 0 ? (
            <div
              style={{
                height: 40,
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--paper-line)",
                background: "var(--paper-raised)",
                fontSize: 13,
                color: "var(--ink-soft)",
                fontStyle: "italic",
              }}
            >
              Aucun bail actif disponible
            </div>
          ) : (
            <select
              style={SELECT_STYLE}
              value={form.leaseId}
              onChange={set("leaseId")}
              required
              disabled={isEdit}
            >
              {leases.length > 1 && (
                <option value="">— Sélectionner un bail —</option>
              )}
              {leases.map((l) => (
                <option key={l.id} value={l.id}>
                  {leaseLabel(l)}
                </option>
              ))}
            </select>
          )}
          {isEdit && (
            <p
              style={{
                fontSize: 11,
                color: "var(--ink-soft)",
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              Le bail ne peut pas être modifié après création.
            </p>
          )}
        </div>

        {/* ── Identité ── */}
        <SectionLabel>Identité</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="Nom complet"
              value={form.fullName}
              onChange={set("fullName")}
              placeholder="Prénom NOM"
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-soft)",
                marginBottom: 4,
              }}
            >
              Relation
            </label>
            <select
              style={SELECT_STYLE}
              value={form.relation}
              onChange={set("relation")}
            >
              {RELATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-soft)",
                marginBottom: 4,
              }}
            >
              Pièce d'identité
            </label>
            <select
              style={SELECT_STYLE}
              value={form.identityType}
              onChange={set("identityType")}
            >
              {IDENTITY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="N° de la pièce"
              value={form.identityNumber}
              onChange={set("identityNumber")}
              placeholder="ex : BJ1234567"
            />
          </div>
        </div>

        {/* ── Contact ── */}
        <SectionLabel>Contact</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <Input
            label="Téléphone principal"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+229 00 00 00 00"
            required
          />
          <Input
            label="Téléphone secondaire"
            value={form.secondaryPhone}
            onChange={set("secondaryPhone")}
            placeholder="Optionnel"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="garant@email.com"
          />
          <Input
            label="Adresse"
            value={form.address}
            onChange={set("address")}
            placeholder="Quartier, ville…"
          />
        </div>

        {/* ── Emploi ── */}
        <SectionLabel>Situation professionnelle</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <Input
            label="Employeur"
            value={form.employer}
            onChange={set("employer")}
            placeholder="Nom de l'entreprise"
          />
          <Input
            label="Poste"
            value={form.jobTitle}
            onChange={set("jobTitle")}
            placeholder="ex : Directeur commercial"
          />
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="Revenu mensuel (XOF)"
              type="number"
              value={form.monthlyIncome}
              onChange={set("monthlyIncome")}
              placeholder="ex : 350 000"
            />
          </div>
        </div>

        {/* ── Notes ── */}
        <SectionLabel>Notes</SectionLabel>
        <textarea
          value={form.notes}
          onChange={set("notes")}
          rows={3}
          placeholder="Informations complémentaires…"
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 20,
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--paper-line)",
            background: "var(--paper)",
            fontSize: 13,
            color: "var(--ink)",
            resize: "vertical",
            outline: "none",
            fontFamily: "var(--font-sans)",
            boxSizing: "border-box",
          }}
        />

        {/* ── Actions ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 16,
            borderTop: "1px solid var(--paper-line)",
          }}
        >
          <button
            type="button"
            className="ep-btn ep-btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="ep-btn ep-btn-primary"
            disabled={loading || leases.length === 0}
            style={{ minWidth: 140 }}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Ajouter le garant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
