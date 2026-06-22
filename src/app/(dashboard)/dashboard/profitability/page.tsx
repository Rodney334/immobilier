import type { Metadata } from "next";
import { ProfitabilityClient } from "./ProfitabilityClient";

export const metadata: Metadata = { title: "Rentabilité | Estate Mangement" };

export default function ProfitabilityPage() {
  return <ProfitabilityClient />;
}
