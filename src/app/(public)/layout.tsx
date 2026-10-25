import { SiteLayout } from "@/components/site/site-layout";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteLayout>{children}</SiteLayout>;
}