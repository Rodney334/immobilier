import type { PaymentMethod } from "@/types";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH",          label: "Espèces" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
  { value: "MOBILE_MONEY",  label: "Mobile Money" },
  { value: "MTN_MOMO",      label: "MTN MoMo" },
  { value: "MOOV_MONEY",    label: "MOOV Money" },
  { value: "CHEQUE",        label: "Chèque" },
  { value: "CARD",          label: "Carte bancaire" },
  { value: "OTHER",         label: "Autre" },
];

/** Lookup rapide valeur → label */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> =
  Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label])) as Record<
    PaymentMethod,
    string
  >;

/** Retourne le label ou la valeur brute si inconnue */
export function getPaymentMethodLabel(value: string | undefined | null): string {
  if (!value) return "—";
  return PAYMENT_METHOD_LABELS[value as PaymentMethod] ?? value;
}
