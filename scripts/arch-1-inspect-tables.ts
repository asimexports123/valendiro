/**
 * Step 1: Inspect complete production database for navigation-related tables
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectTables() {
  console.log("=== Step 1: Inspecting Production Database Tables ===\n");
  
  // Query information_schema for all tables
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  // Instead, let's query specific tables we know exist
  const candidateTables = [
    "topics",
    "articles",
    "rendered_outputs",
    "knowledge_packages",
    "knowledge_objects",
    "knowledge_relationships",
    "topic_translations",
    "categories",
    "subcategories",
    "internal_links",
    "internal_link_suggestions",
    "demand_topic_queue",
    "demand_topic_clusters",
    "content_generation_queue",
    "content_scores",
    "content_update_queue",
    "content_priority_queue",
  ];
  
  console.log("CANDIDATE TABLES:");
  for (const table of candidateTables) {
    try {
      const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "count=exact",
        },
      });
      
      if (countResponse.ok) {
        const count = countResponse.headers.get("content-range");
        console.log(`  ✓ ${table}: ${count}`);
      } else {
        console.log(`  ✗ ${table}: Error`);
      }
    } catch (e) {
      console.log(`  ✗ ${table}: Not found`);
    }
  }
}

inspectTables().catch(console.error);
