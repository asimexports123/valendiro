/**
 * Check topic translations by topic ID
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkTranslations() {
  const topicId = "6e0c7adb-be18-4dbc-9c46-86b0e59cf89e";
  
  console.log("Checking translations for topic:", topicId);
  
  const { data: translations, error } = await supabase
    .from("topic_translations")
    .select("*")
    .eq("topic_id", topicId);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (translations && translations.length > 0) {
    console.log(`Found ${translations.length} translations:`);
    translations.forEach((t, i) => {
      console.log(`\nTranslation ${i + 1}:`);
      console.log(`  ID: ${t.id}`);
      console.log(`  Language: ${t.language_code}`);
      console.log(`  Title: ${t.title}`);
      console.log(`  Content Length: ${(t.content || '').length}`);
    });
  } else {
    console.log("No translations found for this topic");
  }
}

checkTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
