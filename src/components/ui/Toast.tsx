"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "danger" | "warning";

export type ToastData = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Durée en ms avant auto-dismiss (défaut : 5000) */
  duration?: number;
};

type ToastInput = Omit<ToastData, "id">;

// ─── Context ──────────────────────────────────────────────────────────────────

type ToastContextValue = {
  toasts: ToastData[];
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast doit être utilisé à l'intérieur de <ToastProvider>");
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...input, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  success: {
    leftBorder: "border-l-[#2A9D8F]",
    Icon: CheckCircle2,
    iconClass: "text-[#2A9D8F]",
  },
  danger: {
    leftBorder: "border-l-[#E76F51]",
    Icon: AlertCircle,
    iconClass: "text-[#E76F51]",
  },
  warning: {
    leftBorder: "border-l-[#D4A373]",
    Icon: AlertTriangle,
    iconClass: "text-[#D4A373]",
  },
} satisfies Record<
  ToastVariant,
  { leftBorder: string; Icon: typeof CheckCircle2; iconClass: string }
>;

// ─── Single Toast item ────────────────────────────────────────────────────────

type ToastItemProps = ToastData & {
  onDismiss: (id: string) => void;
};

function ToastItem({
  id,
  variant,
  title,
  description,
  duration = 5000,
  onDismiss,
}: ToastItemProps) {
  const { leftBorder, Icon, iconClass } = VARIANT_CONFIG[variant];

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "flex items-start gap-3",
        "w-[360px] max-w-[calc(100vw-2.5rem)]",
        "bg-white rounded-lg shadow-lg",
        // Bordure générale fine + bord gauche épais coloré
        "border border-[#E5E7EB] border-l-4",
        leftBorder,
        "px-4 py-3.5",
      ].join(" ")}
    >
      {/* Icône de statut */}
      <Icon
        size={17}
        className={`${iconClass} shrink-0 mt-0.5`}
        aria-hidden="true"
      />

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-primary leading-tight">
          {title}
        </p>
        {description && (
          <p className="text-[12px] text-primary/55 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Bouton fermeture */}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="text-primary/30 hover:text-primary/65 transition-colors shrink-0 mt-0.5 rounded"
        aria-label="Fermer la notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ─── Toaster (container global) ───────────────────────────────────────────────

/**
 * Rendu automatiquement par ToastProvider.
 * Ne pas ajouter manuellement dans le layout.
 */
function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
