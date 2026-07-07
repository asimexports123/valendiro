/**
 * Debug discovered content to understand why extraction is failing
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function debugContent() {
  console.log("Debugging discovered content...");

  const { data: content } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("status", "deduplicated")
    .limit(5);

  if (!content || content.length === 0) {
    console.log("No content found");
    return;
  }

  for (const item of content) {
    console.log("\n" + "=".repeat(80));
    console.log(`Title: ${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`Content Summary Length: ${(item.content_summary || '').length}`);
    console.log(`Content Full Length: ${(item.content_full || '').length}`);
    console.log(`Content Summary (first 200 chars): ${(item.content_summary || '').substring(0, 200)}`);
    console.log(`Content Full (first 200 chars): ${(item.content_full || '').substring(0, 200)}`);
    console.log("=".repeat(80));
  }
}

debugContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
