# Architecture Document

## High-Level Architecture
- **Frontend Framework**: Next.js 13 with App Router
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Repository**: https://github.com/asimexports123/valendiro.git

## Directory Structure (Preliminary)
```
/app
  /api/admin/              # API routes for admin functions
    /dashboard/dashboard/   # Dashboard API endpoints
    /articles/              # Article management APIs
    /pipeline/              # Pipeline control APIs
  /admin/                   # Admin pages
    /dashboard/             # Admin dashboard
    /articles/              # Articles management
  /(admin)/                 # Parallel admin route (potential duplicate)
/services/                  # Service layer
  /discovery/               # Discovery connectors
  /pipeline/                # Pipeline services
/components/                # React components
  /ui/                      # UI components
  /admin/                   # Admin-specific components
```

## Known API Routes (Preliminary Audit)
- `/api/admin/dashboard/dashboard/stats` - Dashboard statistics
- `/api/admin/dashboard/dashboard/articles` - Articles data
- `/api/admin/dashboard/dashboard/pipeline-status` - Pipeline status
- `/api/admin/dashboard/dashboard/automation/status` - Automation status
- `/api/admin/dashboard/dashboard/automation/toggle` - Toggle automation
- `/api/admin/dashboard/dashboard/pipeline/run` - Run pipeline
- `/api/admin/delete` - Delete operations

## Known Pages
- `/admin/dashboard` - Main admin dashboard
- `/admin/dashboard/articles` - Articles management page
- `/admin` - Admin redirect to dashboard

## Database Tables (To be audited)
- articles
- article_translations
- topics
- knowledge_packages
- content_generation_queue
- rss_sources
- sources
- rendered_outputs

## Pipeline Components (To be audited)
- Discovery system
- Content generation
- Rendering
- Publishing

## Deployment Configuration (To be audited)
- Vercel configuration
- Environment variables
- Cache configuration
- ISR/Revalidate settings

## Next Steps
1. Complete Phase 1 audit to identify canonical pipeline
2. Identify duplicate/legacy components
3. Mark all components as ACTIVE/LEGACY/DEPRECATED

## Last Updated
2026-07-07
