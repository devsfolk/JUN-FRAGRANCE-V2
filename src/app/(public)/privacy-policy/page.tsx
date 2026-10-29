import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy | Jun.fragrance",
  description:
    "Jun.fragrance privacy policy. We collect only the information you share with us on WhatsApp to process your order. We do not sell your data.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "29 October 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-ink pb-24 pt-10 md:pt-14">
      <Container className="max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">Home</Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">Privacy Policy</span>
        </nav>

        <h1 className="font-serif text-3xl font-normal text-bone sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-xs text-mute">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-bone/80">

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">1. What this page covers</h2>
            <p className="mt-3">This page explains what personal details Jun.fragrance collects when you order from us, why we collect them and what we do with them.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">2. What we collect</h2>
            <p className="mt-3">When you order on WhatsApp, you give us your name, phone number and delivery address, along with the perfumes you want. We collect only what we need to process your order. The website has no customer accounts and does not take payments.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">3. How we use your details</h2>
            <p className="mt-3">We use your details only to confirm and process your order, arrange delivery, handle returns and exchanges, and reply to your questions.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">4. Who sees your details</h2>
            <p className="mt-3">We do not sell your details, and we do not share them for advertising. We share only what a courier needs to deliver your order, such as your name, phone number and address. WhatsApp is run by a third party, so our chats are also covered by WhatsApp&apos;s own terms and privacy policy.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">5. Online payment</h2>
            <p className="mt-3">If you choose online payment, we share our account details with you in the WhatsApp chat. Please pay only to details we send you in our own chat.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">6. How long we keep your details</h2>
            <p className="mt-3">We keep order details only as long as we need them for your order, any return or exchange, and basic business records.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">7. Your choices</h2>
            <p className="mt-3">You can message us on WhatsApp to ask what details we hold about you, to correct them, or to ask us to delete them. We will do this unless we still need the details for an order that is not complete or for our records.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">8. Website data</h2>
            <p className="mt-3">The website may record basic technical information, such as which pages are visited and what type of device is used, through our hosting or analytics tools. We use this to keep the site working and to understand which pages are useful. This information does not include your name or phone number.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">9. Changes to this page</h2>
            <p className="mt-3">We may update this page from time to time. The date at the top shows when it last changed.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">10. Contact</h2>
            <p className="mt-3">For any question about your details, message us on WhatsApp at +92 305 1856667.</p>
          </section>
        </div>
      </Container>
    </div>
  );
}
