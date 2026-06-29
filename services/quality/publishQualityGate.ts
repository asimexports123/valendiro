import { createClient } from "@/lib/supabase/server";

export interface QualityGateInput {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  objectId?: string | null;
}

export interface QualityGateResult {
  passed: boolean;
  score: number;
  checks: {
    humanization: boolean;
    duplicate: boolean;
    seoComplete: boolean;
    internalLinks: boolean;
    metadata: boolean;
  };
  reasons: string[];
}

function detectRoboticPatterns(content: string): boolean {
  const roboticPhrases = [
    "in conclusion",
    "it is important to note",
    "as mentioned above",
    "furthermore",
    "moreover",
    "in this article we will",
    "this guide will explore",
  ];
  const lower = content.toLowerCase();
  return roboticPhrases.some((phrase) => lower.includes(phrase));
}

function hasSentenceVariety(content: string): boolean {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length < 3) return false;
  const starters = new Set(sentences.map((s) => s.trim().charAt(0).toLowerCase()));
  return starters.size >= 2;
}

export async function runPublishQualityGate(input: QualityGateInput): Promise<QualityGateResult> {
  const supabase = await createClient();
  const reasons: string[] = [];
  const checks = {
    humanization: true,
    duplicate: true,
    seoComplete: true,
    internalLinks: true,
    metadata: true,
  };

  // Humanization check
  if (detectRoboticPatterns(input.content)) {
    checks.humanization = false;
    reasons.push("Content contains robotic transition phrases");
  }
  if (!hasSentenceVariety(input.content)) {
    checks.humanization = false;
    reasons.push("Content lacks sentence variety");
  }

  // Duplicate detection check
  if (input.objectId) {
    const { data: duplicates } = await supabase
      .from("duplicate_content_detections")
      .select("id")
      .eq("source_object_id", input.objectId)
      .eq("status", "blocked")
      .limit(1);
    if (duplicates && duplicates.length > 0) {
      checks.duplicate = false;
      reasons.push("Duplicate content detected and blocked");
    }
  }

  // SEO completeness check
  if (!input.metaTitle || input.metaTitle.length < 10 || input.metaTitle.length > 70) {
    checks.seoComplete = false;
    reasons.push("Meta title missing or invalid length");
  }
  if (!input.metaDescription || input.metaDescription.length < 50 || input.metaDescription.length > 170) {
    checks.seoComplete = false;
    reasons.push("Meta description missing or invalid length");
  }
  if (input.content.length < 300) {
    checks.seoComplete = false;
    reasons.push("Content too short for SEO (< 300 chars)");
  }

  // Metadata check
  if (!input.title || !input.excerpt) {
    checks.metadata = false;
    reasons.push("Title or excerpt missing");
  }

  // Internal links check (at least one internal link or suggestion)
  if (input.objectId) {
    const { count } = await supabase
      .from("internal_links")
      .select("*", { count: "exact", head: true })
      .or(`source_id.eq.${input.objectId},target_id.eq.${input.objectId}`);
    const { count: suggestionCount } = await supabase
      .from("internal_link_suggestions")
      .select("*", { count: "exact", head: true })
      .eq("source_object_id", input.objectId);
    if ((count ?? 0) === 0 && (suggestionCount ?? 0) === 0) {
      checks.internalLinks = false;
      reasons.push("No internal links or suggestions generated");
    }
  }

  const score = Object.values(checks).filter(Boolean).length * 20;
  const passed = score >= 80;

  return { passed, score, checks, reasons };
}

export async function generateBasicInternalLinks(articleId: string, title: string, languageCode = "en") {
  const supabase = await createClient();

  const { data: topics } = await supabase
    .from("topic_translations")
    .select("topic_id, title")
    .eq("language_code", languageCode)
    .ilike("title", `%${title.split(" ").slice(0, 2).join("%")}%`)
    .limit(5);

  if (!topics || topics.length === 0) return;

  for (const topic of topics) {
    await supabase.from("internal_link_suggestions").insert({
      source_object_id: articleId,
      source_object_type: "article",
      target_object_id: topic.topic_id,
      target_object_type: "topic",
      anchor_text: topic.title,
      relevance_score: 50,
      cluster_strength_score: 50,
      status: "pending",
    });
  }
}
