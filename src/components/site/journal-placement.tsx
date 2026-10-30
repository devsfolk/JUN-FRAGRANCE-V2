import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/site/ui/container";
import { getPlacementPosts } from "@/lib/site/public-data";

interface JournalPlacementProps {
  placement: string; // "home" | "category:<slug>" | "product:<slug>"
  title?: string;
  eyebrow?: string;
}

export async function JournalPlacement({
  placement,
  title = placement.startsWith("product:") ? "From the journal" : "Perfume guides",
  eyebrow = "STORIES & CRAFT",
}: JournalPlacementProps) {
  const posts = await getPlacementPosts(placement, 3);

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/10 bg-ink py-16 md:py-24">
      <Container>
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs uppercase tracking-wider text-gold font-semibold">
              {eyebrow}
            </span>
            <h2 className="mt-1 font-serif text-2xl font-medium text-bone sm:text-3xl md:text-4xl">
              {title}
            </h2>
          </div>

          <Link
            href="/journal"
            className="text-xs font-semibold text-gold transition-colors hover:underline"
          >
            View all articles →
          </Link>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] min-w-0 max-w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-ink-2/60 transition-colors hover:border-gold/40"
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

                <div className="p-5">
                  <h3 className="font-serif text-lg font-medium text-bone transition-colors group-hover:text-gold line-clamp-2">
                    {post.title}
                  </h3>

                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-mute">
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
