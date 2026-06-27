// ─── Variable disponible dans un template ─────────────────────────────────────

export type ContractVariable = {
  key: string;          // ex : "{{tenant_full_name}}"
  label: string;        // ex : "Nom complet du locataire"
  description?: string; // ex : "Prénom + Nom du locataire principal"
  category?: string;    // ex : "tenant" | "lease" | "unit" | "property"
};

// ─── Entité ───────────────────────────────────────────────────────────────────

export type ContractTemplate = {
  id: string;
  _id: string;
  name: string;
  description?: string;
  content: string;          // Corps principal du contrat (HTML/Markdown avec variables)
  specialClauses?: string;  // Clauses spéciales
  footer?: string;          // Pied de page
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
};

// ─── Payload (create / update) ────────────────────────────────────────────────

export type ContractTemplatePayload = {
  name: string;
  description?: string;
  content: string;
  specialClauses?: string;
  footer?: string;
  isDefault?: boolean;
};

// ─── Réponse aperçu ───────────────────────────────────────────────────────────

export type ContractTemplatePreviewResponse = {
  success: true;
  data: {
    html: string;
  };
};

// ─── Réponse generate-pdf ─────────────────────────────────────────────────────

export type ContractTemplatePdfResponse = {
  success: boolean;
  data?: {
    url?: string;
    pdfUrl?: string;
    buffer?: string;
    base64?: string;
  };
};
