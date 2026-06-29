# Knowledge OS — Architecture

## Overview
Knowledge OS is a **database-first, knowledge-graph based operating system** for building global multilingual knowledge platforms. It is built to scale to 10M+ knowledge objects and 100+ languages without refactoring the core architecture.

## Core Principles
1. **Database-first, not page-first** — Content is modeled as structured entities, not HTML pages.
2. **Knowledge graph, not blog** — Objects are linked by relationships (topics, questions, entities, articles, knowledge objects).
3. **Modular and plugin-based** — Services and workers are independent and can be replaced or extended.
4. **Multilingual from day 1** — Every content object has a base record and per-language translation records.
5. **SEO-first** — Metadata, canonical URLs, hreflang, structured data, and sitemaps are first-class citizens.
6. **API-first** — All content is accessible via API for future AI and SaaS integrations.
7. **Automation-ready** — Background job architecture is designed for AI content generation, translation, SEO, and affiliate optimization.

## Layered Architecture
```
┌─────────────────────────────────────┐
│  Presentation Layer (Next.js App)  │
│  - Public site with [lang] routing   │
│  - Admin dashboard (protected)       │
│  - SEO components & structured data │
├─────────────────────────────────────┤
│  API Layer (Next.js Route Handlers)  │
│  - RESTful v1 endpoints              │
│  - Webhooks for auth callbacks       │
├─────────────────────────────────────┤
│  Services Layer                      │
│  - Business logic isolated from UI   │
│  - One service module per domain     │
├─────────────────────────────────────┤
│  Data Access Layer (Supabase)        │
│  - Server & browser clients          │
│  - RLS policies for security         │
├─────────────────────────────────────┤
│  Database Layer (PostgreSQL)         │
│  - Normalized schema with translations│
│  - Indexes for scale                 │
│  - Triggers for updated_at            │
├─────────────────────────────────────┤
│  Background Jobs Layer               │
│  - Job queue definitions             │
│  - Worker classes                    │
│  - Scheduler entry points            │
└─────────────────────────────────────┘
```

## Route Groups
- `(public)/[lang]` — Public-facing knowledge surface with language prefix.
- `(admin)/admin` — Protected admin dashboard, requires admin role.
- `auth` — Login and Supabase OAuth callback.
- `api` — REST API and dynamic sitemap/robots.

## Scalability Strategy
- Database tables are normalized; translations are vertically partitioned so hot language rows can be cached independently.
- Indexes on `status`, `published_at`, and object/language composite keys support efficient filtering and pagination.
- Trigram indexes enable fast text search without a separate search engine (initially).
- Internal links and affiliate links are stored as relationship tables, allowing graph traversal later.
- The `update_queue` table is the single source of truth for background work, enabling horizontal worker scaling.
