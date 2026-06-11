import type { Metadata } from "next";
import { SchedulesClient } from "./SchedulesClient";

export const metadata: Metadata = {
  title: "Échéances de loyer | Estate Mangement",
};

export default function SchedulesPage() {
  return <SchedulesClient />;
}
