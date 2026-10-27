import type { Metadata } from "next";
import { LoginForm } from "@/components/dashboard/login-form";

export const metadata: Metadata = {
  title: "Dashboard login | Jun.fragrance V2",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm items-center px-4 py-8">
      <section className="w-full">
        <h1 className="mb-6 text-xl font-semibold">Dashboard login</h1>
        <LoginForm />
      </section>
    </main>
  );
}