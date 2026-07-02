import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function runSQL(label: string, sql: string) {
  const { error } = await sb.rpc("exec_sql", { sql_string: sql });
  if (error) {
    if (error.message.includes("already exists")) {
      console.log(`  ⊘ ${label} (already exists)`);
      return true;
    }
    console.log(`  ✗ ${label}: ${error.message}`);
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
}

async function main() {
  console.log("=== Running Migration 000015: Discovery Engine ===\n");

  // 1. discovery_sources
  await runSQL("CREATE discovery_sources", `
    CREATE TABLE IF NOT EXISTS discovery_sources (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      adapter_type TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await runSQL("INDEX idx_discovery_sources_adapter", `
    CREATE INDEX IF NOT EXISTS idx_discovery_sources_adapter ON discovery_sources(adapter_type, status)
  `);

  // 2. discovery_runs
  await runSQL("CREATE discovery_runs", `
    CREATE TABLE IF NOT EXISTS discovery_runs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID NOT NULL REFERENCES discovery_sources(id) ON DELETE CASCADE,
      topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      entity_type_id UUID REFERENCES entity_types(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'running',
      slots_analyzed INTEGER NOT NULL DEFAULT 0,
      candidates_found INTEGER NOT NULL DEFAULT 0,
      candidates_accepted INTEGER NOT NULL DEFAULT 0,
      candidates_rejected INTEGER NOT NULL DEFAULT 0,
      candidates_duplicate INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      metadata JSONB
    )
  `);
  await runSQL("INDEX idx_discovery_runs_topic", `CREATE INDEX IF NOT EXISTS idx_discovery_runs_topic ON discovery_runs(topic_id)`);
  await runSQL("INDEX idx_discovery_runs_source", `CREATE INDEX IF NOT EXISTS idx_discovery_runs_source ON discovery_runs(source_id)`);
  await runSQL("INDEX idx_discovery_runs_status", `CREATE INDEX IF NOT EXISTS idx_discovery_runs_status ON discovery_runs(status)`);

  // 3. discovery_candidates
  await runSQL("CREATE discovery_candidates", `
    CREATE TABLE IF NOT EXISTS discovery_candidates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      run_id UUID NOT NULL REFERENCES discovery_runs(id) ON DELETE CASCADE,
      hub_slot_id UUID REFERENCES hub_slots(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      source_url TEXT,
      relevance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
      confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await runSQL("INDEX idx_discovery_candidates_run", `CREATE INDEX IF NOT EXISTS idx_discovery_candidates_run ON discovery_candidates(run_id)`);
  await runSQL("INDEX idx_discovery_candidates_slot", `CREATE INDEX IF NOT EXISTS idx_discovery_candidates_slot ON discovery_candidates(hub_slot_id, status)`);
  await runSQL("INDEX idx_discovery_candidates_status", `CREATE INDEX IF NOT EXISTS idx_discovery_candidates_status ON discovery_candidates(status)`);

  // 4. RLS
  await runSQL("RLS discovery_sources", `ALTER TABLE discovery_sources ENABLE ROW LEVEL SECURITY`);
  await runSQL("RLS discovery_runs", `ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY`);
  await runSQL("RLS discovery_candidates", `ALTER TABLE discovery_candidates ENABLE ROW LEVEL SECURITY`);

  // 5. Policies
  await runSQL("Policy: read discovery_sources", `CREATE POLICY "Admin read discovery sources" ON discovery_sources FOR SELECT USING (true)`);
  await runSQL("Policy: manage discovery_sources", `CREATE POLICY "Admin manage discovery sources" ON discovery_sources FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor())`);
  await runSQL("Policy: read discovery_runs", `CREATE POLICY "Admin read discovery runs" ON discovery_runs FOR SELECT USING (true)`);
  await runSQL("Policy: manage discovery_runs", `CREATE POLICY "Admin manage discovery runs" ON discovery_runs FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor())`);
  await runSQL("Policy: read discovery_candidates", `CREATE POLICY "Admin read discovery candidates" ON discovery_candidates FOR SELECT USING (true)`);
  await runSQL("Policy: manage discovery_candidates", `CREATE POLICY "Admin manage discovery candidates" ON discovery_candidates FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor())`);

  // Reload schema cache
  await sb.rpc("exec_sql", { sql_string: "NOTIFY pgrst, 'reload schema'" });
  console.log("\nSchema cache reloaded. Waiting...");
  await new Promise((r) => setTimeout(r, 5000));

  // Verify
  const { error: e1 } = await sb.from("discovery_sources").select("id").limit(1);
  const { error: e2 } = await sb.from("discovery_runs").select("id").limit(1);
  const { error: e3 } = await sb.from("discovery_candidates").select("id").limit(1);
  console.log("\nVerification:");
  console.log("  discovery_sources:", e1 ? "FAIL: " + e1.message : "✓");
  console.log("  discovery_runs:", e2 ? "FAIL: " + e2.message : "✓");
  console.log("  discovery_candidates:", e3 ? "FAIL: " + e3.message : "✓");
}

main().catch((e) => console.error("FATAL:", e.message));
