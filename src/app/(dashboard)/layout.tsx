import type { ReactNode } from "react";
import { Sidebar } from "@/components/features/Sidebar";
import { AuthGuard } from "@/components/features/AuthGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-neutral">
        <Sidebar />
        <main
          className="ml-60 flex-1 min-w-0 overflow-y-auto"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
