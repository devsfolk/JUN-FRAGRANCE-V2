import React from "react";

/**
 * Escapes characters that could terminate or break <script> tags when embedding JSON-LD.
 */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(data),
      }}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface OrganizationJsonLdOptions {
  siteUrl: string;
  whatsappNumber?: string | null;
  socialUrls?: string[];
}

export function homeJsonLd({
  siteUrl,
  whatsappNumber,
  socialUrls = [],
}: OrganizationJsonLdOptions) {
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jun.fragrance",
    url: siteUrl,
    areaServed: "PK",
  };

  if (socialUrls.length > 0) {
    organization.sameAs = socialUrls;
  }

  if (whatsappNumber) {
    const formattedPhone = whatsappNumber.startsWith("+")
      ? whatsappNumber
      : `+${whatsappNumber.replace(/\D/g, "")}`;
    organization.contactPoint = {
      "@type": "ContactPoint",
      telephone: formattedPhone,
      contactType: "customer service",
      areaServed: "PK",
    };
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Jun.fragrance",
    url: siteUrl,
  };

  return [organization, website];
}

export interface ProductJsonLdOptions {
  name: string;
  images: string[];
  description: string;
  price: number;
  url: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    body: string | null;
  }>;
}

export function productJsonLd({
  name,
  images,
  description,
  price,
  url,
  reviews = [],
}: ProductJsonLdOptions) {
  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: images,
    description,
    brand: {
      "@type": "Organization",
      name: "Jun.fragrance",
    },
    offers: {
      "@type": "Offer",
      price: price.toString(),
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      url,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  // Add aggregateRating ONLY if real approved reviews with a valid rating exist for that product
  const ratedReviews = reviews.filter(
    (r) => typeof r.rating === "number" && !isNaN(r.rating) && r.rating > 0
  );

  if (ratedReviews.length > 0) {
    const sum = ratedReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / ratedReviews.length).toFixed(1);
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg,
      reviewCount: ratedReviews.length.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  return product;
}
