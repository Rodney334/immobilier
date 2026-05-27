import type { Metadata } from "next";
import { DashboardHomeClient } from "./DashboardHomeClient";

export const metadata: Metadata = {
  title: "Tableau de bord | Estate Mangement",
};

export default function DashboardPage() {
  return <DashboardHomeClient />;
}
