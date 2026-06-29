# Knowledge OS — Database Schema

## Location
- `database/schema/schema.sql` — full canonical schema
- `database/migrations/000001_initial_schema.sql` — initial migration copy
- `database/policies/rls_policies.sql` — RLS policies
- `database/triggers/triggers.sql` — triggers and functions
- `database/seed/seed.sql` — seed data

## Entity Model
All content types follow the same pattern:
- A base table with language-neutral fields (`slug`, `status`, `canonical_path`, `published_at`).
- A translation table with language-specific fields (`title`, `content`, `meta_title`, `meta_description`).
- Many-to-many links to `categories` and `tags`.

## Content Types
| Type | Base Table | Translation Table |
|------|------------|-------------------|
| Topic | `topics` | `topic_translations` |
| Question | `questions` | `question_translations` |
| Entity | `entities` | `entity_translations` |
| Knowledge Object | `knowledge_objects` | `knowledge_object_translations` |
| Article | `articles` | `article_translations` |
| Category | `categories` | `category_translations` |
| Tag | `tags` | `tag_translations` |
| Source | `sources` | `source_translations` |
| Affiliate Product | `affiliate_products` | `affiliate_product_translations` |

## Supporting Tables
- `profiles` — mirrors Supabase Auth users, adds role.
- `languages` — list of supported languages.
- `internal_links` — explicit links between knowledge objects.
- `affiliate_object_links` — placement of affiliate products in content.
- `seo_metadata` — per-language SEO overrides and structured data.
- `update_queue` — background job queue.
- `performance_metrics` — time-series analytics data.

## Row Level Security
- Public content is readable when `status = 'published'`.
- Admins and editors can manage all content.
- Users can only read their own profile and update it.
- The `update_queue` and affiliate tables are admin-only.

## Setup Instructions
1. Create a Supabase project.
2. Run `database/schema/schema.sql` in the SQL Editor.
3. Run `database/triggers/triggers.sql`.
4. Run `database/policies/rls_policies.sql`.
5. Run `database/seed/seed.sql`.
6. Set environment variables from `.env.example`.
