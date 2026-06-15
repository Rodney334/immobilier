import type { Metadata } from "next";
import { UsersClient } from "./UsersClient";

export const metadata: Metadata = {
  title: "Utilisateurs | Estate Management",
};

export default function UsersPage() {
  return <UsersClient />;
}
