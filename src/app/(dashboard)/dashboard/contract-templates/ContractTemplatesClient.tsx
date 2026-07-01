"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  X,
  Code2,
  Copy,
  Check,
  BookOpen,
  Save,
} from "lucide-react";
import { contractTemplateService } from "@/lib/services/contract-template.service";
import { leaseService } from "@/lib/services/lease.service";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

// ─── Monaco Editor (chargement dynamique — pas de SSR) ───────────────────────

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        background: "#1e1e1e",
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
        gap: 8,
      }}
    >
      <Loader2 size={16} className="animate-spin" />
      Chargement de l'éditeur…
    </div>
  ),
});
import type {
  ContractTemplate,
  ContractTemplatePayload,
  ContractVariable,
  Lease,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TEXTAREA_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--paper-line)",
  background: "var(--paper)",
  fontSize: 13,
  color: "var(--ink)",
  resize: "vertical",
  outline: "none",
  fontFamily: "var(--font-mono)",
  lineHeight: 1.6,
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-soft)",
  marginBottom: 4,
};

const SECTION_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  textTransform: "uppercase",
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
    <div style={SECTION_STYLE}>
      {children}
      <span style={{ flex: 1, height: 1, background: "var(--paper-line)" }} />
    </div>
  );
}

// ─── Variable badge (copiable) ────────────────────────────────────────────────

function VariableBadge({ variable }: { variable: ContractVariable }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(variable.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title={variable.description ?? variable.label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 9px",
        borderRadius: "var(--r-sm)",
        border: "1px solid var(--paper-line)",
        background: "var(--paper-raised)",
        cursor: "pointer",
        transition: "border-color 0.15s",
        textAlign: "left",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--terracotta)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--paper-line)")
      }
    >
      <code
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--terracotta)",
        }}
      >
        {variable.key}
      </code>
      {copied ? (
        <Check size={10} style={{ color: "var(--sauge)", flexShrink: 0 }} />
      ) : (
        <Copy size={10} style={{ color: "var(--ink-soft)", flexShrink: 0 }} />
      )}
    </button>
  );
}

// ─── Variables drawer ────────────────────────────────────────────────────────

