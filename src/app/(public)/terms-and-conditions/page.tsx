import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";

export const metadata: Metadata = {
  title: "Terms & Conditions | Jun.fragrance",
  description:
    "Terms and conditions for Jun.fragrance. Orders are placed through WhatsApp. Read our usage terms, intellectual property notice, and disclaimers.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "26 October 2026";
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
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">1. Introduction</h2>
            <p>
              These Terms &amp; Conditions govern your use of the Jun.fragrance website and your purchase
              of products from us. By browsing this website or placing an order, you agree to these terms.
              If you do not agree, please do not use this website.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">2. Orders</h2>
            <p>
              All orders are placed and confirmed through WhatsApp. An order is not confirmed until we send
              you a confirmation message. We reserve the right to cancel or refuse any order at our discretion.
              Product availability is subject to change without prior notice.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">3. Pricing</h2>
            <p>
              Prices displayed on this website are in Pakistani Rupees (PKR) and are subject to change.
              The price applicable to your order is the price confirmed to you on WhatsApp at the time of
              your order.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">4. Payment</h2>
            <p>
              Payment methods and details are confirmed on WhatsApp when you place an order. We will
              communicate all payment instructions to you directly.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">5. Delivery</h2>
            <p>
              Delivery areas, timeframes, and any applicable charges are confirmed on WhatsApp when you
              place an order. We cannot guarantee specific delivery windows.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">6. Returns &amp; Refunds</h2>
            <p>
              Our returns and refund policy is confirmed on WhatsApp when you place an order. Please contact
              us directly if you have an issue with your purchase.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">7. Intellectual Property</h2>
            <p>
              All content on this website — including text, images, logos, and design — is the property of
              Jun.fragrance unless stated otherwise. You may not reproduce or distribute any content without
              our written permission.
            </p>
            <p className="mt-3 rounded-xl border border-white/10 bg-ink-2/60 p-4 text-bone/70">
              {TRADEMARK_NOTICE}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">8. Limitation of Liability</h2>
            <p>
              Jun.fragrance is not liable for any indirect, incidental, or consequential damages arising
              from the use of our products or website. Our total liability is limited to the amount paid for
              the product in question.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">9. Changes to These Terms</h2>
            <p>
              We may update these Terms &amp; Conditions from time to time. The &ldquo;Last updated&rdquo; date
              at the top of this page will reflect any changes. Continued use of this website after changes
              constitutes your acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">10. Contact</h2>
            <p>
              For any questions regarding these terms, please{" "}
              <Link href="/contact" className="text-gold underline underline-offset-4 hover:text-gold/80">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
