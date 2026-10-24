import Link from "next/link";
import { LogoutButton } from "@/components/dashboard/logout-button";

const sections = [
  { label: "Overview", href: "/dashboard" },
  { label: "Categories", href: "/dashboard/categories" },
  { label: "Products", href: "/dashboard/products" },
  { label: "Blog", href: "/dashboard/blog" },
  { label: "SEO", href: "/dashboard/seo" },
  { label: "Settings", href: "/dashboard/settings" },
];

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 gap-6 p-4 md:grid-cols-[14rem_minmax(0,1fr)] md:p-6">
      <aside className="flex flex-col gap-4 border-b pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <nav aria-label="Dashboard" className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {sections.map(({ label, href }) => (
            <Link className="flex min-h-11 items-center rounded border px-3" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <main className="min-w-0 py-2">{children}</main>
    </div>
  );
}