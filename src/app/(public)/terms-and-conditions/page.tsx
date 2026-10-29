import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";

export const metadata: Metadata = {
  title: "Terms & Conditions | Jun.fragrance",
  description:
    "Terms and conditions for Jun.fragrance. Orders are placed through WhatsApp. Read our usage terms, intellectual property notice, and disclaimers.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "29 October 2026";
const TRADEMARK_NOTICE =
  'Jun.fragrance is an independent brand. Names in "inspired by" lines belong to their respective owners and are not affiliated with Jun.fragrance.';

export default function TermsPage() {
  return (
    <div className="bg-ink pb-24 pt-10 md:pt-14">
      <Container className="max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">Home</Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">Terms &amp; Conditions</span>
        </nav>

        <h1 className="font-serif text-3xl font-normal text-bone sm:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-2 text-xs text-mute">Last updated: {LAST_UPDATED}</p>

        <div className="prose-custom mt-10 space-y-8 text-sm leading-relaxed text-bone/80">

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">1. About these terms</h2>
            <p className="mt-3">These terms apply when you use junfragrance.com or order from Jun.fragrance, a small perfume business based in Karachi, Pakistan. By placing an order, you agree to them. If something is unclear, message us on WhatsApp at +92 305 1856667 before you order.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">2. How ordering works</h2>
            <p className="mt-3">The website does not take payments or create customer accounts. You choose your perfumes, then use Order now, Add to cart or the bundle page to send your order to us on WhatsApp. An order is confirmed only when we reply and confirm it with you on WhatsApp. We may decline or cancel an order, for example if a product is unavailable or the details are incomplete, and we will tell you if that happens.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">3. Prices</h2>
            <p className="mt-3">All prices are in Pakistani rupees (PKR). A 50 ml perfume costs Rs. 1,999, and any three perfumes together cost Rs. 4,500. We may change prices, but the price confirmed with you on WhatsApp for your order is the price you pay.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">4. Payment</h2>
            <p className="mt-3">You can pay by cash on delivery or online. For online payment, we share our account details with you on WhatsApp. Please pay only to account details that we send you in our own WhatsApp chat.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">5. Delivery</h2>
            <p className="mt-3">We deliver across Pakistan. Delivery usually takes 3 to 5 days, and deliveries are made between 12 PM and 9 PM. Delivery is free within Karachi. Outside Karachi, delivery charges are between Rs. 200 and Rs. 250. Delivery times can change because of courier delays, weather or public holidays. Please give a complete address and a phone number that works.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">6. Returns</h2>
            <p className="mt-3">We have a 7-day return policy. The conditions for a return, and how it is handled, are confirmed with you on WhatsApp. Please message us as soon as you have a problem with your order.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">7. Exchanges</h2>
            <p className="mt-3">Exchanges are available. For any exchange, the customer pays the delivery charges, including within Karachi. Details are confirmed on WhatsApp.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">8. About our perfumes</h2>
            <p className="mt-3">Our perfumes are independent products made in scent styles that may feel familiar. They are not originals from other brands, and Jun.fragrance has no link to those brands. Product pages describe the mood of each perfume and, where we know them, its notes.</p>
            <p className="mt-3">Scent is personal. How a perfume smells and how long it lasts can vary with skin, weather and how it is applied. We estimate that our perfumes last approximately 6 to 8 hours, but this is an estimate, not a promise. If you have sensitive skin or allergies, test a small amount first and stop using the perfume if you feel irritation.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">9. Website content</h2>
            <p className="mt-3">The text, images and product names on this website belong to Jun.fragrance. Please do not copy them for commercial use without asking us first.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">10. Governing law</h2>
            <p className="mt-3">These terms are governed by the laws of Pakistan.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">11. Changes to these terms</h2>
            <p className="mt-3">We may update these terms from time to time. The date at the top of this page shows when they last changed.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">12. Contact</h2>
            <p className="mt-3">Message us on WhatsApp at +92 305 1856667. We are based in Karachi, Pakistan.</p>
          </section>
        </div>
      </Container>
    </div>
  );
}
