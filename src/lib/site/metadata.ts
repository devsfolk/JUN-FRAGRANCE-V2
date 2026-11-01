import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

export function pageAlternates(path: string): NonNullable<Metadata["alternates"]> {
  const canonical = `${siteUrl}${path}`;
  return {
    canonical,
    languages: {
      "en-PK": canonical,
      "x-default": canonical,
    },
  };
}
