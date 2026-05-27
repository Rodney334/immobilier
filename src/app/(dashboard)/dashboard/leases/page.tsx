import type { Metadata } from "next";
import { LeasesClient } from "./LeasesClient";

export const metadata: Metadata = {
  title: "Contrats de bail | Estate Mangement",
};

export default function LeasesPage() {
  return <LeasesClient />;
}
