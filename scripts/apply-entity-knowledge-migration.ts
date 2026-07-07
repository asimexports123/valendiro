/**
 * Apply entity knowledge system migration directly to database
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function applyMigration() {
  console.log("=" + "=".repeat(79));
  console.log("APPLY ENTITY KNOWLEDGE SYSTEM MIGRATION");
  console.log("=".repeat(80));
  console.log();

  const migrationSQL = `
-- Entity Knowledge Packages Table
CREATE TABLE IF NOT EXISTS entity_knowledge_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  entity_slug TEXT NOT NULL,
  
  -- Knowledge Content
  overview TEXT,
  history TEXT,
  purpose TEXT,
  products TEXT[],
  technologies TEXT[],
  people TEXT[],
  organizations TEXT[],
  locations TEXT[],
  
  -- Timeline
  timeline JSONB DEFAULT '[]'::jsonb,
  major_events JSONB DEFAULT '[]'::jsonb,
  
  -- Relationships
  relationships JSONB DEFAULT '[]'::jsonb,
  
  -- Latest Developments
  latest_news_summary TEXT,
  latest_news_sources JSONB DEFAULT '[]'::jsonb,
  
  -- Frequently Mentioned
  frequently_mentioned_topics TEXT[],
  common_questions JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  knowledge_version INTEGER DEFAULT 1,
  fact_count INTEGER DEFAULT 0,
  source_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_slug)
);

-- Entity Facts Table
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

-- Entity Statistics Table
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

-- Entity Sources Table
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

-- Entity Versions Table
for tracking knowledge evolution
CREATE TABLE IF NOT EXISTS entity_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_package_id UUID NOT NULL REFERENCES entity_knowledge_packages(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb,
  change_reason TEXT,
  previous_version_id UUID REFERENCES entity_versions(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_entity_knowledge_packages_entity_id ON entity_knowledge_packages(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_knowledge_packages_slug ON entity_knowledge_packages(entity_slug);
CREATE INDEX IF NOT EXISTS idx_entity_knowledge_packages_updated ON entity_knowledge_packages(last_updated_at);

CREATE INDEX IF NOT EXISTS idx_entity_facts_package_id ON entity_facts(entity_package_id);
CREATE INDEX IF NOT EXISTS idx_entity_facts_confidence ON entity_facts(confidence);

CREATE INDEX IF NOT EXISTS idx_entity_statistics_package_id ON entity_statistics(entity_package_id);

CREATE INDEX IF NOT EXISTS idx_entity_sources_package_id ON entity_sources(entity_package_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_type ON entity_sources(source_type);

CREATE INDEX IF NOT EXISTS idx_entity_versions_package_id ON entity_versions(entity_package_id);
CREATE INDEX IF NOT EXISTS idx_entity_versions_version ON entity_versions(version);
`;

  console.log("STEP 1: Execute migration SQL");
  console.log("-".repeat(80));

  // Note: This would require executing raw SQL, which Supabase client doesn't support directly
  // For now, we'll verify the tables exist after manual migration
  console.log("Migration SQL prepared. Please execute manually via Supabase SQL Editor or use:");
  console.log("npx supabase db push");
  console.log();
  console.log("For now, checking if tables exist...");
  console.log();

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
        console.log(`✗ ${table}: Does not exist`);
      } else {
        console.log(`✓ ${table}: Exists`);
      }
    } catch (e) {
      console.log(`✗ ${table}: Error checking - ${(e as Error).message}`);
    }
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
