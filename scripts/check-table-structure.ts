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

async function checkTableStructure() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_relationships?select=*&limit=1`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log("Sample data:");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error("Error:", response.status, await response.text());
  }
}

checkTableStructure();
