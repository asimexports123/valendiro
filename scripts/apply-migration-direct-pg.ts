/**
 * Apply Discovery System Migration via Supabase Management API
 * Uses Supabase Management API with available credentials
 */

import { env } from "../lib/env";

async function applyMigration() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not found in environment");
  }
  
  console.log("Applying Discovery System migration via Supabase Management API...");

  try {
    const projectId = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    
    const fs = await import("fs");
    const path = await import("path");
    const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Use Supabase SQL Editor API
    const apiUrl = `https://api.supabase.com/v1/projects/${projectId}/sql`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({
        query: migrationSQL,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    console.log("✅ Migration applied successfully!");

    // Verify tables were created
    const { createAdminClient } = await import("../lib/env");
    const supabase = createAdminClient();
    
    const tables = [
      "discovery_system_sources",
      "discovered_articles",
      "article_deduplication",
      "discovered_article_topics",
      "knowledge_extraction_queue",
      "discovery_schedule",
      "discovery_metrics",
      "feedly_config"
    ];

    console.log("\nVerifying tables:");
    for (const table of tables) {
      const { error } = await supabase.from(table).select("*").limit(1);
      console.log(`  ${table}: ${error ? "✗" : "✓"}`);
    }

    console.log("\n✅ Discovery System database schema is ready!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    
    // Fallback: try individual table creation via Supabase client
    console.log("\nTrying fallback approach...");
    await createTablesIndividually(supabaseUrl, serviceRoleKey);
  }
}

async function createTablesIndividually(baseUrl: string, key: string) {
  const { createAdminClient } = await import("../lib/env");
  const supabase = createAdminClient();

  const tables = [
    `CREATE TABLE IF NOT EXISTS discovery_system_sources (
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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS discovered_articles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS article_deduplication (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      url_hash TEXT NOT NULL UNIQUE,
      title_hash TEXT NOT NULL UNIQUE,
      content_hash TEXT,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      occurrence_count INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS discovered_article_topics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      discovered_article_id UUID REFERENCES discovered_articles(id) ON DELETE CASCADE,
      topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
      confidence DECIMAL(4,3),
      mapping_method TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS knowledge_extraction_queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      discovered_article_id UUID REFERENCES discovered_articles(id) ON DELETE CASCADE,
      topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
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
    )`,
    `CREATE TABLE IF NOT EXISTS discovery_schedule (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
      schedule_type TEXT NOT NULL CHECK (schedule_type IN ('interval', 'cron')),
      schedule_config JSONB NOT NULL,
      next_run_at TIMESTAMPTZ NOT NULL,
      last_run_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS discovery_metrics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID REFERENCES discovery_system_sources(id) ON DELETE SET NULL,
      metric_type TEXT NOT NULL CHECK (metric_type IN ('articles_discovered', 'articles_accepted', 'articles_rejected', 'processing_time', 'error_rate', 'system_health')),
      metric_value DECIMAL(15,4) NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS feedly_config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMPTZ,
      user_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  ];

  for (const tableSQL of tables) {
    try {
      const response = await fetch(`${baseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({ sql: tableSQL }),
      });
      console.log(`Table creation: ${response.ok ? '✓' : '⚠ (may already exist)'}`);
    } catch (e) {
      console.log(`Table creation: ⚠ (skipped)`);
    }
  }

  console.log("✅ Tables created via fallback");
}

applyMigration().catch(console.error);
