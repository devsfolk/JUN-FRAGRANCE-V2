import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { ShopCatalog } from "@/components/site/shop-catalog";
import { JournalPlacement } from "@/components/site/journal-placement";
import {
  getAllShopProducts,
  getActiveCategories,
  getPublicSettings,
  getPageSEO,
} from "@/lib/site/public-data";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [pageSeo] = await Promise.all([getPageSEO("shop")]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const title = pageSeo?.seo_title?.trim() || "Shop All Perfumes | Premium Fragrances in Pakistan";
  const description =
    pageSeo?.seo_description?.trim() ||
    "Explore our complete collection of long-lasting, luxury perfumes crafted for Pakistan. Find your signature scent with fast WhatsApp ordering.";
  const ogImage = pageSeo?.og_image_url?.trim() || `${siteUrl}/hero/scene-1.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/shop`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/shop`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      images: [{ url: ogImage }],
    },
  };
}

export default async function ShopPage() {
  const [products, categories, rawSettings] = await Promise.all([
    getAllShopProducts(),
    getActiveCategories(),
    getPublicSettings(),
  ]);

  const number = extractWhatsappNumber(rawSettings);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  return (
    <div className="bg-ink pb-20 pt-10 md:pt-14">
      <Container>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">
            Home
          </Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">Shop</span>
        </nav>

        {/* H1 Heading */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl md:text-5xl">
            Shop all perfumes
          </h1>
          <p className="mt-2 text-sm text-mute sm:text-base">
            Crafted for lasting projection and presence in Pakistan.
          </p>
        </div>

        {/* Category Chips: All, then each active category linking to /category/<slug> */}
        {categories.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            <span
              aria-current="page"
              className="rounded-full border border-gold bg-gold/15 px-4 py-1.5 text-xs font-medium text-gold"
            >
              All
            </span>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="rounded-full border border-white/10 bg-ink-2 px-4 py-1.5 text-xs font-medium text-mute transition-colors hover:border-gold/40 hover:text-bone"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Search & Products Grid */}
        <ShopCatalog
          products={products}
          whatsappNumber={number}
          siteUrl={siteUrl}
        />
      </Container>
      <JournalPlacement placement="shop" title="Perfume guides" />
    </div>
  );
}
