import type { Metadata } from "next";
import { ReportsClient } from "./ReportsClient";

export const metadata: Metadata = {
  title: "Rapports | Estate Mangement",
};

export default function ReportsPage() {
  return <ReportsClient />;
}
