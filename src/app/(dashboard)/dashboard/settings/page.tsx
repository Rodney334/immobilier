import type { Metadata } from "next";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "Paramètres | Estate Mangement",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
