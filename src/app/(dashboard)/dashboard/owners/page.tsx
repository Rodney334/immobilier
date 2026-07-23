import type { Metadata } from "next";
import { OwnersClient } from "./OwnersClient";

export const metadata: Metadata = {
  title: "Propriétaires | Estate Project",
};

export default function OwnersPage() {
  return <OwnersClient />;
}
