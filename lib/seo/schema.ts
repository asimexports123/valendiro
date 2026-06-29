import { BreadcrumbItem } from "@/lib/types";
import { buildUrl } from "@/lib/utils/helpers";
import { SITE_NAME } from "@/lib/constants";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": buildUrl("/#organization"),
    name: SITE_NAME,
    url: buildUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: buildUrl("/logo.png"),
      width: 512,
      height: 512,
    },
    sameAs: [],
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": buildUrl("/#website"),
    url: buildUrl("/"),
    name: SITE_NAME,
    inLanguage: "en",
    publisher: { "@id": buildUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: buildUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebPageSchema({
  title,
  description,
  canonical,
}: {
  title: string;
  description: string;
  canonical: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": buildUrl(`${canonical}#webpage`),
    url: buildUrl(canonical),
    name: title,
    description,
    inLanguage: "en",
    isPartOf: { "@id": buildUrl("/#website") },
    about: { "@id": buildUrl("/#organization") },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildUrl(item.href),
    })),
  };
}

export function buildArticleSchema({
  title,
  description,
  canonical,
  publishedAt,
  modifiedAt,
  image = "/og-image.png",
}: {
  title: string;
  description: string;
  canonical: string;
  publishedAt: string;
  modifiedAt: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": buildUrl(`${canonical}#article`),
    headline: title,
    description,
    image: buildUrl(image),
    datePublished: publishedAt,
    dateModified: modifiedAt,
    url: buildUrl(canonical),
    inLanguage: "en",
    isPartOf: { "@id": buildUrl("/#website") },
    publisher: { "@id": buildUrl("/#organization") },
  };
}

export function buildFAQSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
