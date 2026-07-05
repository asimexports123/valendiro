# Production Environment Variable Manifest

## Supabase Environment Variables

### NEXT_PUBLIC_SUPABASE_URL
- **Required:** Yes
- **Purpose:** Public Supabase project URL for client-side database access
- **Example:** `https://xxxxx.supabase.co`

### SUPABASE_SERVICE_ROLE_KEY
- **Required:** Yes
- **Purpose:** Service role key for server-side database operations with admin privileges
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx`

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Required:** Yes
- **Purpose:** Anonymous key for client-side database access with RLS policies
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyy`

## Vercel Environment Variables

### VERCEL_ENV
- **Required:** Yes (automatically set by Vercel)
- **Purpose:** Current deployment environment (production, preview, development)
- **Example:** `production`

### VERCEL_URL
- **Required:** Yes (automatically set by Vercel)
- **Purpose:** Production deployment URL
- **Example:** `https://valendiro.com`

### NEXT_PUBLIC_VERCEL_URL
- **Required:** Yes
- **Purpose:** Public-facing deployment URL for client-side use
- **Example:** `https://valendiro.com`

## Application Configuration

### NEXT_PUBLIC_APP_URL
- **Required:** Yes
- **Purpose:** Base URL for the application
- **Example:** `https://valendiro.com`

### NEXT_PUBLIC_SITE_NAME
- **Required:** Yes
- **Purpose:** Site name for SEO and metadata
- **Example:** `Valendiro`

### NEXT_PUBLIC_DEFAULT_LANGUAGE
- **Required:** No
- **Purpose:** Default language code
- **Example:** `en`

## Publication Pipeline

### CACHE_REVALIDATION_SECRET
- **Required:** Yes
- **Purpose:** Secret for cache revalidation webhook security
- **Example:** `cache-revalidation-secret-key`

### SITEMAP_UPDATE_SECRET
- **Required:** Yes
- **Purpose:** Secret for sitemap update webhook security
- **Example:** `sitemap-update-secret-key`

### PUBLICATION_WEBHOOK_SECRET
- **Required:** Yes
- **Purpose:** Secret for publication webhook authentication
- **Example:** `publication-webhook-secret-key`

## Job Scheduler

### JOB_CRON_SECRET
- **Required:** Yes
- **Purpose:** Secret for cron job authentication
- **Example:** `job-cron-secret-key`

### QUEUE_SECRET
- **Required:** Yes
- **Purpose:** Secret for job queue authentication
- **Example:** `queue-secret-key`

## Analytics & Monitoring

### NEXT_PUBLIC_GA_ID
- **Required:** No
- **Purpose:** Google Analytics tracking ID
- **Example:** `G-XXXXXXXXXX`

### SENTRY_DSN
- **Required:** No
- **Purpose:** Sentry error tracking DSN
- **Example:** `https://xxxxx@sentry.io/xxxxx`

## Content Delivery

### NEXT_PUBLIC_CDN_URL
- **Required:** No
- **Purpose:** CDN URL for static assets
- **Example:** `https://cdn.valendiro.com`

### NEXT_PUBLIC_IMAGE_DOMAIN
- **Required:** No
- **Purpose:** Allowed image domain for Next.js Image Optimization
- **Example:** `valendiro.com`

## API Configuration

### API_RATE_LIMIT_MAX
- **Required:** No
- **Purpose:** Maximum API requests per window
- **Example:** `100`

### API_RATE_LIMIT_WINDOW
- **Required:** No
- **Purpose:** Rate limit time window in seconds
- **Example:** `60`

## Feature Flags

### ENABLE_ANALYTICS
- **Required:** No
- **Purpose:** Enable analytics tracking
- **Example:** `true`

### ENABLE_ERROR_TRACKING
- **Required:** No
- **Purpose:** Enable error tracking
- **Example:** `true`

### ENABLE_JOB_SCHEDULER
- **Required:** No
- **Purpose:** Enable job scheduler
- **Example:** `true`

## Development Only (Not for Production)

### NODE_ENV
- **Required:** Yes
- **Purpose:** Node environment setting
- **Example:** `production`
