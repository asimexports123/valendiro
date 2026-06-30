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

  // Core evergreen knowledge articles — every topic gets these
  const plans: ArticleExpansionPlan[] = [
    { title: `What Is ${clean}? A Complete Introduction`, articleType: "explainer", intent: "informational", priorityScore: 95 },
    { title: `How ${clean} Works: Step-by-Step Explanation`, articleType: "explainer", intent: "informational", priorityScore: 90 },
    { title: `${clean} for Beginners: Everything You Need to Know`, articleType: "guide", intent: "informational", priorityScore: 85 },
    { title: `Key Concepts in ${clean} Explained`, articleType: "explainer", intent: "informational", priorityScore: 80 },
    { title: `${clean}: Common Mistakes and How to Avoid Them`, articleType: "guide", intent: "informational", priorityScore: 75 },
    { title: `${clean} vs Related Approaches: Key Differences`, articleType: "comparison", intent: "informational", priorityScore: 70 },
    { title: `Frequently Asked Questions About ${clean}`, articleType: "guide", intent: "informational", priorityScore: 65 },
    { title: `Advanced ${clean}: Taking Your Skills Further`, articleType: "guide", intent: "informational", priorityScore: 60 },
  ];

  // Technology-specific articles
  if (lower.includes("programming") || lower.includes("code") || lower.includes("software") ||
      lower.includes("python") || lower.includes("javascript") || lower.includes("api") ||
      lower.includes("algorithm") || lower.includes("framework") || lower.includes("library")) {
    plans.push({ title: `Getting Started with ${clean}: Installation and Setup`, articleType: "tutorial", intent: "informational", priorityScore: 88 });
    plans.push({ title: `${clean} Best Practices Every Developer Should Know`, articleType: "guide", intent: "informational", priorityScore: 83 });
    plans.push({ title: `Debugging Common ${clean} Errors`, articleType: "guide", intent: "informational", priorityScore: 72 });
  }

  // Finance-specific articles
  if (lower.includes("invest") || lower.includes("budget") || lower.includes("saving") ||
      lower.includes("credit") || lower.includes("loan") || lower.includes("tax") ||
      lower.includes("retirement") || lower.includes("fund") || lower.includes("stock")) {
    plans.push({ title: `${clean}: A Practical Guide for Beginners`, articleType: "guide", intent: "informational", priorityScore: 87 });
    plans.push({ title: `How to Get Started with ${clean} Safely`, articleType: "guide", intent: "informational", priorityScore: 82 });
    plans.push({ title: `${clean} Risks and How to Manage Them`, articleType: "guide", intent: "informational", priorityScore: 74 });
  }

  // Health-specific articles
  if (lower.includes("health") || lower.includes("fitness") || lower.includes("nutrition") ||
      lower.includes("mental") || lower.includes("diet") || lower.includes("exercise") ||
      lower.includes("sleep") || lower.includes("supplement") || lower.includes("vitamin")) {
    plans.push({ title: `${clean}: Benefits, Risks, and What the Research Says`, articleType: "guide", intent: "informational", priorityScore: 86 });
    plans.push({ title: `How to Incorporate ${clean} Into Your Daily Routine`, articleType: "guide", intent: "informational", priorityScore: 79 });
  }

  // Deduplicate by normalized title
  return plans.filter((plan, index, self) =>
    index === self.findIndex((p) => p.title.toLowerCase() === plan.title.toLowerCase())
  );
}

export async function queueArticleExpansionsForTopic(topicId: string, topicTitle: string, languageCode = "en") {
  const supabase = createAdminClient();
  const plans = generateArticleExpansionPlans(topicTitle);
  const created: string[] = [];

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const { error } = await supabase.from("content_generation_queue").insert({
      object_type: "article",
      topic_id: topicId,
      title: plan.title,
      description: `${plan.articleType} article covering "${plan.title}" within the topic "${topicTitle}".`,
      reason: `Planned article ${i + 1} of ${plans.length} for topic "${topicTitle}" - ${plan.articleType} format, ${plan.intent} intent`,
      priority_score: plan.priorityScore,
      status: "pending",
      metadata: {
        article_type: plan.articleType,
        intent: plan.intent,
        source: "topic_expansion",
        plan_position: i + 1,
        plan_total: plans.length,
        parent_topic_title: topicTitle,
        plan_reason: `Addresses a specific knowledge gap within "${topicTitle}". Type: ${plan.articleType}. Intent: ${plan.intent}. Priority: ${plan.priorityScore}.`,
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
