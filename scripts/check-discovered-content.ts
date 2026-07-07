/**
 * Check discovered_content table
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkDiscoveredContent() {
  console.log("Checking discovered_content table...");
  
  const { data, error } = await supabase
    .from("discovered_content")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Found ${data.length} articles:`);
    data.forEach((article, i) => {
      console.log(`\nArticle ${i + 1}:`);
      console.log(`  ID: ${article.id}`);
      console.log(`  URL: ${article.url}`);
      console.log(`  Title: ${article.title}`);
      console.log(`  Source Type: ${article.source_type}`);
      console.log(`  Content Full Length: ${(article.content_full || '').length}`);
      console.log(`  Content Summary Length: ${(article.content_summary || '').length}`);
    });
  } else {
    console.log("No discovered content found");
  }
}

checkDiscoveredContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
