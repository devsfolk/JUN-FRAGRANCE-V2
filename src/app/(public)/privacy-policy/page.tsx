import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy | Jun.fragrance",
  description:
    "Jun.fragrance privacy policy. We collect only the information you share with us on WhatsApp to process your order. We do not sell your data.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "26 October 2026";

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
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">1. Who We Are</h2>
            <p>
              Jun.fragrance is a fragrance brand based in Pakistan. This Privacy Policy explains how we
              handle information when you interact with our website or contact us on WhatsApp to place an order.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">2. Information We Collect</h2>
            <p>
              We collect only the information you voluntarily provide to us through WhatsApp conversations
              when placing or enquiring about an order. This typically includes:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-bone/70">
              <li>Your name</li>
              <li>Your phone number (from WhatsApp)</li>
              <li>Your delivery address</li>
            </ul>
            <p className="mt-3">
              We do not run account registrations and we do not collect payment card data directly.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">3. How We Use Your Information</h2>
            <p>
              We use the information you share solely to:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-bone/70">
              <li>Process and fulfil your order</li>
              <li>Communicate with you about your order through WhatsApp</li>
              <li>Respond to your enquiries</li>
            </ul>
            <p className="mt-3">We do not use your information for marketing without your consent.</p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">4. We Do Not Sell Your Data</h2>
            <p>
              We do not sell, rent, or trade your personal information to any third party.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">5. Cookies &amp; Analytics</h2>
            <p>
              This website may use analytics tools (such as Vercel Analytics) that set cookies or collect
              anonymous usage data to help us understand how visitors use the site. This data does not
              personally identify you. You can disable cookies in your browser settings at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">6. Data Retention</h2>
            <p>
              We retain your order-related information in our WhatsApp chat history for as long as
              necessary to handle your order and any follow-up enquiries. You may request deletion of
              your information by contacting us on WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">7. Third-Party Services</h2>
            <p>
              WhatsApp is operated by Meta Platforms, Inc. When you communicate with us on WhatsApp,
              Meta&apos;s own privacy policy applies to that communication. We encourage you to review
              WhatsApp&apos;s privacy policy separately.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">8. Your Rights</h2>
            <p>
              You have the right to access, correct, or request deletion of any personal information
              we hold about you. To exercise these rights, please contact us on WhatsApp via our{" "}
              <Link href="/contact" className="text-gold underline underline-offset-4 hover:text-gold/80">
                Contact page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at
              the top of this page will reflect any changes. Continued use of this website after changes
              constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-medium text-bone">10. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please{" "}
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
