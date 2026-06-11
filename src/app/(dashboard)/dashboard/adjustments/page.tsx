import type { Metadata } from "next";
import { AdjustmentsClient } from "./AdjustmentsClient";

export const metadata: Metadata = {
  title: "Ajustements | Estate Mangement",
};

export default function AdjustmentsPage() {
  return <AdjustmentsClient />;
}
