import type { NextConfig } from "next";

// Required to compile Tailwind v4 utilities through Turbopack.
// Partial prefetching and Cache Components are omitted because this app does not use route-shell prefetch.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrlParts = supabaseUrl ? new URL(supabaseUrl) : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrlParts ? [{ protocol: supabaseUrlParts.protocol.slice(0, -1) as "https" | "http", hostname: supabaseUrlParts.hostname, port: supabaseUrlParts.port, pathname: "/storage/v1/object/public/jf-media/**" }] : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/dashboard/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;