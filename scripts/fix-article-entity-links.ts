/**
 * Fix article entity links to use correct URL pattern
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function fixArticleEntityLinks() {
  console.log("=" + "=".repeat(79));
  console.log("FIX ARTICLE ENTITY LINKS");
  console.log("=".repeat(80));
  console.log();

  const topicId = "6e0c7adb-be18-4dbc-9c46-86b0e59cf89e";

  // Get the topic content
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("content, html_content")
    .eq("id", topicId)
    .single();

  if (topicError) {
    console.log("Error getting topic:", topicError.message);
    return;
  }

  console.log("STEP 1: FIX ENTITY LINKS IN CONTENT");
  console.log("-".repeat(80));

  // Replace /entity/{slug} with /en/entity/{slug}
  const fixedContent = topic.content.replace(/\/entity\//g, "/en/entity/");
  const fixedHtmlContent = topic.html_content.replace(/\/entity\//g, "/en/entity/");

  console.log("Fixed entity links in content");
  console.log("Fixed entity links in html_content");
  console.log();

  // Update the topic
  const { error: updateError } = await supabase
    .from("topics")
    .update({
      content: fixedContent,
      html_content: fixedHtmlContent,
    })
    .eq("id", topicId);

  if (updateError) {
    console.log("Error updating topic:", updateError.message);
  } else {
    console.log("✓ Topic updated successfully");
  }
}

fixArticleEntityLinks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
