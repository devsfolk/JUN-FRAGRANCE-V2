"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/dashboard/logout-button";

const sections = [
  { label: "Overview", href: "/dashboard", ready: true },
  { label: "Categories", href: "/dashboard/categories", ready: true },
  { label: "Products", href: "/dashboard/products", ready: true },
  { label: "Blog", href: "/dashboard/blog", ready: false },
  { label: "SEO", href: "/dashboard/seo", ready: false },
  { label: "Settings", href: "/dashboard/settings", ready: false },
];

function DashboardNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="grid gap-1">
      {sections.map(({ label, href, ready }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-between gap-2 rounded-md px-3 text-sm font-medium ${active ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-100"}`}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <span>{label}</span>
            {!ready ? <span className="text-xs font-normal text-slate-500">Coming soon</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link className="flex min-h-11 items-center text-lg font-semibold text-slate-950" href="/dashboard" onClick={onNavigate}>
        Jun.fragrance
      </Link>
      <DashboardNavigation onNavigate={onNavigate} />
      <div className="mt-auto border-t border-slate-200 pt-4">
        <LogoutButton />
      </div>
    </div>
  );
}

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block">
        <SidebarContents />
      </aside>

      <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-slate-200 bg-white px-3 md:hidden">
        <button
          aria-controls="mobile-dashboard-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-slate-300 text-xl"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? "×" : "☰"}
        </button>
        <span className="font-semibold">Dashboard</span>
      </header>

      {menuOpen ? (
        <>
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside
            aria-label="Mobile dashboard navigation"
            className="fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] bg-white shadow-xl md:hidden"
            id="mobile-dashboard-navigation"
          >
            <SidebarContents onNavigate={() => setMenuOpen(false)} />
          </aside>
        </>
      ) : null}

      <main className="min-w-0 px-4 py-5 pb-10 md:ml-64 md:px-8 md:py-8">{children}</main>
    </div>
  );
}