/**
 * Remove topics created in the failed seeding run that have no knowledge_package.
 * These are the 16 topics created before the package insert failed.
 */
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const SLUGS = [
  "budgeting-fundamentals","investing-basics","cryptocurrency-fundamentals",
  "effective-study-techniques","online-learning-strategies","career-development-fundamentals",
  "entrepreneurship-fundamentals","marketing-fundamentals","project-management-fundamentals",
  "nutrition-fundamentals","fitness-fundamentals","mental-health-fundamentals",
  "cooking-fundamentals","home-organization-fundamentals","travel-planning-fundamentals",
  "budget-travel-strategies",
];

async function main() {
  for (const slug of SLUGS) {
    const { data: topic } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
    if (!topic) { console.log(`  not found: ${slug}`); continue; }

    // Delete translation first
    await sb.from("topic_translations").delete().eq("topic_id", topic.id);
    // Delete topic
    const { error } = await sb.from("topics").delete().eq("id", topic.id);
    if (error) console.log(`  ❌ ${slug}: ${error.message}`);
    else console.log(`  ✅ deleted: ${slug}`);
  }
}
main().catch(console.error);
