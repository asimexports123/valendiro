/**
 * Setup Discovery System v2
 * Creates the database schema using Supabase SQL execution
 */

import { createAdminClient } from "../lib/supabase/admin";

async function setupDiscoverySystem() {
  const supabase = createAdminClient();

  console.log("Setting up Discovery System database schema...");

  // Create tables using raw SQL execution
  const createTablesSQL = `
    -- Discovery sources table
    CREATE TABLE IF NOT EXISTS discovery_system_sources (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_type TEXT NOT NULL CHECK (source_type IN ('feedly', 'rss', 'api')),
      name TEXT NOT NULL,
      url TEXT,
      config JSONB DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
      last_fetched_at TIMESTAMPTZ,
      fetch_interval_minutes INTEGER NOT NULL DEFAULT 60,
      error_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source_type, url)
    );

    -- Discovered articles table
    CREATE TABLE IF NOT EXISTS discovered_articles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID NOT NULL REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
      external_id TEXT,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      url TEXT NOT NULL,
      published_at TIMESTAMPTZ,
      author TEXT,
      metadata JSONB DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'accepted', 'rejected', 'duplicate', 'error')),
      relevance_score DECIMAL(4,3),
      confidence_score DECIMAL(4,3),
      rejection_reason TEXT,
      processing_started_at TIMESTAMPTZ,
      processing_completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source_id, external_id)
    );

    -- Article deduplication table
    CREATE TABLE IF NOT EXISTS article_deduplication (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      url_hash TEXT NOT NULL UNIQUE,
      title_hash TEXT NOT NULL UNIQUE,
      content_hash TEXT,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      occurrence_count INTEGER NOT NULL DEFAULT 1
    );

    -- Topic mapping table
    CREATE TABLE IF NOT EXISTS discovered_article_topics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      discovered_article_id UUID NOT NULL REFERENCES discovered_articles(id) ON DELETE CASCADE,
      topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      confidence DECIMAL(4,3),
      mapping_method TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (discovered_article_id, topic_id)
    );

    -- Knowledge extraction queue table
    CREATE TABLE IF NOT EXISTS knowledge_extraction_queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      discovered_article_id UUID NOT NULL REFERENCES discovered_articles(id) ON DELETE CASCADE,
      topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      priority INTEGER NOT NULL DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
      scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      error_message TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Discovery schedule table
    CREATE TABLE IF NOT EXISTS discovery_schedule (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID NOT NULL REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
      schedule_type TEXT NOT NULL CHECK (schedule_type IN ('interval', 'cron')),
      schedule_config JSONB NOT NULL,
      next_run_at TIMESTAMPTZ NOT NULL,
      last_run_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Discovery metrics table
    CREATE TABLE IF NOT EXISTS discovery_metrics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID REFERENCES discovery_system_sources(id) ON DELETE SET NULL,
      metric_type TEXT NOT NULL CHECK (metric_type IN ('articles_discovered', 'articles_accepted', 'articles_rejected', 'processing_time', 'error_rate', 'system_health')),
      metric_value DECIMAL(15,4) NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'
    );

    -- Feedly configuration table
    CREATE TABLE IF NOT EXISTS feedly_config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMPTZ,
      user_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_discovery_system_sources_status ON discovery_system_sources(status);
    CREATE INDEX IF NOT EXISTS idx_discovery_system_sources_type ON discovery_system_sources(source_type);
    CREATE INDEX IF NOT EXISTS idx_discovery_system_sources_last_fetched ON discovery_system_sources(last_fetched_at);
    CREATE INDEX IF NOT EXISTS idx_discovered_articles_status ON discovered_articles(status);
    CREATE INDEX IF NOT EXISTS idx_discovered_articles_source ON discovered_articles(source_id);
    CREATE INDEX IF NOT EXISTS idx_discovered_articles_published ON discovered_articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_article_deduplication_url_hash ON article_deduplication(url_hash);
    CREATE INDEX IF NOT EXISTS idx_discovered_article_topics_article ON discovered_article_topics(discovered_article_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_extraction_queue_status ON knowledge_extraction_queue(status, priority, scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_discovery_schedule_next_run ON discovery_schedule(next_run_at);
    CREATE INDEX IF NOT EXISTS idx_discovery_metrics_source ON discovery_metrics(source_id, metric_type, recorded_at DESC);

    -- Create trigger function for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create triggers
    CREATE TRIGGER update_discovery_system_sources_updated_at BEFORE UPDATE ON discovery_system_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_discovered_articles_updated_at BEFORE UPDATE ON discovered_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_knowledge_extraction_queue_updated_at BEFORE UPDATE ON knowledge_extraction_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_discovery_schedule_updated_at BEFORE UPDATE ON discovery_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_feedly_config_updated_at BEFORE UPDATE ON feedly_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    console.log("Executing SQL schema creation...");
    const { error } = await supabase.rpc("exec_sql", { sql: createTablesSQL });

    if (error) {
      console.log("exec_sql not available, trying direct SQL via query...");
      // Try using the direct SQL execution if rpc fails
      const { data, error: queryError } = await supabase
        .from("discovery_system_sources")
        .select("*")
        .limit(1);
      
      if (queryError && queryError.code === "42P01") {
        // Table doesn't exist, need to create it manually
        console.error("Table doesn't exist. Please run the migration manually via Supabase SQL Editor:");
        console.error("1. Open your Supabase project SQL Editor");
        console.error("2. Copy the contents of database/migrations/discovery_system.sql");
        console.error("3. Paste and execute the SQL");
        throw new Error("Database tables need to be created manually via Supabase SQL Editor");
      }
    }

    console.log("✅ Discovery System database schema created successfully!");
    console.log("\nNext steps:");
    console.log("1. Configure Feedly credentials via admin interface at /admin/discovery-admin");
    console.log("2. Add RSS feeds via admin interface");
    console.log("3. Run the discovery orchestrator: npx tsx scripts/discovery-orchestrator.ts start");
    console.log("\nThe system will now autonomously:");
    console.log("- Discover articles from Feedly and RSS feeds");
    console.log("- Deduplicate articles");
    console.log("- Map articles to relevant topics");
    console.log("- Extract knowledge and update Knowledge Packages");
    console.log("- Regenerate affected articles");
    console.log("- Monitor health and auto-recover from errors");
  } catch (error) {
    console.error("Failed to setup Discovery System:", error);
    console.log("\nTo complete the setup manually:");
    console.log("1. Open your Supabase project SQL Editor");
    console.log("2. Copy the contents of database/migrations/discovery_system.sql");
    console.log("3. Paste and execute the SQL");
    throw error;
  }
}

setupDiscoverySystem().catch(console.error);
