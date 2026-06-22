import type { Metadata } from "next";
import { DepositsClient } from "./DepositsClient";

export const metadata: Metadata = { title: "Garanties | Estate Mangement" };

export default function DepositsPage() {
  return <DepositsClient />;
}
