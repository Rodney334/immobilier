import type { Metadata } from "next";
import { ContractTemplatesClient } from "./ContractTemplatesClient";

export const metadata: Metadata = { title: "Modèles de contrat | Estate Management" };

export default function ContractTemplatesPage() {
  return <ContractTemplatesClient />;
}
