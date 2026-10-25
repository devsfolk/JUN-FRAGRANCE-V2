import { Container } from "./ui/container";
import { Button } from "./ui/button";
import { Reveal } from "./reveal";

const trustPoints = [
  {
    title: "Premium ingredients",
    description: "Finest aroma oils & natural extracts",
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6 text-gold"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
        />
      </svg>
    ),
  },
  {
    title: "Long lasting performance",
    description: "Rich concentration that lasts 10+ hours",
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6 text-gold"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Inspired by iconic scents",
    description: "High accuracy tribute creations",
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6 text-gold"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
        />
      </svg>
    ),
  },
  {
    title: "Crafted in Pakistan",
    description: "Proudly formulated & bottled locally",
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6 text-gold"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    ),
  },
];

export function StorySection() {
  return (
    <section id="story" className="border-t border-white/10 bg-ink py-20 md:py-32">
      <Container className="max-w-5xl">
        {/* Main Story Narrative */}
        <div className="flex flex-col items-start text-left">
          <Reveal delayMs={50}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.3em] text-gold md:text-xs">
              OUR STORY
            </p>
          </Reveal>

          <Reveal delayMs={150}>
            <h2 className="font-serif text-3xl font-normal leading-[1.12] text-bone sm:text-4xl md:text-6xl lg:text-[4rem]">
              Crafted for those who lead
            </h2>
          </Reveal>

          <Reveal delayMs={250}>
            <p className="mt-6 max-w-3xl font-serif text-xl font-normal leading-relaxed text-bone/90 sm:text-2xl md:text-3xl md:leading-[1.4]">
              Jun.fragrance was born from a simple belief: fragrance is more than a
              scent, it&apos;s a feeling. We create premium, long-lasting fragrances
              inspired by the world&apos;s most iconic scents, made for people who
              want to stand out, not blend in.
            </p>
          </Reveal>

          <Reveal delayMs={350} className="mt-8">
            <Button variant="ghost" href="/about">
              Our story
            </Button>
          </Reveal>
        </div>

        {/* Four Trust Points */}
        <div className="mt-16 grid grid-cols-2 gap-4 border-t border-white/10 pt-12 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {trustPoints.map((point, idx) => (
            <Reveal
              key={point.title}
              delayMs={100 + idx * 80}
              className="flex flex-col items-start rounded-xl border border-white/5 bg-ink-2/60 p-5 backdrop-blur-sm sm:p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                {point.icon}
              </div>
              <h3 className="font-serif text-lg font-medium text-bone sm:text-xl">
                {point.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-mute">
                {point.description}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
