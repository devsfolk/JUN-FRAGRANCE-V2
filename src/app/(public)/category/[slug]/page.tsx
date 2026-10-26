import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { ProductCard } from "@/components/site/ui/product-card";
import {
  getCategoryBySlug,
  getProductsByCategory,
  getActiveCategories,
  getPublicSettings,
} from "@/lib/site/public-data";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export const revalidate = 60;
export const dynamicParams = true;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const categories = await getActiveCategories();
    return categories.map((cat) => ({ slug: cat.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | Jun.fragrance",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const title = category.seo_title?.trim() || `${category.name} Perfumes | Jun.fragrance`;
  const description =
    category.seo_description?.trim() ||
    category.description?.trim() ||
    `Explore ${category.name} fragrances crafted by Jun.fragrance in Pakistan.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/category/${category.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/category/${category.slug}`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      images: category.image_url ? [{ url: category.image_url }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [products, rawSettings] = await Promise.all([
    getProductsByCategory(category.id),
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
          <Link href="/shop" className="transition-colors hover:text-gold">
            Shop
          </Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">{category.name}</span>
        </nav>

        {/* H1 and Category Description */}
        <div className="mb-10 max-w-2xl">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl md:text-5xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">
              {category.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-mute">
              Curated collection of {category.name.toLowerCase()} perfumes in Pakistan.
            </p>
          )}
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {products.map((product, idx) => (
              <div key={product.slug || product.id} className="flex">
                <ProductCard
                  product={product}
                  whatsappNumber={number}
                  siteUrl={siteUrl}
                  priority={idx < 4}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-ink-2/60 p-12 text-center">
            <p className="font-serif text-xl text-bone">No perfumes in this category yet</p>
            <p className="mt-2 text-sm text-mute">
              Check back soon or explore our complete catalog.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center rounded-xl border border-gold/50 bg-gold/10 px-5 py-2.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              Browse all perfumes
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
