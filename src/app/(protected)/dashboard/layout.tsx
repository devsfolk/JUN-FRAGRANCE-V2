import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<p className="p-4">Loading dashboard…</p>}>
      <AuthorizedDashboard>{children}</AuthorizedDashboard>
    </Suspense>
  );
}

async function AuthorizedDashboard({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  await requireAdmin();
  return <DashboardShell>{children}</DashboardShell>;
}