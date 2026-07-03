/**
 * Step 2: Find 10 existing rows from production table
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

async function fetchExistingRows() {
  console.log("=== Step 2: Fetching 10 Existing Rows ===\n");
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_relationships?select=*&limit=10`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log("10 EXISTING ROWS:");
    console.log(JSON.stringify(data, null, 2));
    
    // Analyze unique values
    const relationshipTypes = new Set();
    const sourceLevels = new Set();
    const targetLevels = new Set();
    const strengths = new Set();
    
    data.forEach(row => {
      relationshipTypes.add(row.relationship_type);
      sourceLevels.add(row.source_level);
      targetLevels.add(row.target_level);
      strengths.add(row.strength);
    });
    
    console.log("\nUNIQUE VALUES:");
    console.log(`relationship_type: ${Array.from(relationshipTypes).join(", ")}`);
    console.log(`source_level: ${Array.from(sourceLevels).join(", ")}`);
    console.log(`target_level: ${Array.from(targetLevels).join(", ")}`);
    console.log(`strength: ${Array.from(strengths).join(", ")}`);
  } else {
    console.error("Error:", response.status, await response.text());
  }
}

fetchExistingRows().catch(console.error);
