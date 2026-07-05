# Production Deployment Checklist

## Supabase Configuration

### Required Tables
- [ ] topics
- [ ] topic_translations
- [ ] knowledge_packages
- [ ] rendered_outputs
- [ ] publication_logs
- [ ] categories
- [ ] subcategories
- [ ] tags
- [ ] topic_tags
- [ ] citations
- [ ] relationships

### Required Migrations
- [ ] 00000000000000_initial_schema.sql
- [ ] 000018_publication_pipeline.sql
- [ ] All other pending migrations

### RLS (Row Level Security) Status
- [ ] RLS enabled on all tables
- [ ] Service role has full access
- [ ] Anon role has appropriate restrictions
- [ ] Publication policies configured
- [ ] Read-only access for public content

### Required Indexes
- [ ] topics.slug index
- [ ] topic_translations.topic_id index
- [ ] knowledge_packages.slug index
- [ ] rendered_outputs.package_id index
- [ ] rendered_outputs.status index
- [ ] publication_logs.topic_id index
- [ ] citations.topic_id index
- [ ] relationships.source_topic_id index
- [ ] relationships.target_topic_id index

## Vercel Configuration

### Environment Variables
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] VERCEL_ENV
- [ ] VERCEL_URL
- [ ] NEXT_PUBLIC_VERCEL_URL
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_SITE_NAME
- [ ] CACHE_REVALIDATION_SECRET
- [ ] SITEMAP_UPDATE_SECRET
- [ ] PUBLICATION_WEBHOOK_SECRET
- [ ] JOB_CRON_SECRET
- [ ] QUEUE_SECRET

### Build Configuration
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Framework: Next.js

### ISR Configuration
- [ ] revalidate paths configured
- [ ] cache revalidation endpoint: `/api/revalidate`
- [ ] cache tags configured
- [ ] stale-while-revalidate strategy

## Publication Configuration

### Cache Revalidation
- [ ] Cache revalidation endpoint: `/api/revalidate`
- [ ] CACHE_REVALIDATION_SECRET configured
- [ ] On-demand revalidation enabled
- [ ] Time-based revalidation configured

### Sitemap Generation
- [ ] Sitemap endpoint: `/sitemap.xml`
- [ ] Sitemap update secret configured
- [ ] Dynamic sitemap generation
- [ ] Sitemap includes published topics
- [ ] Sitemap includes all language variants

### Job Scheduler
- [ ] Vercel Cron Jobs configured
- [ ] JOB_CRON_SECRET configured
- [ ] Publication job scheduled
- [ ] Cache invalidation job scheduled
- [ ] Sitemap update job scheduled

### Secrets
- [ ] CACHE_REVALIDATION_SECRET
- [ ] SITEMAP_UPDATE_SECRET
- [ ] PUBLICATION_WEBHOOK_SECRET
- [ ] JOB_CRON_SECRET
- [ ] QUEUE_SECRET

## Pre-Deployment Validation

### Database Connectivity
- [ ] Can connect to Supabase using service role key
- [ ] Can connect to Supabase using anon key
- [ ] All tables exist and are accessible
- [ ] All migrations have been applied
- [ ] RLS policies are working correctly

### Application Health
- [ ] Application builds successfully
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All tests pass
- [ ] No console errors in development

### Pipeline Verification
- [ ] Knowledge Package acquisition works
- [ ] Knowledge Authoring Engine works
- [ ] Renderer works
- [ ] Publication Pipeline works
- [ ] Static page generation works

## Post-Deployment Verification

### Live Site Check
- [ ] Production URL accessible
- [ ] Returns HTTP 200 status
- [ ] No console errors
- [ ] No broken links
- [ ] Mobile responsive

### Database Verification
- [ ] New topics appear in database
- [ ] topic_translations populated
- [ ] rendered_outputs created
- [ ] publication_logs generated
- [ ] No database errors

### Publication Verification
- [ ] First page published successfully
- [ ] Cache revalidation works
- [ ] Sitemap updated
- [ ] Internal links functional
- [ ] Metadata present

## Monitoring Setup

### Error Tracking
- [ ] Sentry configured (if used)
- [ ] Error alerts configured
- [ ] Error dashboards set up

### Analytics
- [ ] Google Analytics configured (if used)
- [ ] Analytics tracking verified
- [ ] Custom events tracked

### Performance Monitoring
- [ ] Vercel Analytics enabled
- [ ] Core Web Vitals monitored
- [ ] Performance alerts configured

## Security Verification

### Environment Security
- [ ] All secrets are secure
- [ ] No secrets exposed in client code
- [ ] No secrets in git repository
- [ ] Service role key only used server-side

### API Security
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Authentication working
- [ ] Authorization working

## Documentation

### Deployment Documentation
- [ ] Deployment guide created
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] Runbook created

### API Documentation
- [ ] API endpoints documented
- [ ] Webhook endpoints documented
- [ ] Rate limits documented
- [ ] Error responses documented
