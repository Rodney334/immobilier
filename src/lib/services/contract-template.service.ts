import { api, tokenManager } from '@/lib/api/client';
import type {
  ApiResponse,
  ContractTemplate,
  ContractTemplatePayload,
  ContractTemplatePreviewResponse,
  ContractTemplatePdfResponse,
  ContractVariable,
} from '@/types';

const BASE = '/api/v1/contract-templates';
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://estatemanagement-production.up.railway.app';

export const contractTemplateService = {
  /**
   * Liste de toutes les variables disponibles dans les templates.
   * L'API renvoie { data: { "{{key}}": "label", ... } } — on transforme
   * en tableau ContractVariable[] avec catégorie déduite du préfixe.
   */
  async getVariables(): Promise<ContractVariable[]> {
    const res = await api.get<ApiResponse<Record<string, string>>>(`${BASE}/variables`);
    const raw = res.data as Record<string, string>;

    const CATEGORY_MAP: Record<string, string> = {
      lease: "lease",
      tenant: "tenant",
      unit: "unit",
      property: "property",
      neighborhood: "neighborhood",
    };

    return Object.entries(raw).map(([key, label]) => {
      // "{{lease.contractNumber}}" → "lease"
      const inner = key.replace(/^\{\{|\}\}$/g, ""); // "lease.contractNumber"
      const prefix = inner.split(".")[0];             // "lease"
      return {
        key,
        label,
        category: CATEGORY_MAP[prefix] ?? "general",
      };
    });
  },

  /** Générer un PDF de contrat (avec template optionnel) — retourne JSON */
  generatePdf(
    leaseId: string,
    templateId?: string,
  ): Promise<ContractTemplatePdfResponse> {
    const qs = new URLSearchParams({ leaseId });
    if (templateId) qs.set('templateId', templateId);
    return api.get<ContractTemplatePdfResponse>(`${BASE}/generate-pdf?${qs.toString()}`);
  },

  /**
   * Télécharger le PDF directement comme Blob.
   * Utilise le même endpoint mais avec api.download si l'API renvoie un binaire.
   * Fallback : si le JSON contient une URL, on la fetch.
   */
  async downloadPdf(leaseId: string, templateId?: string): Promise<Blob> {
    const qs = new URLSearchParams({ leaseId });
    if (templateId) qs.set('templateId', templateId);
    const path = `${BASE}/generate-pdf?${qs.toString()}`;

    // Tentative binaire d'abord
    try {
      const token = tokenManager.getAccess();
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('pdf') || contentType.includes('octet-stream')) {
        return res.blob();
      }
      // JSON → extraire l'URL et retélécharger
      const json = await res.json();
      const url: string | undefined =
        json?.data?.url ?? json?.data?.pdfUrl ?? json?.url ?? json?.pdfUrl;
      if (url) {
        const pdfRes = await fetch(url);
        return pdfRes.blob();
      }
      throw new Error('Format de réponse PDF non reconnu');
    } catch (err) {
      throw err;
    }
  },

  /** Liste de tous les templates */
  list(): Promise<ApiResponse<ContractTemplate[]>> {
    return api.get<ApiResponse<ContractTemplate[]>>(BASE);
  },

  /** Détail d'un template */
  getById(id: string): Promise<ApiResponse<ContractTemplate>> {
    return api.get<ApiResponse<ContractTemplate>>(`${BASE}/${id}`);
  },

  /** Créer un template */
  create(payload: ContractTemplatePayload): Promise<ApiResponse<ContractTemplate>> {
    return api.post<ApiResponse<ContractTemplate>>(BASE, payload);
  },

  /** Aperçu HTML d'un template rendu avec un bail */
  preview(id: string, leaseId: string): Promise<ContractTemplatePreviewResponse> {
    return api.post<ContractTemplatePreviewResponse>(`${BASE}/${id}/preview`, { leaseId });
  },

  /** Modifier un template */
  update(id: string, payload: ContractTemplatePayload): Promise<ApiResponse<ContractTemplate>> {
    return api.put<ApiResponse<ContractTemplate>>(`${BASE}/${id}`, payload);
  },

  /** Supprimer un template */
  delete(id: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`${BASE}/${id}`);
  },
};
