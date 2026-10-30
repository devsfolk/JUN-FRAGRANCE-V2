import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { MarkdownContent } from "@/components/site/markdown-content";
import {
  getBlogPostBySlug,
  getPublishedBlogPosts,
  getAllActiveBlogSlugs,
} from "@/lib/site/public-data";
import {
  JsonLd,
  breadcrumbJsonLd,
  articleJsonLd,
  faqPageJsonLd,
} from "@/lib/site/json-ld";

export const revalidate = 300;
export const dynamicParams = true;

interface JournalPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const posts = await getAllActiveBlogSlugs();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: JournalPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const title = post.seo_title?.trim() || post.title;
  const description =
    post.seo_description?.trim() ||
    post.excerpt?.trim() ||
    `Read ${post.title} on the Jun.fragrance journal.`;
  const ogImage = post.cover_image_url || `${siteUrl}/hero/scene-1.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/journal/${post.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/journal/${post.slug}`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

function calculateReadingTime(content: string | null): number {
  if (!content) return 2;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export default async function JournalPostPage({ params }: JournalPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const allPosts = await getPublishedBlogPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  const readingTime = calculateReadingTime(post.content);
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Journal", url: `${siteUrl}/journal` },
    { name: post.title, url: `${siteUrl}/journal/${post.slug}` },
  ];

  const articleLd = articleJsonLd({
    headline: post.title,
    image: post.cover_image_url,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    url: `${siteUrl}/journal/${post.slug}`,
    description: post.excerpt || post.seo_description,
  });

  const faqLd = post.faq.length > 0 ? faqPageJsonLd(post.faq) : null;

  return (
    <article className="bg-ink pb-24 pt-10 md:pt-14">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={articleLd} />
      {faqLd ? <JsonLd data={faqLd} /> : null}

      <Container>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">
            Home
          </Link>
          <span className="mx-2 text-white/20">/</span>
          <Link href="/journal" className="transition-colors hover:text-gold">
            Journal
          </Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone truncate max-w-[200px] sm:max-w-none">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-gold">
            {dateStr ? <span>{dateStr}</span> : null}
            <span>•</span>
            <span>{readingTime} min read</span>
          </div>

          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl md:text-5xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-4 text-base leading-relaxed text-mute sm:text-lg">
              {post.excerpt}
            </p>
          ) : null}
        </header>

        {/* Cover Image */}
        {post.cover_image_url ? (
          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        {/* Main Content */}
        <div className="mx-auto mt-12 max-w-3xl">
          {post.content ? (
            <MarkdownContent content={post.content} />
          ) : (
            <p className="text-sm text-mute">No content written for this article.</p>
          )}

          {/* Repeatable FAQ Block */}
          {post.faq.length > 0 ? (
            <section className="mt-16 border-t border-white/10 pt-10">
              <span className="text-xs uppercase tracking-wider text-gold font-semibold">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="mt-2 font-serif text-2xl font-medium text-bone sm:text-3xl">
                Questions & Answers
              </h2>

              <dl className="mt-6 space-y-4">
                {post.faq.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-ink-2/60 p-5"
                  >
                    <dt className="font-serif text-lg font-medium text-bone">
                      {f.question}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-mute">
                      {f.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 ? (
          <section className="mx-auto mt-20 max-w-5xl border-t border-white/10 pt-12">
            <div className="mb-8">
              <span className="text-xs uppercase tracking-wider text-gold font-semibold">
                MORE STORIES
              </span>
              <h2 className="mt-1 font-serif text-2xl font-medium text-bone sm:text-3xl">
                From the journal
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rel) => (
                <article
                  key={rel.slug}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-ink-2/60 p-4 transition-colors hover:border-gold/40"
                >
                  <Link href={`/journal/${rel.slug}`} className="flex flex-col">
                    {rel.cover_image_url ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-black/40">
                        <Image
                          src={rel.cover_image_url}
                          alt={rel.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <h3 className="mt-3 font-serif text-base font-medium text-bone transition-colors group-hover:text-gold line-clamp-2">
                      {rel.title}
                    </h3>

                    {rel.excerpt ? (
                      <p className="mt-1.5 line-clamp-2 text-xs text-mute leading-relaxed">
                        {rel.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </article>
  );
}
