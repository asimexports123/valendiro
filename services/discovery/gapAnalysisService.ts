/**
 * Gap Analysis and Automatic Regeneration Trigger Service
 * 
 * Detects missing sections in articles and queues regeneration
 * Part of the autonomous discovery pipeline
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { queueRegeneration } from "../regeneration/contentRegenerationQueue";

const supabase = createAdminClient();

export interface GapAnalysisResult {
  topicId: string;
  nodeId: string | null;
  missingSections: string[];
  missingExamples: boolean;
  missingComparisons: boolean;
  missingFAQs: boolean;
  missingGlossary: boolean;
  missingReferences: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  needsRegeneration: boolean;
}

/**
 * Analyze an article for content gaps
 */
export async function analyzeGaps(topicId: string): Promise<GapAnalysisResult> {
  console.log(`[GapAnalysis] Analyzing gaps for topic: ${topicId}`);

  // Fetch topic content
  const { data: topic, error } = await supabase
    .from("topics")
    .select("*, topic_translations(content, language_code)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .single();

  if (error || !topic) {
    throw new Error(`Topic not found: ${error?.message}`);
  }

  const content = (topic.topic_translations as any)?.[0]?.content || '';
  const contentLower = content.toLowerCase();

  // Check for required sections
  const missingSections: string[] = [];
  const requiredSections = [
    'learning objectives',
    'prerequisites',
    'when to use',
    'when not to use',
    'practical examples',
    'best practices',
    'performance considerations',
    'security considerations',
    'interview questions',
    'cheat sheet',
    'action checklist',
    'glossary',
    'next steps',
  ];

  requiredSections.forEach(section => {
    if (!contentLower.includes(section)) {
      missingSections.push(section);
    }
  });

  // Check for examples
  const missingExamples = !contentLower.includes('example') && !contentLower.includes('code');

  // Check for comparisons
  const missingComparisons = !contentLower.includes('compare') && !contentLower.includes('vs') && !contentLower.includes('versus');

  // Check for FAQs
  const missingFAQs = !contentLower.includes('faq') && !contentLower.includes('frequently asked');

  // Check for glossary
  const missingGlossary = !contentLower.includes('glossary') && !contentLower.includes('definition');

  // Check for references
  const missingReferences = !contentLower.includes('reference') && !contentLower.includes('source') && !contentLower.includes('cite');

  // Calculate severity based on missing items
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const missingCount = missingSections.length + (missingExamples ? 1 : 0) + (missingComparisons ? 1 : 0) + (missingFAQs ? 1 : 0) + (missingGlossary ? 1 : 0) + (missingReferences ? 1 : 0);

  if (missingCount >= 10) severity = 'critical';
  else if (missingCount >= 7) severity = 'high';
  else if (missingCount >= 4) severity = 'medium';

  // Determine if regeneration is needed
  const needsRegeneration = missingCount >= 3;

  // Get or create knowledge graph node
  const nodeId = await getOrCreateNode(topic.slug);

  const result: GapAnalysisResult = {
    topicId,
    nodeId,
    missingSections,
    missingExamples,
    missingComparisons,
    missingFAQs,
    missingGlossary,
    missingReferences,
    severity,
    needsRegeneration,
  };

  // Store gap analysis result
  await storeGapAnalysisResult(result);

  // Queue regeneration if needed
  if (needsRegeneration) {
    console.log(`[GapAnalysis] Queueing regeneration for topic: ${topic.slug}`);
    const jobId = await queueRegeneration(topic.slug, `Gap analysis detected ${missingCount} missing sections`);
    
    // Update gap analysis with regeneration job ID
    await supabase
      .from("gap_analysis_results")
      .update({
        regeneration_job_id: jobId,
      })
      .eq("topic_id", topicId);
  }

  console.log(`[GapAnalysis] Analysis complete. Severity: ${severity}, Missing: ${missingCount}`);
  return result;
}

/**
 * Get or create knowledge graph node for topic
 */
async function getOrCreateNode(topicSlug: string): Promise<string | null> {
  const slug = topicSlug.toLowerCase().replace(/\s+/g, '-');

  const { data: existing } = await supabase
    .from("knowledge_graph_nodes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  return null;
}

/**
 * Store gap analysis result
 */
async function storeGapAnalysisResult(result: GapAnalysisResult): Promise<void> {
  await supabase
    .from("gap_analysis_results")
    .insert({
      topic_id: result.topicId,
      node_id: result.nodeId,
      missing_sections: result.missingSections,
      missing_examples: result.missingExamples,
      missing_comparisons: result.missingComparisons,
      missing_faqs: result.missingFAQs,
      missing_glossary: result.missingGlossary,
      missing_references: result.missingReferences,
      severity: result.severity,
      action_required: result.needsRegeneration,
      analysis_details: {
        missingCount: result.missingSections.length + 
          (result.missingExamples ? 1 : 0) + 
          (result.missingComparisons ? 1 : 0) + 
          (result.missingFAQs ? 1 : 0) + 
          (result.missingGlossary ? 1 : 0) + 
          (result.missingReferences ? 1 : 0),
      },
    });
}

/**
 * Analyze all topics for gaps
 */
export async function analyzeAllTopicGaps(): Promise<{ analyzed: number; regenerationQueued: number }> {
  console.log(`[GapAnalysis] Analyzing all topics for gaps`);

  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug")
    .limit(100);

  if (!topics) {
    return { analyzed: 0, regenerationQueued: 0 };
  }

  let regenerationQueued = 0;

  for (const topic of topics) {
    try {
      const result = await analyzeGaps(topic.id);
      if (result.needsRegeneration) {
        regenerationQueued++;
      }
    } catch (error) {
      console.error(`[GapAnalysis] Failed to analyze topic ${topic.id}:`, error);
    }
  }

  console.log(`[GapAnalysis] Analyzed ${topics.length} topics, queued ${regenerationQueued} regenerations`);
  return { analyzed: topics.length, regenerationQueued };
}
