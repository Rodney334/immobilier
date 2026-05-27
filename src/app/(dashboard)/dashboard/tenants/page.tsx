import type { Metadata } from "next";
import { TenantsClient } from "./TenantsClient";

export const metadata: Metadata = { title: "Locataires | Estate Mangement" };

export default function TenantsPage() {
  return <TenantsClient />;
}
