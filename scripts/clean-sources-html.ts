/**
 * Clean Sources sections from database content (HTML format)
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

async function cleanSourcesFromDatabase() {
  console.log("Fetching all published topic translations...");

  const topicsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/topics?select=id,slug&status=eq.published`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!topicsRes.ok) {
    console.error("Failed to fetch topics:", await topicsRes.text());
    process.exit(1);
  }

  const topics = await topicsRes.json();
  console.log(`Found ${topics.length} published topics.`);

  let cleanedCount = 0;
  let errorCount = 0;

  for (const topic of topics) {
    const transRes = await fetch(
      `${SUPABASE_URL}/rest/v1/topic_translations?select=id,content&topic_id=eq.${topic.id}&language_code=eq.en`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!transRes.ok) {
      console.error(`Failed to fetch translations for ${topic.slug}`);
      continue;
    }

    const translations = await transRes.json();

    for (const translation of translations) {
      if (!translation.content) continue;

      const originalContent = translation.content;

      // Remove Sources section in HTML format
      // Matches: <h2 id="sources">Sources</h2>...<ol class="citation-list">...</ol>
      const cleanedContent = translation.content
        .replace(/<h2[^>]*id=["']sources["'][^>]*>Sources<\/h2>[\s\S]*?<\/article>/gi, "</article>")
        .replace(/<h2[^>]*>Sources<\/h2>[\s\S]*?<\/article>/gi, "</article>")
        .replace(/<h3[^>]*>Sources<\/h3>[\s\S]*?<\/article>/gi, "</article>");

      if (cleanedContent !== originalContent) {
        console.log(`Cleaning Sources from: ${topic.slug}`);

        const updateRes = await fetch(
          `${SUPABASE_URL}/rest/v1/topic_translations?id=eq.${translation.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: cleanedContent }),
          }
        );

        if (!updateRes.ok) {
          console.error(`Error cleaning ${topic.slug}:`, await updateRes.text());
          errorCount++;
        } else {
          cleanedCount++;
        }
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Cleaned: ${cleanedCount} translations`);
  console.log(`- Errors: ${errorCount}`);
}

cleanSourcesFromDatabase().catch(console.error);
