/**
 * Audit topic_translations for broken internal links
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Auditing topic_translations for broken internal links");
  console.log("====================================================\n");

  // Get all published topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (!topics) {
    console.log("No topics found");
    return;
  }

  // Get all valid slugs
  const validSlugs = new Set(topics.map(t => t.slug));

  let totalBrokenLinks = 0;

  for (const topic of topics) {
    const { data: translation } = await supabase
      .from("topic_translations")
      .select("content")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .single();

    if (!translation || !translation.content) {
      continue;
    }

    const content = translation.content;
    const brokenLinks: string[] = [];

    // Find internal links (/topics/[slug])
    const linkRegex = /href="\/topics\/([^"]+)"/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const targetSlug = match[1];
      if (!validSlugs.has(targetSlug)) {
        brokenLinks.push(targetSlug);
      }
    }

    if (brokenLinks.length > 0) {
      console.log(`${topic.slug}: ❌ Broken links to: ${brokenLinks.join(", ")}`);
      totalBrokenLinks += brokenLinks.length;
    } else {
      console.log(`${topic.slug}: ✅ No broken links`);
    }
  }

  console.log(`\n====================================================`);
  console.log(`Total broken links found: ${totalBrokenLinks}`);
}

main().catch(console.error);
