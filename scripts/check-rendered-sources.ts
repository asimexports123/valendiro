/**
 * Check if Sources sections are in rendered_outputs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local file
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRenderedOutputs() {
  console.log("Checking rendered_outputs for Sources sections...");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rendered_outputs?select=content&limit=10&order=updated_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch rendered_outputs:", await res.text());
    process.exit(1);
  }

  const outputs = await res.json();
  console.log(`Found ${outputs.length} rendered outputs.`);

  let withSources = 0;
  for (const output of outputs) {
    if (output.content && output.content.includes("Sources")) {
      withSources++;
      console.log(`Output contains Sources section`);
    }
  }

  console.log(`\nOutputs with Sources: ${withSources}/${outputs.length}`);
}

checkRenderedOutputs().catch(console.error);
