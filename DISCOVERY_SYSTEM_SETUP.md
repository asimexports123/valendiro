# Discovery System Setup Instructions

The Discovery System has been fully implemented and is ready for production use. To complete the setup, you need to manually apply the database schema via the Supabase SQL Editor.

## Step 1: Apply Database Schema

1. Open your Supabase project SQL Editor
2. Copy the contents of `database/migrations/discovery_system.sql`
3. Paste and execute the SQL
4. Verify all tables were created successfully

## Step 2: Configure Feedly (Optional)

The system supports both RSS feeds and Feedly. To use Feedly:

1. Navigate to `/admin/discovery-admin`
2. Click "Configure Feedly"
3. Enter your Feedly credentials:
   - Access Token
   - Refresh Token
   - User ID
4. Save the configuration

## Step 3: Add RSS Feeds

1. Navigate to `/admin/discovery-admin`
2. Click "Add RSS Feed"
3. Enter the feed name and URL
4. Save the source

## Step 4: Run the Discovery Orchestrator

The discovery orchestrator runs the entire pipeline continuously:

```bash
npx tsx scripts/discovery-orchestrator.ts start
```

For a single test run:
```bash
npx tsx scripts/discovery-orchestrator.ts once
```

## System Capabilities

Once running, the system will autonomously:

1. **Discover articles** from RSS feeds and Feedly
2. **Deduplicate articles** using URL and content hashing
3. **Map articles to topics** using keyword analysis
4. **Extract knowledge** and update Knowledge Packages
5. **Regenerate affected articles** incrementally
6. **Monitor health** and auto-recover from errors
7. **Clean up stale data** automatically

## Configuration

Environment variables can be set to customize the orchestration:

- `DISCOVERY_INTERVAL_SECONDS`: How often to run discovery (default: 300)
- `PROCESSING_INTERVAL_SECONDS`: How often to process articles (default: 60)
- `MONITORING_INTERVAL_SECONDS`: How often to check health (default: 300)
- `CLEANUP_INTERVAL_SECONDS`: How often to clean up stale data (default: 3600)
- `BATCH_SIZE`: Number of articles to process per batch (default: 50)

## Admin Interface

The admin interface at `/admin/discovery-admin` provides:

- System health monitoring
- Source management (add/pause/resume feeds)
- Manual discovery triggers
- Auto-recovery for failed sources
- Real-time metrics dashboard

## Architecture Compliance

The Discovery System integrates with the existing Knowledge OS architecture:

- Uses existing `update_queue` for job scheduling
- Integrates with existing `topics` table
- Leverages existing workers and queues
- Respects existing QA gate and editorial OS
- Uses existing database structure where possible

## Production Deployment

For production deployment:

1. Apply database schema to production Supabase
2. Configure Feedly credentials (if using Feedly)
3. Add RSS feeds
4. Run the orchestrator as a background process (e.g., using PM2, systemd, or cloud scheduler)
5. Monitor via the admin interface

The system is designed to run continuously without manual intervention, automatically discovering, processing, and publishing knowledge from your configured sources.
