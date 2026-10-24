import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard/login");
  }

  const { data: admin, error } = await supabase
    .from("jf_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !admin) {
    redirect("/dashboard/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}