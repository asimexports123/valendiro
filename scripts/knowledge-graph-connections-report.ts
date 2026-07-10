import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "@/lib/supabase/admin";
import { getTopicBySlug } from "@/services/public/publicData";
import { getConnectedTopics } from "@/services/knowledge/connectedTopics";
import { isUsefulTopicLabel } from "@/services/knowledge/navigationTopicFilters";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

async function main() {
  const sb = createAdminClient();
  const report: Array<Record<string, unknown>> = [];

  for (const slug of SLUGS) {
    const topic = await getTopicBySlug(slug);
    if (!topic) continue;

    const { data: packageRow } = await sb
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const packageId = packageRow?.id ?? null;
    const { data: factRows } = packageId
      ? await sb.from("knowledge_facts").select("tags").eq("package_id", packageId)
      : { data: [] as Array<{ tags: string[] | null }> };

    const rawTags = uniq(
      (factRows ?? []).flatMap((row) => (row.tags ?? []).filter((t): t is string => typeof t === "string"))
    );
    const rejected = rawTags.filter((tag) => !isUsefulTopicLabel(tag, tag));

    const connected = await getConnectedTopics(topic.id, slug, topic.title, topic.category_id, topic.subcategory_id, 6);
    const connections = connected.map((item) => ({
      title: item.title,
      slug: item.slug,
      connection: item.connection,
      useful: isUsefulTopicLabel(item.title, item.slug),
    }));

    report.push({
      slug,
      title: topic.title,
      connectionsShown: connections,
      rejectedMeaninglessKeywords: rejected.slice(0, 20),
      usefulPageCheck: connections.every((c) => c.useful),
      whySelected: connections.map((c) => `${c.title}: ${c.connection}`),
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
