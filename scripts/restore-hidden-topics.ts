/**
 * Restore topics that were hidden during the fix pass but now have content.
 * Also verify which topics are still draft and should stay hidden.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  // Get all draft topics
  const { data: drafts } = await sb.from("topics").select("id, slug, status").eq("status", "draft");
  console.log(`Draft topics: ${drafts?.length ?? 0}`);

  for (const t of (drafts ?? [])) {
    // Check if translation now has content
    const { data: tr } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", t.id)
      .eq("language_code", "en")
      .single();

    const words = tr?.content?.split(/\s+/).filter(Boolean).length ?? 0;
    if (words >= 100) {
      console.log(`  Restoring: ${t.slug} (${words}w)`);
      await sb.from("topics").update({ status: "published" }).eq("id", t.id);
    } else {
      console.log(`  Keeping hidden: ${t.slug} (${words}w)`);
    }
  }
  console.log("Done.");
}
main().catch(console.error);
