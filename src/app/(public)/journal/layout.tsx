import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": `${siteUrl}/journal/rss.xml`,
    },
  },
};

export default function JournalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
