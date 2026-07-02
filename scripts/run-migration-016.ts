/**
 * Run migration 000016: Knowledge Package Foundation
 * Creates tables: domain_glossary, knowledge_packages, knowledge_citations,
 *   knowledge_facts, knowledge_evidence, knowledge_provenance, knowledge_relationships
 * Seeds: domain_glossary with 85+ canonical terms
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabase = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function runSQL(sql: string, label: string): Promise<boolean> {
  const { error } = await supabase.rpc("exec_sql", { sql_string: sql });
  if (error) {
    console.error(`  FAIL: ${label}`, error.message);
    return false;
  }
  console.log(`  OK: ${label}`);
  return true;
}

async function main() {
  console.log("=== Migration 000016: Knowledge Package Foundation ===\n");

  // Read full migration file and execute as one block
  const migrationPath = path.join(__dirname, "../database/migrations/000016_knowledge_packages.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  console.log("Running full migration as single block...\n");
  const migOk = await runSQL(migrationSQL, "Full migration 000016");

  if (!migOk) {
    console.log("\nRetrying migration without RLS/policies (tables may already exist)...\n");
    // Tables might already exist from knowledge_relationships. Try creating missing ones individually.
    const createStatements = [
      { label: "domain_glossary", sql: `CREATE TABLE IF NOT EXISTS domain_glossary (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), abbreviation TEXT NOT NULL UNIQUE, canonical_form TEXT NOT NULL, domain TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_domain_glossary_abbrev ON domain_glossary(abbreviation);` },
      { label: "knowledge_packages", sql: `CREATE TABLE IF NOT EXISTS knowledge_packages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), hub_slot_id UUID REFERENCES hub_slots(id) ON DELETE SET NULL, topic_id UUID REFERENCES topics(id) ON DELETE SET NULL, slug TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, knowledge_hash TEXT NOT NULL, source_count INTEGER NOT NULL DEFAULT 0, fact_count INTEGER NOT NULL DEFAULT 0, relationship_count INTEGER NOT NULL DEFAULT 0, discovery_run_ids UUID[] DEFAULT '{}', status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'stale', 'archived')), last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_knowledge_packages_slot ON knowledge_packages(hub_slot_id); CREATE INDEX IF NOT EXISTS idx_knowledge_packages_topic ON knowledge_packages(topic_id); CREATE INDEX IF NOT EXISTS idx_knowledge_packages_status ON knowledge_packages(status); CREATE INDEX IF NOT EXISTS idx_knowledge_packages_slug ON knowledge_packages(slug);` },
      { label: "knowledge_citations", sql: `CREATE TABLE IF NOT EXISTS knowledge_citations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), package_id UUID NOT NULL REFERENCES knowledge_packages(id) ON DELETE CASCADE, source_name TEXT NOT NULL, source_url TEXT, adapter_name TEXT NOT NULL, extraction_method TEXT NOT NULL, source_authority TEXT NOT NULL DEFAULT 'unknown' CHECK (source_authority IN ('official', 'encyclopedic', 'community', 'academic', 'unknown')), retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_knowledge_citations_package ON knowledge_citations(package_id);` },
      { label: "knowledge_facts", sql: `CREATE TABLE IF NOT EXISTS knowledge_facts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), package_id UUID NOT NULL REFERENCES knowledge_packages(id) ON DELETE CASCADE, statement TEXT NOT NULL, fact_type TEXT NOT NULL CHECK (fact_type IN ('definition', 'property', 'rule', 'measurement', 'historical', 'causal', 'procedural', 'warning', 'comparison', 'opinion')), confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('verified', 'high', 'medium', 'low', 'disputed')), domain TEXT, scope TEXT NOT NULL DEFAULT 'contextual' CHECK (scope IN ('universal', 'contextual', 'narrow')), tags TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_knowledge_facts_package ON knowledge_facts(package_id); CREATE INDEX IF NOT EXISTS idx_knowledge_facts_type ON knowledge_facts(fact_type); CREATE INDEX IF NOT EXISTS idx_knowledge_facts_confidence ON knowledge_facts(confidence);` },
      { label: "knowledge_evidence", sql: `CREATE TABLE IF NOT EXISTS knowledge_evidence (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), fact_id UUID NOT NULL REFERENCES knowledge_facts(id) ON DELETE CASCADE, citation_id UUID NOT NULL REFERENCES knowledge_citations(id) ON DELETE CASCADE, excerpt TEXT, retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_knowledge_evidence_fact ON knowledge_evidence(fact_id); CREATE INDEX IF NOT EXISTS idx_knowledge_evidence_citation ON knowledge_evidence(citation_id);` },
      { label: "knowledge_provenance", sql: `CREATE TABLE IF NOT EXISTS knowledge_provenance (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), fact_id UUID NOT NULL REFERENCES knowledge_facts(id) ON DELETE CASCADE, discovery_run_id UUID REFERENCES discovery_runs(id) ON DELETE SET NULL, discovery_candidate_id UUID REFERENCES discovery_candidates(id) ON DELETE SET NULL, adapter_name TEXT NOT NULL, source_slug TEXT NOT NULL, extracted_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_knowledge_provenance_fact ON knowledge_provenance(fact_id); CREATE INDEX IF NOT EXISTS idx_knowledge_provenance_run ON knowledge_provenance(discovery_run_id); CREATE INDEX IF NOT EXISTS idx_knowledge_provenance_candidate ON knowledge_provenance(discovery_candidate_id);` },
      { label: "knowledge_relationships (alter)", sql: `ALTER TABLE knowledge_relationships ADD COLUMN IF NOT EXISTS source_level TEXT; ALTER TABLE knowledge_relationships ADD COLUMN IF NOT EXISTS target_level TEXT; ALTER TABLE knowledge_relationships ADD COLUMN IF NOT EXISTS strength TEXT DEFAULT 'moderate'; ALTER TABLE knowledge_relationships ADD COLUMN IF NOT EXISTS explanation TEXT; ALTER TABLE knowledge_relationships ADD COLUMN IF NOT EXISTS bidirectional BOOLEAN DEFAULT false;` },
    ];

    for (const { label, sql } of createStatements) {
      await runSQL(sql, label);
    }

    // RLS
    const rlsTables = ["domain_glossary", "knowledge_packages", "knowledge_citations", "knowledge_facts", "knowledge_evidence", "knowledge_provenance"];
    for (const t of rlsTables) {
      await runSQL(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY; CREATE POLICY "Allow service role full access on ${t}" ON ${t} FOR ALL USING (true) WITH CHECK (true);`, `RLS: ${t}`);
    }
  }

  // Run seed data
  console.log("\n--- Seeding Domain Glossary ---\n");

  const seedPath = path.join(__dirname, "../database/seeds/domain_glossary_seed.sql");
  const seedSQL = fs.readFileSync(seedPath, "utf-8");
  await runSQL(seedSQL, "domain_glossary seed (85+ entries)");

  // Verify tables exist
  console.log("\n--- Verification ---\n");

  const tables = [
    "domain_glossary",
    "knowledge_packages",
    "knowledge_citations",
    "knowledge_facts",
    "knowledge_evidence",
    "knowledge_provenance",
    "knowledge_relationships",
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  MISSING: ${table} — ${error.message}`);
    } else {
      console.log(`  EXISTS: ${table} (${count} rows)`);
    }
  }

  // Check glossary count
  const { count: glossaryCount } = await supabase
    .from("domain_glossary")
    .select("*", { count: "exact", head: true });

  console.log(`\nDomain Glossary entries: ${glossaryCount}`);
  console.log("\n=== Migration 000016 Complete ===");
}

main().catch(console.error);
