import type { ReactNode } from "react";
import { DashboardShell } from "@/components/features/DashboardShell";
import { AuthGuard } from "@/components/features/AuthGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
