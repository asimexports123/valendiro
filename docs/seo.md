# Knowledge OS — SEO Foundation

## Metadata System
- `lib/seo/metadata.ts` exports `buildMetadata()` which returns Next.js `Metadata` objects.
- Every public page uses `generateMetadata()` to produce title, description, OpenGraph, Twitter, canonical, and robots directives.
- `seo_metadata` table stores per-language overrides for every content object.

## Sitemap
- `app/api/sitemap/route.ts` returns a dynamic XML sitemap.
- Static routes are pre-defined; dynamic routes will be pulled from the database as content grows.
- Sitemap entries include `hreflang` links for multilingual support.

## Robots
- `app/robots.ts` uses the Next.js metadata API for robots.txt.
- A fallback `public/robots.txt` is also included.
- `/admin`, `/auth`, and `/api/` are disallowed for crawlers.

## Structured Data
- `lib/seo/schema.ts` exports builders for Organization, WebSite, WebPage, Article, BreadcrumbList, and FAQPage schema.
- `components/seo/Breadcrumbs.tsx` renders UI breadcrumbs and injects BreadcrumbList JSON-LD.
- `components/seo/StructuredData.tsx` injects arbitrary JSON-LD.

## Multilingual SEO
- All public routes are prefixed with `[lang]`.
- `next.config.ts` defines default and supported locales.
- `buildHreflangLinks()` generates alternate language links for sitemaps and metadata.
- Canonical URLs are explicit per language.
