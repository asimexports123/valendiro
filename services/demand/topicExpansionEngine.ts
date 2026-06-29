import { createAdminClient } from "@/lib/supabase/admin";

export interface ArticleExpansionPlan {
  title: string;
  articleType: "guide" | "explainer" | "comparison" | "tutorial";
  intent: "informational" | "commercial" | "transactional";
  priorityScore: number;
}

export function generateArticleExpansionPlans(topicTitle: string): ArticleExpansionPlan[] {
  const clean = topicTitle.trim();
  const lower = clean.toLowerCase();

  const plans: ArticleExpansionPlan[] = [
    { title: `Best ${clean}`, articleType: "guide", intent: "commercial", priorityScore: 95 },
    { title: `${clean} Buying Guide`, articleType: "guide", intent: "commercial", priorityScore: 90 },
    { title: `What is ${clean}?`, articleType: "explainer", intent: "informational", priorityScore: 85 },
    { title: `Beginner's Guide to ${clean}`, articleType: "guide", intent: "informational", priorityScore: 80 },
    { title: `${clean} FAQ`, articleType: "guide", intent: "informational", priorityScore: 75 },
    { title: `Common ${clean} Mistakes`, articleType: "guide", intent: "informational", priorityScore: 70 },
    { title: `How to Use ${clean}`, articleType: "tutorial", intent: "informational", priorityScore: 65 },
    { title: `${clean} Safety Tips`, articleType: "guide", intent: "informational", priorityScore: 60 },
    { title: `${clean} Maintenance`, articleType: "guide", intent: "informational", priorityScore: 55 },
    { title: `${clean} Troubleshooting`, articleType: "guide", intent: "informational", priorityScore: 50 },
  ];

  if (lower.includes("charger") || lower.includes("tool") || lower.includes("software") || lower.includes("app")) {
    plans.push({ title: `Level 1 vs Level 2 ${clean}`, articleType: "comparison", intent: "commercial", priorityScore: 88 });
    plans.push({ title: `${clean} Installation Guide`, articleType: "tutorial", intent: "informational", priorityScore: 72 });
  }

  if (lower.includes("cost") || lower.includes("price") || lower.includes("buy") || lower.includes("best")) {
    plans.push({ title: `${clean} Cost Breakdown`, articleType: "explainer", intent: "informational", priorityScore: 78 });
  }

  return plans.filter((plan, index, self) => index === self.findIndex((p) => p.title.toLowerCase() === plan.title.toLowerCase()));
}

export async function queueArticleExpansionsForTopic(topicId: string, topicTitle: string, languageCode = "en") {
  const supabase = createAdminClient();
  const plans = generateArticleExpansionPlans(topicTitle);
  const created: string[] = [];

  for (const plan of plans) {
    const { error } = await supabase.from("content_generation_queue").insert({
      object_type: "article",
      topic_id: topicId,
      title: plan.title,
      description: `${plan.title} â€” ${plan.intent} article expanding the topic "${topicTitle}"`,
      reason: `Topic expansion for "${topicTitle}"`,
      priority_score: plan.priorityScore,
      status: "pending",
      metadata: {
        article_type: plan.articleType,
        intent: plan.intent,
        source: "topic_expansion",
      },
    });

    if (!error) {
      created.push(plan.title);
    }
  }

  return { created, count: created.length };
}

export async function expandAllPendingTopics(limit = 10) {
  const supabase = createAdminClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .not(
      "id",
      "in",
      supabase.from("content_generation_queue").select("topic_id").eq("object_type", "article").not("topic_id", "is", null)
    )
    .limit(limit);

  let total = 0;
  for (const topic of topics || []) {
    const title = (topic.topic_translations as { title: string }[] | null)?.[0]?.title || topic.slug;
    const result = await queueArticleExpansionsForTopic(topic.id, title, "en");
    total += result.count;
  }

  return { total };
}
