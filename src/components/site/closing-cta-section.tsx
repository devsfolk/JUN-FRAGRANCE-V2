import { Container } from "./ui/container";
import { Button } from "./ui/button";
import { getPublicSettings } from "@/lib/site/public-data";
import { whatsappLink, whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export async function ClosingCtaSection() {
  const rawSettings = await getPublicSettings();
  const number = extractWhatsappNumber(rawSettings);
  const chatUrl = number
    ? whatsappLink(
        number,
        "Assalam o Alaikum! I have questions about a fragrance from Jun.fragrance."
      )
    : null;

  return (
    <section className="relative border-t border-white/10 bg-ink py-20 text-center md:py-28">
      {/* Background radial accent tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-gold) 15%, transparent) 0%, transparent 65%)",
        }}
      />

      <Container className="relative z-10 max-w-2xl">
        <p className="font-script text-3xl text-gold/95 sm:text-4xl md:text-5xl">
          More than just a fragrance. It&apos;s a vibe.
        </p>

        <p className="mt-4 text-xs tracking-wide text-mute sm:text-sm md:text-base">
          Questions about a scent? Chat with us.
        </p>

        {chatUrl ? (
          <div className="mt-8 flex justify-center">
            <Button href={chatUrl} target="_blank" rel="noreferrer">
              <span className="flex items-center gap-2">
                <span>Chat with us</span>
                <span aria-hidden="true">↗</span>
              </span>
            </Button>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
