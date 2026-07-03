/**
 * Check topic_translations table
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Topic Translations Check");
  console.log("========================\n");

  const { data: translations, error } = await supabase
    .from("topic_translations")
    .select("topic_id, language_code, title, slug")
    .limit(10);

  if (error) {
    console.log("Error:", error);
    return;
  }

  console.log(`Found ${translations?.length || 0} translations`);
  translations?.forEach(t => {
    console.log(`  ${t.slug}: ${t.title} (${t.language_code})`);
  });
}

main().catch(console.error);
