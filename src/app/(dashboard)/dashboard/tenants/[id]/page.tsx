import type { Metadata } from "next";
import { TenantProfileClient } from "./TenantProfileClient";

export const metadata: Metadata = {
  title: "Profil du locataire | Estate Management",
};

type Props = { params: Promise<{ id: string }> };

export default async function TenantProfilePage({ params }: Props) {
  const { id } = await params;
  return <TenantProfileClient tenantId={id} />;
}
