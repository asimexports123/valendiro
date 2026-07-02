import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function runSQL(label: string, sql: string) {
  const { error } = await sb.rpc("exec_sql", { sql_string: sql });
  if (error) {
    console.log(`✗ ${label}: ${error.message}`);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

async function main() {
  console.log("=== Running Migration 000014: Hub Slots ===\n");

  // 1. ALTER topics
  await runSQL("ALTER topics ADD entity_type_id", `
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS entity_type_id UUID REFERENCES entity_types(id) ON DELETE SET NULL
  `);

  await runSQL("CREATE INDEX idx_topics_entity_type", `
    CREATE INDEX IF NOT EXISTS idx_topics_entity_type ON topics(entity_type_id)
  `);

  // 2. hub_sections
  await runSQL("CREATE TABLE hub_sections", `
    CREATE TABLE IF NOT EXISTS hub_sections (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      entity_type_section_id UUID REFERENCES entity_type_sections(id) ON DELETE SET NULL,
      slug TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (topic_id, slug)
    )
  `);

  await runSQL("CREATE TABLE hub_section_translations", `
    CREATE TABLE IF NOT EXISTS hub_section_translations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      section_id UUID NOT NULL REFERENCES hub_sections(id) ON DELETE CASCADE,
      language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (section_id, language_code)
    )
  `);

  // 3. hub_slots
  await runSQL("CREATE TABLE hub_slots", `
    CREATE TABLE IF NOT EXISTS hub_slots (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      section_id UUID NOT NULL REFERENCES hub_sections(id) ON DELETE CASCADE,
      topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      entity_type_slot_id UUID REFERENCES entity_type_slots(id) ON DELETE SET NULL,
      slug TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'drafted', 'published')),
      article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (topic_id, slug)
    )
  `);

  await runSQL("CREATE TABLE hub_slot_translations", `
    CREATE TABLE IF NOT EXISTS hub_slot_translations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slot_id UUID NOT NULL REFERENCES hub_slots(id) ON DELETE CASCADE,
      language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (slot_id, language_code)
    )
  `);

  // 4. Indexes
  await runSQL("idx_hub_sections_topic", `CREATE INDEX IF NOT EXISTS idx_hub_sections_topic ON hub_sections(topic_id)`);
  await runSQL("idx_hub_slots_section", `CREATE INDEX IF NOT EXISTS idx_hub_slots_section ON hub_slots(section_id)`);
  await runSQL("idx_hub_slots_topic", `CREATE INDEX IF NOT EXISTS idx_hub_slots_topic ON hub_slots(topic_id)`);
  await runSQL("idx_hub_slots_status", `CREATE INDEX IF NOT EXISTS idx_hub_slots_status ON hub_slots(status)`);
  await runSQL("idx_hub_slots_article", `CREATE INDEX IF NOT EXISTS idx_hub_slots_article ON hub_slots(article_id)`);

  // 5. Triggers
  await runSQL("trigger hub_sections updated_at", `
    DROP TRIGGER IF EXISTS update_hub_sections_updated_at ON hub_sections;
    CREATE TRIGGER update_hub_sections_updated_at BEFORE UPDATE ON hub_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
  await runSQL("trigger hub_section_translations updated_at", `
    DROP TRIGGER IF EXISTS update_hub_section_translations_updated_at ON hub_section_translations;
    CREATE TRIGGER update_hub_section_translations_updated_at BEFORE UPDATE ON hub_section_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
  await runSQL("trigger hub_slots updated_at", `
    DROP TRIGGER IF EXISTS update_hub_slots_updated_at ON hub_slots;
    CREATE TRIGGER update_hub_slots_updated_at BEFORE UPDATE ON hub_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
  await runSQL("trigger hub_slot_translations updated_at", `
    DROP TRIGGER IF EXISTS update_hub_slot_translations_updated_at ON hub_slot_translations;
    CREATE TRIGGER update_hub_slot_translations_updated_at BEFORE UPDATE ON hub_slot_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  console.log("\n=== Migration 000014 Complete ===");
}

main();
