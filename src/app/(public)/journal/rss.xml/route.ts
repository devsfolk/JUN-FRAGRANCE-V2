import { getPublishedBlogPosts } from "@/lib/site/public-data";

export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const posts = (await getPublishedBlogPosts()).slice(0, 30);
  const items = posts.map((post) => {
    const link = `${siteUrl}/journal/${post.slug}`;
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.excerpt ?? "")}</description>
      <pubDate>${new Date(post.published_at!).toUTCString()}</pubDate>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Jun.fragrance Journal</title>
    <link>${escapeXml(`${siteUrl}/journal`)}</link>
    <description>Perfume notes and practical fragrance guides from Jun.fragrance.</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
    },
  });
}
