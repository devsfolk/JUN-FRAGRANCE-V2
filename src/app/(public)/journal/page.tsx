import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/site/ui/container";
import { getPublishedBlogPosts, getPageSEO } from "@/lib/site/public-data";
import { JsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [pageSeo] = await Promise.all([getPageSEO("journal")]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const title = pageSeo?.seo_title?.trim() || "Fragrance Stories & Guides";
  const description =
    pageSeo?.seo_description?.trim() ||
    "Explore our journal for fragrance tips, layering advice, and stories behind our luxury scents in Pakistan.";
  const ogImage = pageSeo?.og_image_url?.trim() || `${siteUrl}/hero/scene-1.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/journal`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/journal`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      images: [{ url: ogImage }],
    },
  };
}

function calculateReadingTime(content: string | null): number {
  if (!content) return 2;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export default async function JournalPage() {
  const posts = await getPublishedBlogPosts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Journal", url: `${siteUrl}/journal` },
  ];

  return (
    <div className="bg-ink pb-24 pt-10 md:pt-14">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Container>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">
            Home
          </Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">Journal</span>
        </nav>

        {/* H1 Title */}
        <div className="mb-12 max-w-2xl">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl md:text-5xl">
            Journal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">
            Notes on scent craft, layering rituals, and olfactory stories from Pakistan.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const readingTime = calculateReadingTime(post.content);
              const dateStr = post.published_at
                ? new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <article
                  key={post.slug}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-ink-2/60 transition-colors hover:border-gold/40"
                >
                  <Link href={`/journal/${post.slug}`} className="flex flex-col">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
                      {post.cover_image_url ? (
                        <Image
                          src={post.cover_image_url}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-mute font-serif">
                          JUN.FRAGRANCE JOURNAL
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-mute">
                        {dateStr ? <span>{dateStr}</span> : null}
                        <span>•</span>
                        <span>{readingTime} min read</span>
                      </div>

                      <h2 className="mt-2.5 font-serif text-xl font-medium text-bone transition-colors group-hover:text-gold">
                        {post.title}
                      </h2>

                      {post.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-mute">
                          {post.excerpt}
                        </p>
                      ) : null}
                    </div>
                  </Link>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/journal/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold transition-colors hover:underline"
                    >
                      <span>Read article</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-ink-2/60 p-12 text-center">
            <p className="font-serif text-xl text-bone">No journal entries yet</p>
            <p className="mt-2 text-sm text-mute">
              Check back soon for new fragrance stories, olfactory guides, and updates.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
