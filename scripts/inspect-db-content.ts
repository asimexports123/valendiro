/**
 * Inspect actual content format in database
 */

import { readFileSync } from "fs";
import { resolve } from "path";

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

async function inspectContent() {
  const topicSlug = "cloud-computing-fundamentals";
  
  console.log(`Fetching content for: ${topicSlug}`);

  // Get topic by slug
  const topicRes = await fetch(
    `${SUPABASE_URL}/rest/v1/topics?select=id&slug=eq.${topicSlug}&status=eq.published`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const topics = await topicRes.json();
  if (!topics || topics.length === 0) {
    console.error("Topic not found");
    process.exit(1);
  }

  const topicId = topics[0].id;

  // Get translation content
  const transRes = await fetch(
    `${SUPABASE_URL}/rest/v1/topic_translations?select=content&topic_id=eq.${topicId}&language_code=eq.en`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const translations = await transRes.json();
  if (!translations || translations.length === 0) {
    console.error("Translation not found");
    process.exit(1);
  }

  const content = translations[0].content;
  
  // Show snippet around Sources
  const sourcesIndex = content.indexOf("Sources");
  if (sourcesIndex !== -1) {
    const start = Math.max(0, sourcesIndex - 100);
    const end = Math.min(content.length, sourcesIndex + 500);
    console.log("\nContent around Sources section:");
    console.log(content.substring(start, end));
  } else {
    console.log("\nNo Sources section found in content");
  }
}

inspectContent().catch(console.error);
