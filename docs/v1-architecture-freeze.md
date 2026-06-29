# Valendiro V1 — Core Architecture Freeze

**Status:** Architecture complete. Code built and deployed. **One manual DB step remains.**

## What was delivered

- Database schema extended to support `Category → Collection → Topic → Article` hierarchy.
- `collections` and `collection_translations` tables.
- New foreign keys: `topics.collection_id`, `articles.topic_id`, `demand_topic_clusters.collection_id`, `demand_topic_queue.collection_id`, `content_generation_queue.topic_id`.
- Internal link object types now include `category` and `collection`.
- TypeScript types updated in `lib/types.ts`.
- Demand pipeline now creates categories and collections before topics.
- Topic expansion engine auto-generates supporting article titles.
- Article publishing now attaches articles to topics and runs a quality gate.
- Hierarchical internal linking engine builds Category ↔ Collection ↔ Topic ↔ Article links.
- Public pages (home, category, collection, topic, article) are fully dynamic from the database.
- Quality gate checks duplicate content, readability, and internal similarity.
- Architecture, pipeline, DB relationship, and end-to-end example documentation added under `docs/v1-*.md`.
- Production build succeeds and is deployed to Vercel.

## Migration workflow

Migrations are stored in `supabase/migrations/`. A GitHub Actions workflow (`.github/workflows/supabase-migrations.yml`) applies them automatically on every push to `main` using the Supabase CLI.

Required repository secrets:
- `SUPABASE_ACCESS_TOKEN` — from Supabase Dashboard → Account → Access Tokens.
- `SUPABASE_PROJECT_REF` — the project reference (e.g., `diwwvkbztvhwouttajha`).

The initial migration was applied manually because the access token was not available in the workspace. Future migrations are fully automated once the secrets are set.

## Architecture Freeze Confirmation

No further structural changes are planned for V1. The platform now autonomously grows along the hierarchy:

```
Demand Signal → Category → Collection → Topic → Articles → Knowledge Graph → Internal Links → Publish
```

Future work will extend V1 (more demand sources, better templates, multilingual expansion) without changing this core architecture.
