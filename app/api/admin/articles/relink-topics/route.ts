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
    const title = (article.article_translations as { title: string }[])?.[0]?.title ?? article.slug;
    const titleWords = title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter(Boolean);

    // Score each topic by word overlap with article title
    let bestTopicId: string | null = null;
    let bestScore = 0;

    for (const topic of topics) {
      const topicWords = (topic.name + " " + topic.slug)
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .split(/[\s-]+/)
        .filter(Boolean);

      const overlap = titleWords.filter((w) => topicWords.includes(w) && w.length > 3).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestTopicId = topic.id;
      }
    }

    if (bestTopicId && bestScore >= 2) {
      const { error: updateError } = await admin
        .from("articles")
        .update({ topic_id: bestTopicId })
        .eq("id", article.id);
      if (!updateError) linked++;
    }
  }

  return NextResponse.json({ linked, total: articles?.length ?? 0, message: `Linked ${linked} articles to topics` });
}
