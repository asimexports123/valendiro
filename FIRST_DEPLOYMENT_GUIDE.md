# First Deployment Guide

## 1. Configure Supabase

1. Log into Supabase dashboard
2. Create new project or select existing project
3. Navigate to Settings → API
4. Copy Project URL → Set as `NEXT_PUBLIC_SUPABASE_URL`
5. Copy anon/public key → Set as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Navigate to Settings → Database
7. Generate service role key → Set as `SUPABASE_SERVICE_ROLE_KEY`
8. Run all migrations from `supabase/migrations/` directory
9. Verify all tables exist in Table Editor
10. Enable RLS on all tables
11. Configure RLS policies for production access

## 2. Configure Vercel

1. Log into Vercel dashboard
2. Import project from GitHub repository
3. Configure project settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. Set environment variables in Vercel project settings:
   - Add all variables from `DEPLOYMENT_ENVIRONMENT_MANIFEST.md`
   - Ensure all secrets are properly set
5. Configure deployment branch: `main`
6. Enable production deployment
7. Configure ISR settings if needed

## 3. Run Migrations

1. Connect to Supabase project using SQL Editor
2. Run each migration file from `supabase/migrations/` in order:
   - `00000000000000_initial_schema.sql`
   - `000018_publication_pipeline.sql`
   - All other pending migrations
3. Verify all tables created successfully
4. Verify all indexes created successfully
5. Verify RLS policies applied correctly

## 4. Configure Secrets

1. Generate secure secrets for production:
   - `CACHE_REVALIDATION_SECRET` - Use 32+ character random string
   - `SITEMAP_UPDATE_SECRET` - Use 32+ character random string
   - `PUBLICATION_WEBHOOK_SECRET` - Use 32+ character random string
   - `JOB_CRON_SECRET` - Use 32+ character random string
   - `QUEUE_SECRET` - Use 32+ character random string
2. Add secrets to Vercel environment variables
3. Add secrets to Supabase Edge Functions if needed
4. Verify no secrets are exposed in client code

## 5. Execute Deployment

1. Push to main branch: `git push origin main`
2. Monitor Vercel deployment logs
3. Verify build completes successfully
4. Verify deployment completes without errors
5. Check deployment URL is accessible
6. Run readiness validator: `npx tsx scripts/check-production-readiness.ts`

## 6. Verify Deployment

1. Access production URL
2. Verify HTTP 200 response
3. Check browser console for errors
4. Test navigation between pages
5. Test mobile responsiveness
6. Verify database connectivity:
   - Check topics table has records
   - Check topic_translations table has records
   - Verify no database errors in logs

## 7. Publish First Page

1. Run production acquisition script for JavaScript Fundamentals
2. Verify Knowledge Package created successfully
3. Run Knowledge Authoring Engine
4. Run Renderer
5. Execute Publication Pipeline with dry-run first
6. Execute actual publication
7. Verify page published at live URL
8. Verify sitemap updated
9. Verify cache revalidation triggered
10. Verify page accessible and renders correctly

## Post-Deployment

1. Monitor Vercel analytics
2. Check error tracking (Sentry if configured)
3. Verify database performance
4. Test publication pipeline with additional topics
5. Configure monitoring alerts
6. Set up backup procedures
7. Document any issues encountered
