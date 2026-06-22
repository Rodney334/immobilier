import type { Metadata } from "next";
import { IncidentsClient } from "./IncidentsClient";

export const metadata: Metadata = { title: "Incidents | Estate Mangement" };

export default function IncidentsPage() {
  return <IncidentsClient />;
}
