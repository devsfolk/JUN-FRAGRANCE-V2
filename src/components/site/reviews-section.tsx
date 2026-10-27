import { SectionHeading } from "./ui/section-heading";
import { Container } from "./ui/container";
import { getApprovedReviews } from "@/lib/site/public-data";

export async function ReviewsSection() {
  const reviews = await getApprovedReviews();

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section id="reviews" className="border-t border-white/10 bg-ink-2 py-16 md:py-24">
      <SectionHeading
        eyebrow="CLIENT EXPERIENCES"
        title="Words from our patrons"
      />

      <Container>
        {/* Mobile: snap carousel, Desktop: 3-column grid */}
        <div className="flex min-w-0 max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 overscroll-x-contain [touch-action:pan-x_pan-y] [-webkit-overflow-scrolling:touch] scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex w-[80vw] max-w-[320px] flex-none snap-start flex-col justify-between rounded-2xl border border-white/10 bg-ink/60 p-6 backdrop-blur-sm md:w-auto md:max-w-none"
            >
              <div>
                {/* 5-star rating display with inline SVG */}
                <div className="flex items-center gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      aria-hidden="true"
                      className={`h-4 w-4 ${
                        i < review.rating ? "text-gold fill-gold" : "text-white/20 fill-none"
                      }`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                      />
                    </svg>
                  ))}
                </div>

                {review.body ? (
                  <p className="mt-4 font-serif text-base italic leading-relaxed text-bone/90 sm:text-lg">
                    &ldquo;{review.body}&rdquo;
                  </p>
                ) : null}
              </div>

              <div className="mt-6 border-t border-white/5 pt-3">
                <p className="font-sans text-xs font-semibold tracking-wider text-gold uppercase">
                  {review.author_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
