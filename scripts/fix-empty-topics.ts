/**
 * Fix empty/bare topics:
 * 1. Re-render topics that have <100w content
 * 2. For topics with no facts at all, mark status=draft so they're hidden
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { render } = await import("@/services/renderer/orchestrator");

  // Get all translations with word counts
  const { data: trans } = await sb
    .from("topic_translations")
    .select("topic_id, content, title")
    .eq("language_code", "en");

  const { data: topics } = await sb
    .from("topics")
    .select("id, slug, status");

  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, slug, topic_id");

  const pkgByTopicId = new Map((packages ?? []).map((p: any) => [p.topic_id, p]));

  for (const t of (trans ?? [])) {
    const words = t.content?.split(/\s+/).filter(Boolean).length ?? 0;
    if (words >= 100) continue;

    const topic = (topics ?? []).find((tp: any) => tp.id === t.topic_id);
    if (!topic) continue;

    const pkg = pkgByTopicId.get(t.topic_id);
    if (!pkg) {
      // No package — hide the topic
      console.log(`  Hiding (no package): ${topic.slug}`);
      await sb.from("topics").update({ status: "draft" }).eq("id", t.topic_id);
      continue;
    }

    // Re-render
    process.stdout.write(`  Re-rendering: ${topic.slug} ... `);
    try {
      const result = await render({
        packageId: pkg.id,
        format: "markdown",
        rendererId: "long-article",
        style: ["intermediate"],
        forceRerender: true,
      });
      const newWords = result.content.split(/\s+/).filter(Boolean).length;

      if (newWords < 50) {
        // Still too bare — hide the topic from public
        console.log(`still bare (${newWords}w) → hiding`);
        await sb.from("topics").update({ status: "draft" }).eq("id", t.topic_id);
      } else {
        // Publish rendered content
        await sb.from("topic_translations")
          .update({ content: result.content })
          .eq("topic_id", t.topic_id)
          .eq("language_code", "en");
        console.log(`✅ ${newWords}w`);
      }
    } catch (e: any) {
      console.log(`❌ ${e.message} → hiding`);
      await sb.from("topics").update({ status: "draft" }).eq("id", t.topic_id);
    }
  }

  // Also hide any topics with no translation at all
  const { data: allTopics } = await sb.from("topics").select("id, slug, status").eq("status", "published");
  const transTopicIds = new Set((trans ?? []).map((t: any) => t.topic_id));
  for (const topic of (allTopics ?? [])) {
    if (!transTopicIds.has(topic.id)) {
      console.log(`  Hiding (no translation): ${topic.slug}`);
      await sb.from("topics").update({ status: "draft" }).eq("id", topic.id);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
