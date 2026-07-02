import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("Dropping and recreating knowledge_relationships with correct schema...\n");

  const sql = `
    DROP TABLE IF EXISTS knowledge_relationships CASCADE;
    CREATE TABLE knowledge_relationships (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id       UUID NOT NULL,
      source_level    TEXT NOT NULL CHECK (source_level IN ('fact', 'package', 'slot', 'topic')),
      target_id       UUID NOT NULL,
      target_level    TEXT NOT NULL CHECK (target_level IN ('fact', 'package', 'slot', 'topic')),
      relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'requires', 'depends_on', 'contradicts', 'extends',
        'replaces', 'related_to', 'part_of', 'causes',
        'prevents', 'precedes', 'specializes', 'generalizes'
      )),
      strength        TEXT NOT NULL DEFAULT 'moderate' CHECK (strength IN ('strong', 'moderate', 'weak')),
      explanation     TEXT,
      bidirectional   BOOLEAN NOT NULL DEFAULT false,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_knowledge_relationships_source ON knowledge_relationships(source_id, source_level);
    CREATE INDEX idx_knowledge_relationships_target ON knowledge_relationships(target_id, target_level);
    CREATE INDEX idx_knowledge_relationships_type ON knowledge_relationships(relationship_type);
    ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow service role full access on knowledge_relationships"
      ON knowledge_relationships FOR ALL USING (true) WITH CHECK (true);
  `;

  const { error } = await sb.rpc("exec_sql", { sql_string: sql });
  if (error) {
    console.error("ERROR:", error.message);
  } else {
    console.log("OK: knowledge_relationships recreated with v3.1 schema");
  }
}

main();
