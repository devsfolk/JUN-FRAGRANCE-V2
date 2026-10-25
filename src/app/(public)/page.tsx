import { Container } from "@/components/site/ui/container";

export const metadata = {
  title: "Jun.fragrance | Premium Perfumes in Pakistan",
  description: "Premium fragrances crafted for the modern you. Bold. Elegant. Unforgettable.",
};

export default function HomePage() {
  return (
    <section className="flex min-h-[75dvh] items-center py-28">
      <Container>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.3em] text-gold">
          JUN.FRAGRANCE
        </p>
        <h1 className="font-serif text-6xl font-normal text-bone md:text-8xl">
          Jun.fragrance
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-mute">
          Home coming soon
        </p>
      </Container>
    </section>
  );
}
