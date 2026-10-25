import type { NextConfig } from "next";

// Required to compile Tailwind v4 utilities through Turbopack.
// Partial prefetching and Cache Components are omitted because this app does not use route-shell prefetch.
const nextConfig: NextConfig = {
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