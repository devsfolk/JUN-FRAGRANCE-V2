import type { Metadata } from "next";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAdmin } from "@/lib/auth/require-admin";

const checkDashboardAccess = cache(async () => requireAdmin());

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
  await checkDashboardAccess();
  return <DashboardShell>{children}</DashboardShell>;
}