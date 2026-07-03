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

async function testConnection() {
  console.log("Testing Supabase connection...");
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...\n`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/topics?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Data:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testConnection();
