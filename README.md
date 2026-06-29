# Knowledge OS

A database-first, knowledge-graph based operating system for global multilingual knowledge platforms.

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL + Storage)
- Vercel

## Project Structure
- `app/(public)/[lang]` — Public knowledge surface
- `app/(admin)/admin` — Protected admin dashboard
- `app/auth` — Login and Supabase callback
- `app/api` — REST API layer
- `components` — Reusable UI and SEO components
- `lib` — Utilities, auth, SEO helpers, Supabase clients
- `services` — Business logic services
- `database` — Schema, migrations, policies, triggers, seed
- `jobs` — Background job definitions, queue, workers, schedulers
- `docs` — Architecture, database, SEO, and roadmap documentation

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
2. Run the database schema in Supabase SQL Editor:
   - `database/schema/schema.sql`
   - `database/triggers/triggers.sql`
   - `database/policies/rls_policies.sql`
   - `database/seed/seed.sql`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

## Admin Access
- Navigate to `/admin` and sign in with a Supabase user.
- To make a user an admin, update their `role` to `admin` in the `profiles` table.

## Documentation
- `docs/architecture.md` — System architecture
- `docs/database.md` — Schema and setup
- `docs/seo.md` — SEO foundation
- `docs/roadmap.md` — Future phases

## Deploy on Vercel
Push the repository to GitHub and import it into Vercel. Set the environment variables in the Vercel dashboard.
