import { createAdminClient } from "@/lib/supabase/admin";
import { isPublishable, scoreDemandKeyword } from "./topicQualityEngine";

/** Canonical V1 slugs — only these may produce public subcategories */
const V1_SLUGS = new Set([
  "technology", "personal-finance", "business",
  "education", "health-wellness", "home-lifestyle", "travel",
]);

/** Map noisy/alias category names → canonical V1 slug */
const CATEGORY_ALIAS_MAP: Record<string, string> = {
  // AI variants → Technology
  "ai": "technology",
  "artificial intelligence": "technology",
  "artificial-intelligence": "technology",
  "machine learning": "technology",
  // Finance variants → Personal Finance
  "finance": "personal-finance",
  "financial": "personal-finance",
  "personal finance": "personal-finance",
  // Health variants → Health & Wellness
  "health": "health-wellness",
  "wellness": "health-wellness",
  "health and wellness": "health-wellness",
  // Business variants
  "business and entrepreneurship": "business",
  "entrepreneurship": "business",
  // Education variants
  "education and learning": "education",
  "learning": "education",
  // Travel variants
  "travel and transportation": "travel",
  "transportation": "travel",
  // Home variants
  "home": "home-lifestyle",
  "lifestyle": "home-lifestyle",
  "home and lifestyle": "home-lifestyle",
};

function resolveCategory(rawName: string): string | null {
  const lower = rawName.toLowerCase().trim();
  // Direct alias lookup
  if (CATEGORY_ALIAS_MAP[lower]) return CATEGORY_ALIAS_MAP[lower];
  // Check if it is already a V1 slug
  if (V1_SLUGS.has(lower.replace(/\s+/g, "-"))) return lower.replace(/\s+/g, "-");
  // Partial match — if rawName contains a V1 keyword
  for (const [alias, slug] of Object.entries(CATEGORY_ALIAS_MAP)) {
    if (lower.includes(alias)) return slug;
  }
  return null; // not mappable → skip
}

export interface ClusteringResult {
  clustersCreated: number;
  signalsClustered: number;
  categoriesCreated: number;
  subcategoriesCreated: number;
  errors: string[];
}

function getSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  "about", "above", "after", "again", "against", "all", "and", "any", "because", "before", "being", "below", "between", "both", "but", "can", "could", "did", "does", "doing", "down", "during", "each", "from", "further", "had", "has", "have", "having", "her", "here", "hers", "herself", "him", "himself", "his", "how", "into", "its", "itself", "just", "more", "most", "myself", "nor", "once", "only", "other", "ought", "over", "same", "shan", "should", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "too", "under", "until", "very", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves",
]);

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

const NOISE_PREFIXES = new Set([
  "best", "top", "code", "learn", "learning", "study", "make", "create",
  "buy", "find", "get", "use", "using", "try", "free", "cheap", "easy",
  "simple", "quick", "fast", "new", "good", "great", "cool",
]);

const KNOWLEDGE_SUFFIXES: Record<string, string> = {
  programming: "Programming",
  software: "Software Development",
  hardware: "Computer Hardware",
  arduino: "Arduino & Microcontrollers",
  python: "Python Programming",
  javascript: "JavaScript Development",
  typescript: "TypeScript Development",
  react: "React Development",
  music: "Music",
  guitar: "Guitar",
  piano: "Piano",
  investing: "Investing",
  budgeting: "Budgeting",
  finance: "Personal Finance",
  fitness: "Fitness",
  nutrition: "Nutrition",
  meditation: "Meditation & Mindfulness",
  travel: "Travel",
  cooking: "Cooking",
  marketing: "Marketing",
  startup: "Startups",
  leadership: "Leadership",
};

function toTitleCase(str: string): string {
  const minorWords = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "of", "in", "by", "up", "as", "vs"]);
  return str
    .split(" ")
    .map((w, i) => (i === 0 || !minorWords.has(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(" ");
}

function generateClusterName(keywords: string[], fallback?: string): string {
  // Collect all significant words with frequency
  const words = keywords.flatMap(getSignificantWords);
  const frequency: Record<string, number> = {};
  for (const w of words) frequency[w] = (frequency[w] || 0) + 1;

  // Check for known high-quality domain terms first
  for (const [term, label] of Object.entries(KNOWLEDGE_SUFFIXES)) {
    if (words.includes(term) || keywords.some((k) => k.toLowerCase().includes(term))) {
      return label;
    }
  }

  // Pick top significant words, filtering noise prefixes
  const top = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .filter((w) => !NOISE_PREFIXES.has(w))
    .slice(0, 3);

  if (top.length >= 2) {
    return toTitleCase(top.join(" "));
  }
  if (top.length === 1) {
    return toTitleCase(top[0]);
  }

  // Fallback: clean the seed keyword
  const raw = (fallback || keywords[0] || "").trim().toLowerCase();
  const cleaned = raw
    .replace(/^(best|top|learn|code|how to|get|buy|free|cheap|easy)\s+/i, "")
    .trim();
  return cleaned ? toTitleCase(cleaned) : "General Topic";
}

async function ensureCategory(categoryName: string, languageCode = "en") {
  const supabase = createAdminClient();

  const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 100);

  const { data: existing } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();

  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data: inserted, error } = await supabase
    .from("categories")
    .insert({ slug, sort_order: 0 })
    .select()
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Category insert failed");
  }

  await supabase.from("category_translations").insert({
    category_id: inserted.id,
    language_code: languageCode,
    name: categoryName,
    description: null,
  });

  await supabase.from("demand_auto_categories").insert({
    category_id: inserted.id,
    category_name: categoryName,
    source_count: 1,
  });

  return { id: inserted.id, created: true };
}

