import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { Price } from "@/components/site/ui/price";
import { ProductCard } from "@/components/site/ui/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { ProductStickyBar } from "@/components/site/product-sticky-bar";
import { ProductOrderControls } from "@/components/site/product-order-controls";
import { JournalPlacement } from "@/components/site/journal-placement";
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
  getAllActiveSlugs,
  getPublicSettings,
  getBundleSettings,
} from "@/lib/site/public-data";
import {
  whatsappNumber as extractWhatsappNumber,
  whatsappLink,
  productWhatsAppMessage,
} from "@/lib/site/whatsapp";
import { JsonLd, productJsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";

export const revalidate = 60;
export const dynamicParams = true;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const { products } = await getAllActiveSlugs();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Perfume Not Found | Jun.fragrance",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const title = product.seo_title?.trim() || `${product.title} | Jun.fragrance`;
  const description =
    product.seo_description?.trim() ||
    product.short_description?.trim() ||
    `Discover ${product.title}${product.inspired_by ? `, inspired by ${product.inspired_by}` : ""}, a premium long-lasting fragrance in Pakistan.`;

  const ogImage = product.images?.[0] || `${siteUrl}/hero/scene-1.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/shop/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/shop/${product.slug}`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      images: [
        {
          url: ogImage,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const [reviews, relatedProducts, rawSettings, bundleSettings] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.category_id, product.id, 4),
    getPublicSettings(),
    getBundleSettings(),
  ]);

  const number = extractWhatsappNumber(rawSettings);
  const accent = product.accent_color?.trim() || "#C9A66B";

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) /
            product.compare_at_price) *
            100
        )
      : null;

  const orderUrl = number
    ? whatsappLink(
        number,
        productWhatsAppMessage(
          product.title,
          product.size_ml,
          siteUrl,
          product.slug
        )
      )
    : null;

  const hasNotes =
    product.notes_top.length > 0 ||
    product.notes_heart.length > 0 ||
    product.notes_base.length > 0;

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Shop", url: `${siteUrl}/shop` },
    ...(product.category
      ? [
          {
            name: product.category.name,
            url: `${siteUrl}/category/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.title, url: `${siteUrl}/shop/${product.slug}` },
  ];

  const pJsonLd = productJsonLd({
    name: product.title,
    images: product.images,
    description:
      product.description ||
      product.short_description ||
      `Premium perfume ${product.title} in Pakistan`,
    price: product.price,
    url: `${siteUrl}/shop/${product.slug}`,
    reviews: reviews.map((r) => ({
      author_name: r.author_name,
      rating: r.rating,
      body: r.body,
    })),
  });

  return (
    <div className="bg-ink pb-24 pt-8 md:pb-20 md:pt-12">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={pJsonLd} />
      <Container>
        {/* Breadcrumb: Home / Shop / <category> / <product> */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center text-xs text-mute"
        >
          <Link href="/" className="transition-colors hover:text-gold">
            Home
          </Link>
          <span className="mx-2 text-white/20">/</span>
          <Link href="/shop" className="transition-colors hover:text-gold">
            Shop
          </Link>
          {product.category ? (
            <>
              <span className="mx-2 text-white/20">/</span>
              <Link
                href={`/category/${product.category.slug}`}
                className="transition-colors hover:text-gold"
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">{product.title}</span>
        </nav>

        {/* Product Hero Layout: Gallery on left, Details on right */}
        <div className="grid grid-cols-[minmax(0,1fr)] min-w-0 max-w-full gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Gallery Column */}
          <div className="min-w-0 max-w-full">
            <ProductGallery
              images={product.images}
              title={product.title}
              accentColor={accent}
            />
          </div>

          {/* Product Info Column */}
          <div className="flex min-w-0 max-w-full flex-col">
            {/* Gender tag & Category */}
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-mute">
              {product.category ? <span>{product.category.name}</span> : null}
              {product.gender ? (
                <>
                  <span className="text-white/20">•</span>
                  <span className="capitalize">{product.gender}</span>
                </>
              ) : null}
            </div>

            {/* H1 Title */}
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl lg:text-5xl">
              {product.title}
            </h1>

            {/* Inspired by line */}
            {product.inspired_by ? (
              <p className="mt-1.5 text-sm text-gold/90 sm:text-base">
                Inspired by {product.inspired_by}
              </p>
            ) : null}

            {/* Size */}
            <p className="mt-2 text-xs text-mute">
              Volume: <span className="text-bone">{product.size_ml} ml</span>
            </p>

            {/* Price with compare price and Save % badge */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="font-serif text-2xl font-semibold text-gold sm:text-3xl">
                <Price value={product.price} />
              </span>

              {product.compare_at_price &&
              product.compare_at_price > product.price ? (
                <span className="text-sm text-mute line-through sm:text-base">
                  <Price value={product.compare_at_price} />
                </span>
              ) : null}

              {discountPercent ? (
                <span className="rounded-full border border-gold/40 bg-gold/15 px-3 py-0.5 text-xs font-semibold text-gold">
                  Save {discountPercent}%
                </span>
              ) : null}
            </div>

            {/* Bundle Promotion Line */}
            {bundleSettings.enabled ? (
              <p className="mt-2 text-xs text-bone/85 sm:text-sm">
                Buy any 3 for <Price value={bundleSettings.price} className="font-semibold text-gold" /> -{" "}
                <Link
                  href="/bundle"
                  className="font-medium text-gold underline underline-offset-4 hover:text-white"
                >
                  Build your bundle
                </Link>
              </p>
            ) : null}

            {/* Product Order Controls: Quantity Stepper, Order now (green), and Add to cart (outlined) */}
            <ProductOrderControls
              productId={product.id}
              title={product.title}
              sizeMl={product.size_ml}
              slug={product.slug}
              price={product.price}
              whatsappNumber={number}
              siteUrl={siteUrl}
            />

            {/* Notes Pyramid (Top, Heart, Base) */}
            {hasNotes ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-ink-2/60 p-5 sm:p-6">
                <h2 className="font-serif text-lg font-medium text-bone">
                  Olfactory Pyramid
                </h2>
                <div className="mt-4 space-y-4">
                  {product.notes_top.length > 0 ? (
                    <div>
                      <span className="text-xs uppercase tracking-wider text-mute">
                        Top Notes
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {product.notes_top.map((note) => (
                          <span
                            key={note}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-bone"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {product.notes_heart.length > 0 ? (
                    <div>
                      <span className="text-xs uppercase tracking-wider text-mute">
                        Heart Notes
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {product.notes_heart.map((note) => (
                          <span
                            key={note}
                            className="rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs text-gold"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {product.notes_base.length > 0 ? (
                    <div>
                      <span className="text-xs uppercase tracking-wider text-mute">
                        Base Notes
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {product.notes_base.map((note) => (
                          <span
                            key={note}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-bone"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Description */}
            {product.description || product.short_description ? (
              <div className="mt-8 border-t border-white/10 pt-6">
                <h2 className="font-serif text-lg font-medium text-bone">
                  About this Fragrance
                </h2>
                <div className="prose prose-invert mt-3 text-sm leading-relaxed text-mute">
                  <p>{product.description || product.short_description}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Approved Reviews Section for THIS product only */}
        {reviews.length > 0 ? (
          <section className="mt-16 border-t border-white/10 pt-12 md:mt-24 md:pt-16">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-wider text-gold">
                Customer Feedback
              </span>
              <h2 className="mt-1 font-serif text-2xl font-medium text-bone sm:text-3xl">
                Reviews for {product.title}
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-white/10 bg-ink-2/70 p-5"
                >
                  <div className="flex items-center gap-1 text-gold">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <span key={i} aria-hidden="true">
                        ★
                      </span>
                    ))}
                  </div>
                  {rev.body ? (
                    <p className="mt-3 text-sm leading-relaxed text-bone/90">
                      &ldquo;{rev.body}&rdquo;
                    </p>
                  ) : null}
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-mute">
                    {rev.author_name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* You May Also Like: up to 4 other active products */}
        {relatedProducts.length > 0 ? (
          <section className="mt-16 border-t border-white/10 pt-12 md:mt-24 md:pt-16">
            <div className="mb-8">
              <span className="text-xs uppercase tracking-wider text-gold">
                RECOMMENDATIONS
              </span>
              <h2 className="mt-1 font-serif text-2xl font-medium text-bone sm:text-3xl">
                You may also like
              </h2>
            </div>

            <div className="grid grid-cols-2 min-w-0 max-w-full gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
              {relatedProducts.map((relProduct) => (
                <div key={relProduct.slug || relProduct.id} className="flex min-w-0">
                  <ProductCard
                    product={relProduct}
                    whatsappNumber={number}
                    siteUrl={siteUrl}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      {/* From the journal placement for this product */}
      <JournalPlacement placement={`product:${product.slug}`} />

      {/* Mobile Sticky Order Bar */}
      <ProductStickyBar
        productId={product.id}
        title={product.title}
        price={product.price}
        orderUrl={orderUrl}
        whatsappNumber={number}
      />
    </div>
  );
}
