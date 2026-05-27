import type { Metadata } from "next";
import { PropertiesClient } from "./PropertiesClient";

export const metadata: Metadata = {
  title: "Biens immobiliers | Estate Mangement",
};

export default function PropertiesPage() {
  return <PropertiesClient />;
}
