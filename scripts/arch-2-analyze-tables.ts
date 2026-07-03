/**
 * Step 2: Analyze candidate tables with detailed information
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

async function analyzeTable(tableName: string) {
  console.log(`\n=== ${tableName.toUpperCase()} ===`);
  
  // Get sample rows
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=3`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log(`Sample rows (${Array.isArray(data) ? data.length : 0}):`);
    console.log(JSON.stringify(data, null, 2));
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`\nColumns: ${Object.keys(data[0]).join(", ")}`);
    }
  } else {
    console.log(`Error: ${response.status}`);
  }
}

async function main() {
  console.log("=== Step 2: Analyzing Candidate Tables ===");
  
  const keyTables = [
    "topics",
    "knowledge_packages",
    "rendered_outputs",
    "knowledge_relationships",
    "internal_links",
    "internal_link_suggestions",
  ];
  
  for (const table of keyTables) {
    await analyzeTable(table);
  }
}

main().catch(console.error);
