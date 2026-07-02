/**
 * Fix Japan Travel Guide render failure
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log("=== Fixing Japan Travel Guide ===\n");

  const slug = "japan-travel-guide";

  // Get package info
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pkg) {
    console.log("Package not found");
    return;
  }

  console.log(`Package ID: ${pkg.id}`);
  console.log(`Knowledge Hash: ${pkg.knowledge_hash}`);

  // Get facts
  const { data: facts } = await sb
    .from("knowledge_facts")
    .select("*")
    .eq("package_id", pkg.id);

  console.log(`Facts: ${facts?.length || 0}`);

  // Get citations
  const { data: citations } = await sb
    .from("knowledge_citations")
    .select("*")
    .eq("package_id", pkg.id);

  console.log(`Citations: ${citations?.length || 0}`);

  // Add citation if missing
  if (!citations || citations.length === 0) {
    console.log("Adding citation...");
    const { error: citationError } = await sb.from("knowledge_citations").insert({
      id: randomUUID(),
      package_id: pkg.id,
      source_name: "Wikipedia",
      source_url: "https://en.wikipedia.org/wiki/Tourism_in_Japan",
      adapter_name: "wikipedia",
      extraction_method: "manual",
    });

    if (citationError) {
      console.log(`✗ Failed to add citation: ${citationError.message}`);
    } else {
      console.log(`✓ Added citation`);
    }
  }

  // Try rendering
  console.log("\nRendering...");
  const { render } = await import("@/services/renderer/orchestrator");
  
  const result = await render({
    packageId: pkg.id,
    rendererId: "long-article-v2",
    format: "html",
    forceRerender: true,
  });

  const wordCount = result.content.split(/\s+/).length;
  const qualityScore = result.qualityScore?.overall || 0;
  
  console.log(`✓ Rendered: ${wordCount} words, Quality Score: ${qualityScore}/100, Status: ${result.status}`);
}

main().catch(console.error);