function VariablesDrawer({
  variables,
  loading,
  onClose,
}: {
  variables: ContractVariable[];
  loading: boolean;
  onClose: () => void;
}) {
  // Grouper par catégorie
  const groups = variables.reduce<Record<string, ContractVariable[]>>(
    (acc, v) => {
      const cat = v.category ?? "Autre";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(v);
      return acc;
    },
    {},
  );

  const CATEGORY_LABELS: Record<string, string> = {
    tenant: "Locataire",
    lease: "Contrat",
    unit: "Local",
    property: "Propriété",
    neighborhood: "Quartier",
    general: "Général",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{ flex: 1, background: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />
      <aside
        style={{
          width: 340,
          background: "var(--paper)",
          borderLeft: "1px solid var(--paper-line)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--paper-line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Code2 size={16} style={{ color: "var(--terracotta)" }} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Variables disponibles
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-soft)",
              display: "flex",
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "var(--ink-soft)",
            padding: "10px 20px 0",
            fontStyle: "italic",
          }}
        >
          Cliquez sur une variable pour la copier dans le presse-papiers.
        </p>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 30 }}
            >
              <Loader2
                size={20}
                className="animate-spin"
                style={{ color: "var(--ink-soft)" }}
              />
            </div>
          ) : Object.keys(groups).length === 0 ? (
            <p
              style={{
                color: "var(--ink-soft)",
                fontSize: 13,
                textAlign: "center",
                paddingTop: 20,
              }}
            >
              Aucune variable disponible
            </p>
          ) : (
            Object.entries(groups).map(([cat, vars]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--ink-soft)",
                    marginBottom: 8,
                  }}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {vars.map((v) => (
                    <VariableBadge key={v.key} variable={v} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Template Form Modal ──────────────────────────────────────────────────────

type FormData = {
  name: string;
  description: string;
  content: string;
  specialClauses: string;
  footer: string;
  isDefault: boolean;
};

// ─── Contenus par défaut ──────────────────────────────────────────────────────

const DEFAULT_CONTENT = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Georgia, serif; font-size: 13px; color: #1a1a1a; line-height: 1.7; margin: 0; padding: 40px 60px; }
    h1 { font-size: 18px; text-align: center; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 30px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 28px; margin-bottom: 8px; border-left: 3px solid #1a1a1a; padding-left: 10px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
    .partie { border: 1px solid #ccc; padding: 14px 16px; border-radius: 4px; background: #fafafa; }
    .partie-title { font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em; color: #555; margin-bottom: 8px; }
    .info-row { margin: 3px 0; }
    .info-label { font-size: 11px; color: #777; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td { padding: 6px 10px; border: 1px solid #e0e0e0; font-size: 13px; }
    td:first-child { background: #f5f5f5; font-weight: 600; width: 40%; }
    .montant { font-size: 15px; font-weight: bold; }
  </style>
</head>
<body>

<h1>Contrat de Location</h1>
<p style="text-align:center; font-size:12px; color:#666;">
  Référence : <strong>{{lease.contractNumber}}</strong> &nbsp;·&nbsp; Généré le {{generatedAt}}
</p>

<h2>Article 1 — Parties au contrat</h2>

<div class="parties">
  <div class="partie">
    <div class="partie-title">Le Bailleur</div>
    <div class="info-row"><span class="info-label">Propriété :</span> {{property.name}}</div>
    <div class="info-row"><span class="info-label">Adresse :</span> {{property.address}}</div>
    <div class="info-row"><span class="info-label">Quartier :</span> {{neighborhood.name}}</div>
  </div>
  <div class="partie">
    <div class="partie-title">Le Locataire</div>
    <div class="info-row"><strong>{{tenant.fullName}}</strong></div>
    <div class="info-row"><span class="info-label">Tél :</span> {{tenant.phone}}</div>
    <div class="info-row"><span class="info-label">Email :</span> {{tenant.email}}</div>
    <div class="info-row"><span class="info-label">Adresse :</span> {{tenant.address}}</div>
    <div class="info-row"><span class="info-label">Pièce d'identité :</span> {{tenant.identityNumber}}</div>
  </div>
</div>

<h2>Article 2 — Désignation du local loué</h2>
<table>
  <tr><td>Référence du local</td><td>{{unit.unitNumber}} — {{unit.label}}</td></tr>
  <tr><td>Type</td><td>{{unit.type}}</td></tr>
  <tr><td>Étage</td><td>{{unit.floor}}</td></tr>
  <tr><td>Superficie</td><td>{{unit.area}} m²</td></tr>
  <tr><td>Bien immobilier</td><td>{{property.name}}, {{property.address}}</td></tr>
  <tr><td>Quartier</td><td>{{neighborhood.name}}</td></tr>
</table>

<h2>Article 3 — Durée du bail</h2>
<table>
  <tr><td>Date de début</td><td>{{lease.startDate}}</td></tr>
  <tr><td>Date de fin</td><td>{{lease.endDate}}</td></tr>
  <tr><td>Périodicité de paiement</td><td>{{lease.periodicity}}</td></tr>
  <tr><td>Jour de facturation</td><td>Le {{lease.billingDay}} de chaque mois</td></tr>
</table>

<h2>Article 4 — Loyer et modalités de paiement</h2>
<p>
  Le loyer mensuel est fixé à la somme de
  <span class="montant">{{lease.monthlyRent}}</span>,
  payable le <strong>{{lease.billingDay}}</strong> de chaque mois selon la périodicité
  <strong>{{lease.periodicity}}</strong>.
</p>

<h2>Article 5 — Dépôt de garantie</h2>
<p>
  Un dépôt de garantie d'un montant de
  <span class="montant">{{lease.depositAmount}}</span>
  est versé à la signature du présent contrat. Il sera restitué dans un délai de
  deux (2) mois suivant la restitution des clés, déduction faite des sommes dues.
</p>

<h2>Article 6 — Obligations du locataire</h2>
<p>Le locataire s'engage à :</p>
<ul>
  <li>Payer le loyer aux termes convenus.</li>
  <li>User paisiblement des locaux loués conformément à leur destination.</li>
  <li>Entretenir les locaux en bon état et les rendre en bon état à la fin du bail.</li>
  <li>Ne pas sous-louer les locaux sans accord écrit du bailleur.</li>
  <li>Permettre au bailleur ou à son représentant de visiter les locaux sur simple demande.</li>
</ul>

<h2>Article 7 — Obligations du bailleur</h2>
<p>Le bailleur s'engage à :</p>
<ul>
  <li>Délivrer les locaux en bon état d'usage.</li>
  <li>Assurer la jouissance paisible des locaux loués.</li>
  <li>Effectuer les réparations nécessaires à la conservation des locaux.</li>
</ul>

<h2>Article 8 — Notes et dispositions particulières</h2>
<p>{{lease.notes}}</p>

{{specialClauses}}

</body>
</html>`;

const DEFAULT_SPECIAL_CLAUSES = `<h2>Article 9 — Clauses spéciales</h2>

<p>Les parties conviennent des clauses particulières suivantes :</p>

<ul>
  <li>
    <strong>État des lieux :</strong> Un état des lieux contradictoire sera dressé à l'entrée
    et à la sortie du locataire. Tout dégât constaté lors de l'état des lieux de sortie
    sera imputé au locataire.
  </li>
  <li>
    <strong>Travaux :</strong> Le locataire ne pourra effectuer aucun travaux de transformation
    sans l'accord écrit préalable du bailleur.
  </li>
  <li>
    <strong>Résiliation anticipée :</strong> En cas de résiliation anticipée par le locataire,
    un préavis d'un (1) mois est obligatoire, notifié par écrit.
  </li>
  <li>
    <strong>Assurance :</strong> Le locataire devra contracter une assurance couvrant
    les risques locatifs (incendie, dégâts des eaux, responsabilité civile).
  </li>
</ul>`;

const DEFAULT_FOOTER = `<div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #555;">

  <p style="text-align: center; margin-bottom: 40px;">
    Fait en deux (2) exemplaires originaux, à ________________________, le {{generatedAt}}.
  </p>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px;">
    <div>
      <p style="font-weight: bold; margin-bottom: 4px;">LE BAILLEUR</p>
      <p style="font-size: 11px; color: #777; margin-bottom: 60px;">Signature précédée de la mention « Lu et approuvé »</p>
      <div style="border-top: 1px solid #999; width: 200px;"></div>
    </div>
    <div>
      <p style="font-weight: bold; margin-bottom: 4px;">LE LOCATAIRE</p>
      <p style="font-size: 11px; color: #777; margin-bottom: 4px;">{{tenant.fullName}}</p>
      <p style="font-size: 11px; color: #777; margin-bottom: 60px;">Signature précédée de la mention « Lu et approuvé »</p>
      <div style="border-top: 1px solid #999; width: 200px;"></div>
    </div>
  </div>

  <p style="text-align: center; margin-top: 30px; font-size: 11px; color: #aaa;">
    Contrat n° {{lease.contractNumber}} · {{property.name}} · {{neighborhood.name}}
  </p>

</div>`;

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  content: DEFAULT_CONTENT,
  specialClauses: DEFAULT_SPECIAL_CLAUSES,
  footer: DEFAULT_FOOTER,
  isDefault: false,
};

function fromTemplate(t: ContractTemplate): FormData {
  return {
    name: t.name ?? "",
    description: t.description ?? "",
    content: t.content ?? "",
    specialClauses: t.specialClauses ?? "",
    footer: t.footer ?? "",
    isDefault: t.isDefault ?? false,
  };
}

type EditorTab = "content" | "specialClauses" | "footer";

const EDITOR_TABS: { id: EditorTab; label: string; placeholder: string }[] = [
  {
    id: "content",
    label: "Corps principal",
    placeholder:
      "<p>Entre les soussignés :</p>\n<p>{{tenant.fullName}}, ci-après dénommé le locataire,</p>\n<p>Il a été convenu ce qui suit…</p>",
  },
  {
    id: "specialClauses",
    label: "Clauses spéciales",
    placeholder: "<!-- Clauses particulières -->\n<p>…</p>",
  },
  {
    id: "footer",
    label: "Pied de page",
    placeholder:
      "<!-- Mentions légales, signatures -->\n<p>Fait à ________, le {{generatedAt}}</p>",
  },
];

function TemplateFormModal({
  isOpen,
  onClose,
  onSaved,
  template,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (t: ContractTemplate) => void;
  template?: ContractTemplate;
}) {
  const isEdit = !!template;
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [showVars, setShowVars] = useState(false);
  const [variables, setVariables] = useState<ContractVariable[]>([]);
  const [varsLoading, setVarsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(template ? fromTemplate(template) : EMPTY_FORM);
      setError(null);
      setActiveTab("content");
    }
  }, [isOpen, template]);

  async function loadVariables() {
    if (variables.length > 0) {
      setShowVars(true);
      return;
    }
    setVarsLoading(true);
    try {
      const vars = await contractTemplateService.getVariables();
      setVariables(Array.isArray(vars) ? vars : []);
    } catch {
      // silencieux
    } finally {
      setVarsLoading(false);
      setShowVars(true);
    }
  }

  function setField(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();
    if (!form.name.trim()) {
      setError("Le nom du template est obligatoire.");
      return;
    }
    if (!form.content.trim()) {
      setError("Le corps principal est obligatoire.");
      return;
    }

    const payload: ContractTemplatePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      content: form.content,
      specialClauses: form.specialClauses || undefined,
      footer: form.footer.trim() || undefined,
      isDefault: form.isDefault,
    };

    setLoading(true);
    setError(null);
    try {
      const res = isEdit
        ? await contractTemplateService.update(template!.id, payload)
        : await contractTemplateService.create(payload);
      onSaved(res.data);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le template.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const currentTab = EDITOR_TABS.find((t) => t.id === activeTab)!;

  return (
    <>
      {/* ── Panneau plein écran ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 55,
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderBottom: "1px solid var(--paper-line)",
            background: "var(--paper-raised)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "var(--r-sm)",
              background: "var(--terracotta)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={14} style={{ color: "white" }} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--ink)",
            }}
          >
            {isEdit ? "Modifier le template" : "Nouveau template de contrat"}
          </span>

          <div style={{ flex: 1 }} />

          {/* Variables */}
          <button
            type="button"
            onClick={loadVariables}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--terracotta)",
              background: "none",
              border: "1px solid var(--terracotta)",
              borderRadius: "var(--r-sm)",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            <Code2 size={12} /> Variables
          </button>

          {/* Cancel */}
          <button
            type="button"
            className="ep-btn ep-btn-ghost"
            onClick={onClose}
            disabled={loading}
            style={{ fontSize: 13 }}
          >
            <X size={14} /> Annuler
          </button>

          {/* Save */}
          <button
            type="button"
            className="ep-btn ep-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ fontSize: 13, minWidth: 140 }}
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            {isEdit ? "Enregistrer" : "Créer le template"}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: "10px 20px",
              flexShrink: 0,
              background: "var(--rouge-soft)",
              borderBottom: "1px solid var(--rouge)",
              fontSize: 13,
              color: "var(--rouge)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* ── Sidebar : méta ── */}
          <aside
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: "1px solid var(--paper-line)",
              overflowY: "auto",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <SectionLabel>Informations</SectionLabel>

            <Input
              label="Nom du template"
              value={form.name}
              onChange={setField("name")}
              placeholder="ex : Contrat standard"
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={setField("description")}
              placeholder="Brève description…"
            />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="isDefaultPanel"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                }
                style={{
                  width: 15,
                  height: 15,
                  accentColor: "var(--terracotta)",
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="isDefaultPanel"
                style={{
                  fontSize: 13,
                  color: "var(--ink)",
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                Template par défaut
              </label>
            </div>

            {/* Navigation entre onglets */}
            <div style={{ marginTop: 8 }}>
              <SectionLabel>Sections</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {EDITOR_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: "var(--r-sm)",
                      background:
                        activeTab === tab.id
                          ? "var(--terracotta-soft)"
                          : "transparent",
                      border: `1px solid ${activeTab === tab.id ? "var(--terracotta)" : "transparent"}`,
                      color:
                        activeTab === tab.id
                          ? "var(--terracotta)"
                          : "var(--ink-soft)",
                      fontSize: 13,
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: form[tab.id]?.trim()
                          ? "var(--sauge)"
                          : "var(--paper-line)",
                      }}
                    />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aide */}
            <div
              style={{
                marginTop: "auto",
                padding: "10px 12px",
                background: "var(--paper-raised)",
                border: "1px solid var(--paper-line)",
                borderRadius: "var(--r-sm)",
                fontSize: 11.5,
                color: "var(--ink-soft)",
                lineHeight: 1.5,
              }}
            >
              Utilisez{" "}
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--terracotta)",
                  fontSize: 11,
                }}
              >
                {"{{variable}}"}
              </code>{" "}
              pour les données dynamiques. Cliquez sur{" "}
              <strong>Variables</strong> pour voir la liste.
            </div>
          </aside>

          {/* ── Zone Monaco ── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Tab label */}
            <div
              style={{
                padding: "8px 16px",
                borderBottom: "1px solid var(--paper-line)",
                background: "var(--paper-raised)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Code2 size={13} style={{ color: "var(--terracotta)" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-soft)",
                }}
              >
                HTML · {currentTab.label}
              </span>
            </div>

            {/* Editor */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <MonacoEditor
                key={activeTab}
                height="100%"
                language="html"
                theme="vs-dark"
                value={form[activeTab] as string}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, [activeTab]: value ?? "" }))
                }
                options={{
                  fontSize: 13,
                  lineHeight: 20,
                  minimap: { enabled: false },
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  padding: { top: 12, bottom: 12 },
                  fontFamily:
                    "'IBM Plex Mono', 'Fira Code', 'Consolas', monospace",
                  fontLigatures: true,
                  bracketPairColorization: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: false,
                  suggest: { showKeywords: true },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Variables drawer */}
      {showVars && (
        <VariablesDrawer
          variables={variables}
          loading={varsLoading}
          onClose={() => setShowVars(false)}
        />
      )}
    </>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  template,
  leases,
  onClose,
}: {
  template: ContractTemplate;
  leases: Lease[];
  onClose: () => void;
}) {
  const [selectedLeaseId, setSelectedLeaseId] = useState(leases[0]?.id ?? "");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    if (!selectedLeaseId) return;
    setLoading(true);
    setError(null);
    setHtml(null);
    try {
      const res = await contractTemplateService.preview(
        template.id,
        selectedLeaseId,
      );
      setHtml(res.data.html);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Impossible de générer l'aperçu.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          margin: "auto",
          width: "min(95vw, 900px)",
          height: "90vh",
          background: "var(--paper)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--paper-line)",
            background: "var(--paper-raised)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Eye size={15} style={{ color: "var(--terracotta)" }} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Aperçu — {template.name}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-soft)",
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Lease selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            borderBottom: "1px solid var(--paper-line)",
            background: "var(--paper-raised)",
          }}
        >
          <label
            style={{
              fontSize: 12,
              color: "var(--ink-soft)",
              whiteSpace: "nowrap",
            }}
          >
            Bail de démonstration :
          </label>
          {leases.length === 0 ? (
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-soft)",
                fontStyle: "italic",
              }}
            >
              Aucun bail disponible — l'aperçu utilisera des valeurs fictives
            </span>
          ) : (
            <select
              value={selectedLeaseId}
              onChange={(e) => setSelectedLeaseId(e.target.value)}
              style={{
                height: 32,
                padding: "0 10px",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--paper-line)",
                background: "var(--paper)",
                fontSize: 12,
                color: "var(--ink)",
                outline: "none",
                flex: 1,
                maxWidth: 360,
              }}
            >
              {leases.map((l) => {
                const label = [
                  l.contractNumber,
                  l.unit?.unitNumber ?? l.unit?.label,
                  l.tenant?.fullName ??
                    `${l.tenant?.firstName ?? ""} ${l.tenant?.lastName ?? ""}`.trim(),
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <option key={l.id} value={l.id}>
                    {label || l.id}
                  </option>
                );
              })}
            </select>
          )}
          <button
            className="ep-btn ep-btn-primary"
            onClick={loadPreview}
            disabled={loading || (!selectedLeaseId && leases.length > 0)}
            style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Eye size={12} />
            )}
            Aperçu
          </button>
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, overflow: "auto", background: "#f5f5f5" }}>
          {error && (
            <div
              style={{
                margin: 20,
                padding: "12px 16px",
                background: "var(--rouge-soft)",
                border: "1px solid var(--rouge)",
                borderRadius: "var(--r-sm)",
                color: "var(--rouge)",
                fontSize: 13,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          {loading && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <Loader2
                size={24}
                className="animate-spin"
                style={{ color: "var(--ink-soft)" }}
              />
            </div>
          )}
          {html && !loading && (
            <iframe
              srcDoc={html}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "white",
              }}
              title="Aperçu du contrat"
              sandbox="allow-same-origin"
            />
          )}
          {!html && !loading && !error && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 200,
                color: "var(--ink-soft)",
              }}
            >
              <Eye size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
              <p style={{ fontSize: 13 }}>
                Sélectionnez un bail et cliquez sur "Aperçu"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onPreview,
}: {
  template: ContractTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--paper)",
        border: `1px solid ${template.isDefault ? "var(--terracotta)" : "var(--paper-line)"}`,
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid var(--paper-line)",
          background: template.isDefault
            ? "var(--terracotta-soft)"
            : "var(--paper-raised)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            background: template.isDefault
              ? "var(--terracotta)"
              : "var(--paper-line)",
            borderRadius: "var(--r-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText
            size={16}
            style={{ color: template.isDefault ? "white" : "var(--ink-soft)" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--ink)",
              }}
            >
              {template.name}
            </span>
            {template.isDefault && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--terracotta)",
                  background: "var(--terracotta-soft)",
                  border: "1px solid var(--terracotta)",
                  borderRadius: 10,
                  padding: "1px 7px",
                }}
              >
                Défaut
              </span>
            )}
          </div>
          {template.description && (
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-soft)",
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {template.description}
            </p>
          )}
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--ink-soft)",
              marginTop: 4,
            }}
          >
            {template.updatedAt
              ? `Modifié le ${fmt(template.updatedAt)}`
              : `Créé le ${fmt(template.createdAt)}`}
          </p>
        </div>
      </div>

      {/* Content preview */}
      <div style={{ padding: "10px 14px" }}>
        <p
          style={{
            fontSize: 12,
            color: "var(--ink-soft)",
            fontFamily: "var(--font-mono)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            whiteSpace: "pre-wrap",
          }}
        >
          {template.content
            .replace(/<[^>]+>/g, " ")
            .trim()
            .slice(0, 180)}
          …
        </p>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderTop: "1px solid var(--paper-line)",
        }}
      >
        <button
          className="ep-btn ep-btn-ghost"
          onClick={onPreview}
          style={{ fontSize: 11, padding: "4px 10px" }}
        >
          <Eye size={11} /> Aperçu
        </button>
        <button
          className="ep-btn ep-btn-ghost"
          onClick={onEdit}
          style={{ fontSize: 11, padding: "4px 10px" }}
        >
          <Pencil size={11} /> Modifier
        </button>
        <button
          className="ep-btn ep-btn-ghost"
          onClick={onDelete}
          style={{
            fontSize: 11,
            padding: "4px 10px",
            color: "var(--rouge)",
            marginLeft: "auto",
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ContractTemplatesClient() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  // Guard : superadmin only
  useEffect(() => {
    if (user && user.role !== "superadmin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Data
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [variables, setVariables] = useState<ContractVariable[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<
    ContractTemplate | undefined
  >(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<ContractTemplate | null>(null);
  const [showVarsPanel, setShowVarsPanel] = useState(false);
  const [varsLoading, setVarsLoading] = useState(false);

  // Load templates + leases on mount
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tmplRes, leasesRes] = await Promise.allSettled([
        contractTemplateService.list(),
        leaseService.getAll({ status: "ACTIVE", limit: 50 }),
      ]);

      if (tmplRes.status === "fulfilled") {
        const raw = tmplRes.value.data;
        setTemplates(Array.isArray(raw) ? raw : []);
      } else {
        setError("Impossible de charger les templates.");
      }

      if (leasesRes.status === "fulfilled") {
        const raw = leasesRes.value.data;
        setLeases(Array.isArray(raw) ? raw : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Load variables for the panel
  async function loadVariables() {
    if (variables.length > 0) {
      setShowVarsPanel(true);
      return;
    }
    setVarsLoading(true);
    try {
      const vars = await contractTemplateService.getVariables();
      setVariables(Array.isArray(vars) ? vars : []);
    } catch {
      // silencieux
    } finally {
      setVarsLoading(false);
      setShowVarsPanel(true);
    }
  }

  // Upsert in list
  function handleSaved(t: ContractTemplate) {
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = t;
        // Si ce template est default, décocher les autres
        if (t.isDefault)
          return next.map((x) =>
            x.id === t.id ? x : { ...x, isDefault: false },
          );
        return next;
      }
      if (t.isDefault) {
        return [t, ...prev.map((x) => ({ ...x, isDefault: false }))];
      }
      return [t, ...prev];
    });
    toast({
      variant: "success",
      title: editingTemplate ? "Template mis à jour" : "Template créé",
    });
  }

  async function handleDelete() {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await contractTemplateService.delete(deletingId);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingId));
      toast({ variant: "success", title: "Template supprimé" });
    } catch (err: unknown) {
      toast({
        variant: "danger",
        title:
          err instanceof Error ? err.message : "Erreur lors de la suppression",
      });
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  }

  // Sort: default first, then by date
  const sorted = [...templates].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Topbar */}
      <div className="ep-topbar">
        <div>
          <div className="ep-eyebrow">Gestion locative</div>
          <h1 className="ep-page-title">Modèles de contrat</h1>
          <p className="ep-page-desc">
            Personnalisez le PDF généré pour vos baux avec des templates HTML et
            des variables dynamiques.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="ep-btn ep-btn-ghost"
            onClick={loadVariables}
            style={{ fontSize: 12 }}
          >
            <Code2 size={13} /> Variables
          </button>
          <button
            className="ep-btn ep-btn-primary"
            onClick={() => {
              setEditingTemplate(undefined);
              setFormOpen(true);
            }}
          >
            <Plus size={14} /> Nouveau template
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "60px 0",
              gap: 10,
              color: "var(--ink-soft)",
            }}
          >
            <Loader2 size={20} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Chargement des templates…</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              background: "var(--rouge-soft)",
              border: "1px solid var(--rouge)",
              borderRadius: "var(--r-md)",
              color: "var(--rouge)",
              fontSize: 13,
            }}
          >
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && templates.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 0",
              gap: 14,
              color: "var(--ink-soft)",
            }}
          >
            <FileText size={40} style={{ opacity: 0.18 }} />
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: 6,
                }}
              >
                Aucun template de contrat
              </p>
              <p style={{ fontSize: 13 }}>
                Créez votre premier modèle personnalisé pour vos baux.
              </p>
            </div>
            <button
              className="ep-btn ep-btn-primary"
              onClick={() => {
                setEditingTemplate(undefined);
                setFormOpen(true);
              }}
            >
              <Plus size={14} /> Créer un template
            </button>
          </div>
        )}

        {/* Info banner */}
        {!loading && !error && templates.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 14px",
              marginBottom: 20,
              background: "var(--ocre-soft, rgba(180,140,60,0.08))",
              border: "1px solid var(--ocre, rgba(180,140,60,0.3))",
              borderRadius: "var(--r-sm)",
              fontSize: 12.5,
              color: "var(--ink-soft)",
            }}
          >
            <BookOpen
              size={14}
              style={{
                flexShrink: 0,
                marginTop: 1,
                color: "var(--ocre, #b48c3c)",
              }}
            />
            <span>
              Utilisez des variables comme{" "}
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--terracotta)",
                  fontSize: 11,
                }}
              >
                {"{{tenant_full_name}}"}
              </code>{" "}
              dans votre contenu. Le template <strong>par défaut</strong> est
              utilisé quand aucun template n'est précisé lors de la génération
              PDF.
            </span>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && sorted.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {sorted.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => {
                  setEditingTemplate(t);
                  setFormOpen(true);
                }}
                onDelete={() => setDeletingId(t.id)}
                onPreview={() => setPreviewTemplate(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <TemplateFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTemplate(undefined);
        }}
        onSaved={handleSaved}
        template={editingTemplate}
      />

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Supprimer le template"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                flexShrink: 0,
                background: "var(--rouge-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={16} style={{ color: "var(--rouge)" }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: 4,
                }}
              >
                Confirmer la suppression
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                Ce template sera définitivement supprimé. Les contrats déjà
                générés ne seront pas affectés.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              className="ep-btn ep-btn-ghost"
              onClick={() => setDeletingId(null)}
              disabled={deleteLoading}
            >
              Annuler
            </button>
            <button
              className="ep-btn ep-btn-primary"
              onClick={handleDelete}
              disabled={deleteLoading}
              style={{
                background: "var(--rouge)",
                borderColor: "var(--rouge)",
                minWidth: 120,
              }}
            >
              {deleteLoading && <Loader2 size={13} className="animate-spin" />}
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Variables panel */}
      {showVarsPanel && (
        <VariablesDrawer
          variables={variables}
          loading={varsLoading}
          onClose={() => setShowVarsPanel(false)}
        />
      )}

      {/* Preview modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          leases={leases}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
