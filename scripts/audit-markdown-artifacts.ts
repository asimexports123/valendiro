/**
 * Audit topic_translations for raw Markdown artifacts (#, ##, **)
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Auditing topic_translations for raw Markdown artifacts");
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

  let totalIssues = 0;

  for (const topic of topics) {
    const { data: translation } = await supabase
      .from("topic_translations")
      .select("content")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .single();

    if (!translation || !translation.content) {
      console.log(`${topic.slug}: ❌ No content`);
      continue;
    }

    const content = translation.content;
    const issues: string[] = [];

    // Check for raw Markdown headers (should be HTML tags)
    if (content.match(/^#\s+/m)) issues.push("Raw # headers");
    if (content.match(/^##\s+/m)) issues.push("Raw ## headers");
    if (content.match(/^###\s+/m)) issues.push("Raw ### headers");

    // Check for raw Markdown bold (should be <strong> or <b>)
    if (content.match(/\*\*[^*]+\*\*/g)) issues.push("Raw ** bold");

    // Check for raw Markdown italic (should be <em> or <i>)
    if (content.match(/\*[^*]+\*/g)) issues.push("Raw * italic");

    // Check for raw Markdown links [text](url) (should be <a>)
    if (content.match(/\[[^\]]+\]\([^)]+\)/g)) issues.push("Raw [text](url) links");

    // Check for placeholder content
    const placeholders = [
      "Human-readable topic title",
      "Human-readable description",
      "placeholder",
      "TODO",
      "FIXME"
    ];
    for (const placeholder of placeholders) {
      if (content.toLowerCase().includes(placeholder.toLowerCase())) {
        issues.push(`Placeholder: ${placeholder}`);
      }
    }

    if (issues.length > 0) {
      console.log(`${topic.slug}: ❌ ${issues.join(", ")}`);
      totalIssues += issues.length;
    } else {
      console.log(`${topic.slug}: ✅ No issues`);
    }
  }

  console.log(`\n====================================================`);
  console.log(`Total issues found: ${totalIssues}`);
}

main().catch(console.error);
