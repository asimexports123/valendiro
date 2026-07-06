/**
 * Create Discovery System Tables Directly
 * Uses Supabase REST API to execute SQL with available credentials
 */

import { env } from "../lib/env";

async function createTablesDirectly() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not found");
  }
  
  console.log("Creating Discovery System tables directly...");

  const tables = [
    `CREATE TABLE IF NOT EXISTS discovery_system_sources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID,
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
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discovered_article_id UUID,
      topic_id UUID,
      confidence DECIMAL(4,3),
      mapping_method TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS knowledge_extraction_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discovered_article_id UUID,
      topic_id UUID,
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
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID,
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
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID,
      metric_type TEXT NOT NULL CHECK (metric_type IN ('articles_discovered', 'articles_accepted', 'articles_rejected', 'processing_time', 'error_rate', 'system_health')),
      metric_value DECIMAL(15,4) NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS feedly_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMPTZ,
      user_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  ];

  for (let i = 0; i < tables.length; i++) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          query: tables[i],
        }),
      });
      
      console.log(`Table ${i + 1}/${tables.length}: ${response.ok ? '✓' : '⚠'}`);
    } catch (e) {
      console.log(`Table ${i + 1}/${tables.length}: ⚠ (${e instanceof Error ? e.message : String(e)})`);
    }
  }

  console.log("\nVerifying tables...");
  const { createAdminClient } = await import("../lib/env");
  const supabase = createAdminClient();
  
  const tableNames = [
    "discovery_system_sources",
    "discovered_articles",
    "article_deduplication",
    "discovered_article_topics",
    "knowledge_extraction_queue",
    "discovery_schedule",
    "discovery_metrics",
    "feedly_config"
  ];

  for (const table of tableNames) {
    const { error } = await supabase.from(table).select("*").limit(1);
    console.log(`  ${table}: ${error ? "✗" : "✓"}`);
  }
}

createTablesDirectly().catch(console.error);
