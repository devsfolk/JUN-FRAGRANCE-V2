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
  businessAddress?: string | null;
  businessCity?: string | null;
  businessPhone?: string | null;
  logoUrl?: string | null;
}

export function homeJsonLd({
  siteUrl,
  whatsappNumber,
  socialUrls = [],
  businessAddress,
  businessCity,
  businessPhone,
  logoUrl,
}: OrganizationJsonLdOptions) {
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jun.fragrance",
    alternateName: ["Jun Fragrance", "Jun.fragrance", "junfragrance"],
    url: siteUrl,
    areaServed: "PK",
  };

  if (logoUrl) {
    organization.logo = logoUrl;
  }

  if (socialUrls.length > 0) {
    organization.sameAs = socialUrls;
  }

  const phone = businessPhone || whatsappNumber;
  if (phone) {
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+${phone.replace(/\D/g, "")}`;
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
    alternateName: ["Jun Fragrance", "Jun.fragrance", "junfragrance"],
    url: siteUrl,
  };

  const results: Record<string, unknown>[] = [organization, website];

  // If business_address exists, add a LocalBusiness JSON-LD in addition to Organization
  if (businessAddress && businessAddress.trim()) {
    const localBusiness: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Jun.fragrance",
      url: siteUrl,
      areaServed: "PK",
      address: {
        "@type": "PostalAddress",
        streetAddress: businessAddress.trim(),
        addressLocality: businessCity?.trim() || "Pakistan",
        addressCountry: "PK",
      },
    };
    if (logoUrl) {
      localBusiness.logo = logoUrl;
    }
    if (phone) {
      localBusiness.telephone = phone.startsWith("+")
        ? phone
        : `+${phone.replace(/\D/g, "")}`;
    }
    results.push(localBusiness);
  }

  return results;
}

export interface ProductJsonLdOptions {
  name: string;
  slug: string;
  images: string[];
  description: string;
  price: number;
  url: string;
  sizeMl: number;
  gender: string | null;
  reviews?: Array<{
    author_name: string;
    rating: number;
    body: string | null;
  }>;
}

export function productJsonLd({
  name,
  slug,
  images,
  description,
  price,
  url,
  sizeMl,
  gender,
  reviews = [],
}: ProductJsonLdOptions) {
  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: slug,
    size: `${sizeMl} ml`,
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
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "PK",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
      },
    },
  };

  if (gender === "men" || gender === "women") {
    product.audience = {
      "@type": "PeopleAudience",
      suggestedGender: gender === "men" ? "male" : "female",
    };
  }

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

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageJsonLd(faqs: FaqItem[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export interface ArticleJsonLdOptions {
  headline: string;
  image?: string | null;
  datePublished: string;
  dateModified?: string | null;
  url: string;
  description?: string | null;
}

export function articleJsonLd({
  headline,
  image,
  datePublished,
  dateModified,
  url,
  description,
}: ArticleJsonLdOptions) {
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: {
      "@type": "Organization",
      name: "Jun.fragrance",
    },
    publisher: {
      "@type": "Organization",
      name: "Jun.fragrance",
    },
    datePublished,
    dateModified: dateModified || datePublished,
  };

  if (image) {
    article.image = [image];
  }
  if (description) {
    article.description = description;
  }

  return article;
}
