import { createAdminClient } from "@/lib/supabase/admin";
import { classifyTopicDomain, type TopicDomain } from "@/services/intelligence/topicDomainClassifier";

export interface ArticleExpansionPlan {
  title: string;
  articleType: "guide" | "explainer" | "comparison" | "tutorial" | "reference" | "review";
  intent: "informational" | "commercial" | "transactional";
  priorityScore: number;
  keyword: string; // the exact keyword the research agent should use
}

// ─── Domain-specific article plans ────────────────────────────────────────────
// Each domain produces articles a learner would actually want to read.
// No generic templates. Every title is specific to the topic.

function plansForTechnology(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 94 },
    { title: `${t} Installation and Setup Guide`, keyword: `How to install ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 90 },
    { title: `${t} Commands Cheat Sheet`, keyword: `${t} commands`, articleType: "reference", intent: "informational", priorityScore: 86 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `Common ${t} Errors and How to Fix Them`, keyword: `${t} errors`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} vs Alternatives: Which Should You Use?`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "informational", priorityScore: 74 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 68 },
  ];
}

function plansForFinanceConcept(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t}: Formula and Calculations Explained`, keyword: `${t} formula calculation`, articleType: "reference", intent: "informational", priorityScore: 89 },
    { title: `${t} Advantages and Disadvantages`, keyword: `${t} pros and cons`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `${t} for Beginners`, keyword: `${t} for beginners`, articleType: "guide", intent: "informational", priorityScore: 80 },
    { title: `${t} vs Other Options`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "informational", priorityScore: 76 },
    { title: `${t} Tax Implications`, keyword: `${t} tax`, articleType: "guide", intent: "informational", priorityScore: 70 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plansForFinanceProduct(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t} Eligibility Requirements`, keyword: `${t} eligibility requirements`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `${t} Fees and Costs Explained`, keyword: `${t} fees costs`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `How to Apply for ${t}`, keyword: `How to apply for ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 80 },
    { title: `${t} vs Similar Products`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "informational", priorityScore: 76 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "informational", priorityScore: 72 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plansForHealthCondition(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Symptoms`, keyword: `${t} symptoms`, articleType: "guide", intent: "informational", priorityScore: 95 },
    { title: `${t} Causes and Risk Factors`, keyword: `${t} causes risk factors`, articleType: "guide", intent: "informational", priorityScore: 91 },
    { title: `How ${t} Is Diagnosed`, keyword: `${t} diagnosis`, articleType: "guide", intent: "informational", priorityScore: 87 },
    { title: `${t} Treatment Options`, keyword: `${t} treatment`, articleType: "guide", intent: "informational", priorityScore: 93 },
    { title: `${t} Complications`, keyword: `${t} complications`, articleType: "guide", intent: "informational", priorityScore: 80 },
    { title: `Living With ${t}`, keyword: `Living with ${t}`, articleType: "guide", intent: "informational", priorityScore: 76 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 68 },
  ];
}

function plansForHealthNutrition(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Health Benefits`, keyword: `${t} health benefits`, articleType: "guide", intent: "informational", priorityScore: 93 },
    { title: `${t} Recommended Daily Amount`, keyword: `${t} daily recommended amount`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `Best Food Sources of ${t}`, keyword: `foods high in ${t}`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `${t} Deficiency: Signs and Symptoms`, keyword: `${t} deficiency symptoms`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} Supplements: What You Need to Know`, keyword: `${t} supplements`, articleType: "guide", intent: "informational", priorityScore: 76 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plansForMovieTv(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `${t}: Complete Guide`, keyword: `${t}`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `${t} Cast and Characters`, keyword: `${t} cast`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `${t} Plot Summary`, keyword: `${t} plot summary`, articleType: "explainer", intent: "informational", priorityScore: 86 },
    { title: `${t} Episodes Guide`, keyword: `${t} episodes`, articleType: "reference", intent: "informational", priorityScore: 82 },
    { title: `Where to Watch ${t}`, keyword: `Where to watch ${t}`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `${t} Review`, keyword: `${t} review`, articleType: "review", intent: "informational", priorityScore: 84 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 68 },
  ];
}

function plansForHistoricalEvent(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `${t}: Overview and Summary`, keyword: `${t} overview`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `Causes of ${t}`, keyword: `causes of ${t}`, articleType: "guide", intent: "informational", priorityScore: 93 },
    { title: `${t} Timeline of Key Events`, keyword: `${t} timeline`, articleType: "reference", intent: "informational", priorityScore: 89 },
    { title: `Key Figures in ${t}`, keyword: `key figures ${t}`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `Consequences of ${t}`, keyword: `consequences of ${t}`, articleType: "guide", intent: "informational", priorityScore: 80 },
    { title: `${t}: Historical Significance`, keyword: `${t} significance`, articleType: "guide", intent: "informational", priorityScore: 75 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plansForProductReview(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `${t}: Complete Review`, keyword: `${t} review`, articleType: "review", intent: "commercial", priorityScore: 98 },
    { title: `${t} Specifications`, keyword: `${t} specifications`, articleType: "reference", intent: "informational", priorityScore: 92 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "commercial", priorityScore: 88 },
    { title: `${t} vs Competitors`, keyword: `${t} vs`, articleType: "comparison", intent: "commercial", priorityScore: 84 },
    { title: `Is ${t} Worth It?`, keyword: `Is ${t} worth buying`, articleType: "guide", intent: "commercial", priorityScore: 80 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plansForEducational(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 92 },
    { title: `${t}: Real-World Examples`, keyword: `${t} examples`, articleType: "guide", intent: "informational", priorityScore: 87 },
    { title: `History of ${t}`, keyword: `History of ${t}`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t}: Pros and Cons`, keyword: `${t} advantages disadvantages`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `Why ${t} Matters`, keyword: `Why ${t} is important`, articleType: "guide", intent: "informational", priorityScore: 74 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plansForPlace(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `${t}: Complete Visitor Guide`, keyword: `${t} visitor guide`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `${t} History and Background`, keyword: `${t} history`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `Top Things to See at ${t}`, keyword: `things to see at ${t}`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `How to Get to ${t}`, keyword: `How to get to ${t}`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `Best Time to Visit ${t}`, keyword: `best time to visit ${t}`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plansForCurrentEvent(clean: string): ArticleExpansionPlan[] {
  const t = clean;
  return [
    { title: `${t}: What You Need to Know`, keyword: `${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Key Facts`, keyword: `${t} key facts`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `${t}: Background and Context`, keyword: `${t} background`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 68 },
  ];
}

export function generateArticleExpansionPlans(topicTitle: string): ArticleExpansionPlan[] {
  const clean = topicTitle.trim();
  const domain = classifyTopicDomain(clean);

  let plans: ArticleExpansionPlan[];
  switch (domain) {
    case "technology":       plans = plansForTechnology(clean); break;
    case "finance_concept":  plans = plansForFinanceConcept(clean); break;
    case "finance_product":  plans = plansForFinanceProduct(clean); break;
    case "health_condition": plans = plansForHealthCondition(clean); break;
    case "health_nutrition": plans = plansForHealthNutrition(clean); break;
    case "movie_tv":         plans = plansForMovieTv(clean); break;
    case "historical_event": plans = plansForHistoricalEvent(clean); break;
    case "product_review":   plans = plansForProductReview(clean); break;
    case "place_travel":     plans = plansForPlace(clean); break;
    case "news_current":     plans = plansForCurrentEvent(clean); break;
    default:                 plans = plansForEducational(clean); break;
  }

  // Deduplicate
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
        keyword: plan.keyword,
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
