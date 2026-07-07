/**
 * Apply entity knowledge system tables using direct SQL execution
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function applyEntityKnowledgeTables() {
  console.log("=" + "=".repeat(79));
  console.log("APPLY ENTITY KNOWLEDGE TABLES DIRECTLY");
  console.log("=".repeat(80));
  console.log();

  // Use RPC to execute SQL
  const sqlStatements = [
    // Entity Knowledge Packages Table
    `
    CREATE TABLE IF NOT EXISTS entity_knowledge_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
      entity_name TEXT NOT NULL,
      entity_slug TEXT NOT NULL,
      overview TEXT,
      history TEXT,
      purpose TEXT,
      products TEXT[],
      technologies TEXT[],
      people TEXT[],
      organizations TEXT[],
      locations TEXT[],
      timeline JSONB DEFAULT '[]'::jsonb,
      major_events JSONB DEFAULT '[]'::jsonb,
      relationships JSONB DEFAULT '[]'::jsonb,
      latest_news_summary TEXT,
      latest_news_sources JSONB DEFAULT '[]'::jsonb,
      frequently_mentioned_topics TEXT[],
      common_questions JSONB DEFAULT '[]'::jsonb,
      confidence_score DECIMAL(3,2) DEFAULT 0.5,
      knowledge_version INTEGER DEFAULT 1,
      fact_count INTEGER DEFAULT 0,
      source_count INTEGER DEFAULT 0,
      last_updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(entity_slug)
    );
    `,
    // Entity Facts Table
    `
    CREATE TABLE IF NOT EXISTS entity_facts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_package_id UUID NOT NULL REFERENCES entity_knowledge_packages(id) ON DELETE CASCADE,
      fact TEXT NOT NULL,
      source_id UUID,
      confidence DECIMAL(3,2) DEFAULT 0.5,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,
    // Entity Statistics Table
    `
    CREATE TABLE IF NOT EXISTS entity_statistics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_package_id UUID NOT NULL REFERENCES entity_knowledge_packages(id) ON DELETE CASCADE,
      article_count INTEGER DEFAULT 0,
      fact_count INTEGER DEFAULT 0,
      relationship_count INTEGER DEFAULT 0,
      source_count INTEGER DEFAULT 0,
      mention_count INTEGER DEFAULT 0,
      last_crawl TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(entity_package_id)
    );
    `,
    // Entity Sources Table
    `
    CREATE TABLE IF NOT EXISTS entity_sources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_package_id UUID NOT NULL REFERENCES entity_knowledge_packages(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      source_name TEXT,
      source_url TEXT,
      publisher TEXT,
      publication_date DATE,
      trust_score DECIMAL(3,2) DEFAULT 0.5,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,
    // Entity Versions Table
    `
    CREATE TABLE IF NOT EXISTS entity_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_package_id UUID NOT NULL REFERENCES entity_knowledge_packages(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      changes JSONB DEFAULT '{}'::jsonb,
      change_reason TEXT,
      previous_version_id UUID REFERENCES entity_versions(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,
    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_entity_knowledge_packages_entity_id ON entity_knowledge_packages(entity_id);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_knowledge_packages_slug ON entity_knowledge_packages(entity_slug);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_knowledge_packages_updated ON entity_knowledge_packages(last_updated_at);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_facts_package_id ON entity_facts(entity_package_id);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_facts_confidence ON entity_facts(confidence);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_statistics_package_id ON entity_statistics(entity_package_id);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_sources_package_id ON entity_sources(entity_package_id);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_sources_type ON entity_sources(source_type);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_versions_package_id ON entity_versions(entity_package_id);`,
    `CREATE INDEX IF NOT EXISTS idx_entity_versions_version ON entity_versions(version);`,
  ];

  console.log("STEP 1: Create entity knowledge tables");
  console.log("-".repeat(80));

  for (const sql of sqlStatements) {
    try {
      // Note: Supabase client doesn't support direct SQL execution
      // We need to use the RPC function or execute via SQL editor
      console.log("SQL statement prepared (execute via Supabase SQL Editor):");
      console.log(sql.substring(0, 200) + "...");
      console.log();
    } catch (error) {
      console.log("Error:", (error as Error).message);
    }
  }

  console.log();
  console.log("STEP 2: Check if tables exist");
  console.log("-".repeat(80));

  const tables = [
    "entity_knowledge_packages",
    "entity_facts",
    "entity_statistics",
    "entity_sources",
    "entity_versions",
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        console.log(`✗ ${table}: Does not exist or no access`);
      } else {
        console.log(`✓ ${table}: Exists`);
      }
    } catch (e) {
      console.log(`✗ ${table}: Error - ${(e as Error).message}`);
    }
  }

  console.log();
  console.log("To apply the migration, execute the SQL statements in the migration file via:");
  console.log("1. Supabase Dashboard → SQL Editor");
  console.log("2. Or: supabase db push (after fixing migration history)");
}

applyEntityKnowledgeTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
