import { Metadata } from "next";
import { SITE_NAME, SITE_URL, DEFAULT_LANGUAGE } from "@/lib/constants";
import { SeoMetadata } from "@/lib/types";
import { buildUrl } from "@/lib/utils/helpers";

interface BuildMetadataOptions {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  noindex?: boolean;
  nofollow?: boolean;
  alternates?: Record<string, string>;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const {
    title,
    description,
    canonical,
    image = "/og-image.png",
    noindex = false,
    nofollow = false,
    alternates,
    structuredData,
    publishedTime,
    modifiedTime,
    author,
    section,
    tags,
  } = options;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: buildUrl(canonical),
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      url: buildUrl(canonical),
      siteName: SITE_NAME,
      locale: DEFAULT_LANGUAGE,
      type: "website",
      images: [{ url: buildUrl(image), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [buildUrl(image)],
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };

  if (structuredData) {
    metadata.other = {
      "application/ld+json": JSON.stringify(structuredData),
    };
  }

  return metadata;
}

export function buildArticleMetadata(options: BuildMetadataOptions & {
  headline: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
}): Metadata {
  const {
    headline,
    authorName,
    datePublished,
    dateModified,
    ...baseOptions
  } = options;

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    author: authorName ? {
      "@type": "Person",
      name: authorName,
    } : {
      "@type": "Organization",
      name: SITE_NAME,
    },
    datePublished,
    dateModified,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return buildMetadata({
    ...baseOptions,
    structuredData: articleStructuredData,
  });
}

export function buildBreadcrumbMetadata(items: Array<{ name: string; url: string }>): Metadata {
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildUrl(item.url),
    })),
  };

  return {
    other: {
      "application/ld+json": JSON.stringify(breadcrumbStructuredData),
    },
  };
}

export function seoMetadataToBuildInput(
  seo: SeoMetadata | null,
  fallback: { title: string; description: string; canonical: string; image?: string }
): BuildMetadataOptions {
  return {
    title: seo?.meta_title || fallback.title,
    description: seo?.meta_description || fallback.description,
    canonical: seo?.canonical_url || fallback.canonical,
    image: seo?.og_image_url || fallback.image || "/og-image.png",
    noindex: seo?.noindex || false,
    nofollow: seo?.nofollow || false,
    structuredData: seo?.structured_data || undefined,
  };
}
