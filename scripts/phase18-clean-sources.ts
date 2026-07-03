/**
 * Phase 18 - Clean Sources sections from topic content
 * 
 * Removes "Sources" sections from topic_translations content
 * to comply with Phase 18 requirement that Sources should not be visible on public pages.
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function cleanSourcesFromContent() {
  console.log("Fetching all published topics...");
  
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (!topics || topics.length === 0) {
    console.log("No published topics found.");
    return;
  }

  console.log(`Found ${topics.length} published topics.`);

  let cleanedCount = 0;
  let errorCount = 0;

  for (const topic of topics) {
    const { data: translations } = await supabase
      .from("topic_translations")
      .select("id, content")
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (!translations || translations.length === 0) continue;

    for (const translation of translations) {
      if (!translation.content) continue;

      const originalContent = translation.content;
      
      // Remove Sources section using regex
      // Matches ## Sources followed by content until the next ## or end of content
      const cleanedContent = translation.content
        .replace(/## Sources\n[\s\S]*?(?=\n##|$)/g, "")
        .replace(/### Sources\n[\s\S]*?(?=\n##|$)/g, "")
        .replace(/#### Sources\n[\s\S]*?(?=\n##|$)/g, "");

      if (cleanedContent !== originalContent) {
        console.log(`Cleaning Sources from: ${topic.slug}`);
        
        const { error } = await supabase
          .from("topic_translations")
          .update({ content: cleanedContent })
          .eq("id", translation.id);

        if (error) {
          console.error(`Error cleaning ${topic.slug}:`, error);
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

cleanSourcesFromContent().catch(console.error);
