/**
 * Step 1: Inspect production schema of knowledge_relationships table
 * Using direct REST API queries instead of RPC
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

async function querySchema() {
  console.log("=== Step 1: Inspecting Production Schema ===\n");
  
  // Query all columns from knowledge_relationships table
  const columnsResponse = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_relationships?select=*&limit=1`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  if (columnsResponse.ok) {
    const data = await columnsResponse.json();
    console.log("SAMPLE DATA (showing all columns):");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error("Error querying sample data:", columnsResponse.status, await columnsResponse.text());
  }
  
  // Get total count
  const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_relationships?select=count`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "count=exact",
    },
  });
  
  if (countResponse.ok) {
    const count = countResponse.headers.get("content-range");
    console.log(`\nTOTAL ROWS: ${count}`);
  }
}

querySchema().catch(console.error);
