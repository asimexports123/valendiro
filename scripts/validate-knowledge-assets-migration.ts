/**
 * Phase 2 knowledge_assets migration validation.
 * Usage: npx tsx scripts/validate-knowledge-assets-migration.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const REQUIRED_COLUMNS = [
  "id",
  "source_id",
  "external_id",
  "schema_version",
  "asset_kind",
  "payload",
  "labels",
  "provenance",
  "title",
  "content",
  "summary",
  "url",
  "published_at",
  "author",
  "metadata",
  "status",
  "relevance_score",
  "confidence_score",
  "rejection_reason",
  "processing_started_at",
  "processing_completed_at",
  "discovered_at",
  "created_at",
  "updated_at",
];

interface ValidationResult {
  ok: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const result: ValidationResult = { ok: true, checks: [] };

  function record(name: string, ok: boolean, detail: string): void {
    result.checks.push({ name, ok, detail });
    if (!ok) result.ok = false;
    const icon = ok ? "PASS" : "FAIL";
    console.log(`[${icon}] ${name}: ${detail}`);
  }

  // Row-count parity: knowledge_assets table vs discovered_articles view
  const { count: assetCount, error: assetCountError } = await supabase
    .from("knowledge_assets")
    .select("*", { count: "exact", head: true });

  if (assetCountError) {
    record("knowledge_assets table exists", false, assetCountError.message);
  } else {
    record("knowledge_assets table exists", true, `count=${assetCount ?? 0}`);
  }

  const { count: viewCount, error: viewCountError } = await supabase
    .from("discovered_articles")
    .select("*", { count: "exact", head: true });

  if (viewCountError) {
    record("discovered_articles view readable", false, viewCountError.message);
  } else {
    record("discovered_articles view readable", true, `count=${viewCount ?? 0}`);
  }

  if (!assetCountError && !viewCountError) {
    const parity = assetCount === viewCount;
    record(
      "row-count parity",
      parity,
      `knowledge_assets=${assetCount}, discovered_articles view=${viewCount}`
    );
  }

  // Schema field checks via sample row
  const { data: sample, error: sampleError } = await supabase
    .from("knowledge_assets")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (sampleError) {
    record("sample row fetch", false, sampleError.message);
  } else if (!sample) {
    record("sample row fetch", true, "no rows yet (empty table is OK)");
    for (const col of REQUIRED_COLUMNS) {
      record(`column ${col}`, true, "skipped (empty table)");
    }
  } else {
    record("sample row fetch", true, `id=${sample.id}`);
    for (const col of REQUIRED_COLUMNS) {
      const present = Object.prototype.hasOwnProperty.call(sample, col);
      record(`column ${col}`, present, present ? "present" : "missing");
    }

    record(
      "schema_version populated",
      typeof sample.schema_version === "string" && sample.schema_version.length > 0,
      String(sample.schema_version)
    );
    record(
      "asset_kind populated",
      typeof sample.asset_kind === "string" && sample.asset_kind.length > 0,
      String(sample.asset_kind)
    );
    record(
      "provenance is object",
      sample.provenance != null && typeof sample.provenance === "object",
      JSON.stringify(sample.provenance).slice(0, 80)
    );
  }

  // Status distribution sanity
  const { data: statusRows, error: statusError } = await supabase
    .from("knowledge_assets")
    .select("status");

  if (statusError) {
    record("status distribution", false, statusError.message);
  } else {
    const counts = (statusRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
    record("status distribution", true, JSON.stringify(counts));
  }

  console.log("\n--- Summary ---");
  const passed = result.checks.filter((c) => c.ok).length;
  const failed = result.checks.filter((c) => !c.ok).length;
  console.log(`Passed: ${passed}, Failed: ${failed}, Overall: ${result.ok ? "OK" : "FAILED"}`);

  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
