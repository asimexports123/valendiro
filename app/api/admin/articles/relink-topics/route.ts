import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();

  // Fetch all articles with null topic_id
  const { data: articles, error } = await admin
    .from("articles")
    .select("id, slug, article_translations(title)")
    .is("topic_id", null)
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch all topics
  const { data: topics } = await admin
    .from("topics")
    .select("id, slug, name");

  if (!topics?.length) return NextResponse.json({ linked: 0, total: articles?.length ?? 0 });

  let linked = 0;
  for (const article of articles ?? []) {
    const title = ((article.article_translations as { title: string }[])?.[0]?.title ?? article.slug)
      .toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const slugText = article.slug.toLowerCase().replace(/[-_]/g, " ");
    const searchText = title + " " + slugText;
    // Score each topic by word overlap
    let bestTopicId: string | null = null;
    let bestScore = 0;

    for (const topic of topics) {
      const topicText = (topic.name + " " + topic.slug)
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/[^a-z0-9 ]/g, "");
      const topicWords = topicText.split(" ").filter((w) => w.length > 3);

      // Count how many topic words appear in article text
      const overlap = topicWords.filter((w) => searchText.includes(w)).length;
      // Also check if article slug contains topic slug
      const slugContains = article.slug.includes(topic.slug.slice(0, 15)) ? 2 : 0;

      const score = overlap + slugContains;
      if (score > bestScore) {
        bestScore = score;
        bestTopicId = topic.id;
      }
    }

    // threshold = 1: at least one meaningful word match
    if (bestTopicId && bestScore >= 1) {
      const { error: updateError } = await admin
        .from("articles")
        .update({ topic_id: bestTopicId })
        .eq("id", article.id);
      if (!updateError) linked++;
    }
  }

  return NextResponse.json({ linked, total: articles?.length ?? 0, message: `Linked ${linked} articles to topics` });
}
