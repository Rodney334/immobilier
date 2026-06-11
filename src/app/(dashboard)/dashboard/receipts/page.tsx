import type { Metadata } from "next";
import { ReceiptsClient } from "./ReceiptsClient";

export const metadata: Metadata = {
  title: "Recus | Estate Management",
};

export default function ReceiptsPage() {
  return <ReceiptsClient />;
}
