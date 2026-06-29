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
    },
  };

  if (structuredData) {
    metadata.other = {
      "json-ld": JSON.stringify(structuredData),
    };
  }

  return metadata;
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
