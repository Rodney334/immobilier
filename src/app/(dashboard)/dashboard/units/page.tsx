import type { Metadata } from "next";
import { UnitsClient } from "./UnitsClient";

export const metadata: Metadata = {
  title: "Locaux | Estate Mangement",
};

export default function UnitsPage() {
  return <UnitsClient />;
}