async function ensureSubcategory(subcategoryName: string, categoryId: string, languageCode = "en") {
  const supabase = createAdminClient();

  const slug = subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 100);

  const { data: existing } = await supabase
    .from("subcategories")
    .select("id")
    .eq("slug", slug)
    .eq("category_id", categoryId)
    .maybeSingle();

  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data: inserted, error } = await supabase
    .from("subcategories")
    .insert({ slug, category_id: categoryId, sort_order: 0 })
    .select()
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Subcategory insert failed");
  }

  await supabase.from("subcategory_translations").insert({
    subcategory_id: inserted.id,
    language_code: languageCode,
    name: subcategoryName,
    description: null,
  });

  return { id: inserted.id, created: true };
}

export async function clusterDemandSignals(languageCode = "en"): Promise<ClusteringResult> {
  const supabase = createAdminClient();
  const result: ClusteringResult = { clustersCreated: 0, signalsClustered: 0, categoriesCreated: 0, subcategoriesCreated: 0, errors: [] };

  const { data: pendingSignals, error } = await supabase
    .from("demand_signals")
    .select("id, keyword, category, volume_score, trend_score, competition_score, affiliate_potential_score, freshness_score")
    .eq("status", "pending")
    .eq("language_code", languageCode)
    .is("cluster_id", null)
    .order("volume_score", { ascending: false })
    .limit(200);

  if (error || !pendingSignals || pendingSignals.length === 0) {
    return result;
  }

  const signals = pendingSignals as {
    id: string;
    keyword: string;
    category: string;
    volume_score: number;
    trend_score: number;
    competition_score: number;
    affiliate_potential_score: number;
    freshness_score: number;
  }[];

  const clusters: { seed: typeof signals[0]; members: typeof signals[0][]; category: string }[] = [];
  const similarityThreshold = 0.25;

  for (const signal of signals) {
    const words = getSignificantWords(signal.keyword || "");
    let bestCluster: typeof clusters[0] | null = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const clusterWords = cluster.members.flatMap((m) => getSignificantWords(m.keyword || ""));
      const score = jaccardSimilarity(words, clusterWords);
      if (score > bestScore && score >= similarityThreshold) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.members.push(signal);
    } else {
      clusters.push({ seed: signal, members: [signal], category: signal.category || "General" });
    }
  }

  for (const cluster of clusters) {
    try {
      const rawCategory = cluster.category || "general";
      const v1Slug = resolveCategory(rawCategory);
      if (!v1Slug) {
        // Not mappable to a V1 category — skip, do not pollute public taxonomy
        result.errors.push(`Skipped cluster "${cluster.seed.keyword}": category "${rawCategory}" not in V1 taxonomy`);
        continue;
      }

      // Look up the V1 category row by its canonical slug
      const { data: categoryRow } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", v1Slug)
        .maybeSingle();
      if (!categoryRow) {
        result.errors.push(`V1 category not found in DB: ${v1Slug}`);
        continue;
      }
      const category = { id: categoryRow.id, created: false };

      const keywords = cluster.members.map((m) => m.keyword).filter(Boolean);
      const clusterName = generateClusterName(keywords, cluster.seed.keyword);
      const quality = scoreDemandKeyword(cluster.seed.keyword || clusterName);
      if (!isPublishable(quality)) continue;
      const finalClusterName = quality.knowledgeTopic || clusterName;
      const Subcategory = await ensureSubcategory(finalClusterName, category.id, languageCode);
      if (Subcategory.created) result.subcategoriesCreated++;

      const demandScore = Math.round(
        cluster.members.reduce((sum, m) => sum + m.volume_score + m.trend_score + m.freshness_score, 0) /
          (cluster.members.length * 3)
      );
      const competitionScore = Math.round(
        cluster.members.reduce((sum, m) => sum + m.competition_score, 0) / cluster.members.length
      );
      const affiliateAvg =
        cluster.members.reduce((sum, m) => sum + m.affiliate_potential_score, 0) / cluster.members.length;
      const opportunityScore = Math.round(
        demandScore * 0.35 + affiliateAvg * 0.2 + (100 - competitionScore) * 0.15 + quality.qualityScore * 0.3
      );

      const { data: inserted, error: insertError } = await supabase
        .from("demand_topic_clusters")
        .insert({
          cluster_name: finalClusterName,
          category: v1Slug,
          subcategory_id: Subcategory.id,
          seed_keyword: cluster.seed.keyword || finalClusterName,
          keywords,
          demand_score: demandScore,
          competition_score: competitionScore,
          opportunity_score: opportunityScore,
          status: "pending",
          metadata: { category_id: category.id, subcategory_id: Subcategory.id, quality: quality },
        })
        .select()
        .single();

      if (insertError || !inserted) {
        result.errors.push(insertError?.message || "Cluster insert failed");
        continue;
      }

      result.clustersCreated++;

      const signalIds = cluster.members.map((m) => m.id);
      const { error: updateError } = await supabase
        .from("demand_signals")
        .update({ cluster_id: inserted.id, status: "processed" })
        .in("id", signalIds);

      if (!updateError) result.signalsClustered += signalIds.length;
      else result.errors.push(updateError.message);
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : "Clustering error");
    }
  }

  return result;
}
