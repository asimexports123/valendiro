/**
 * Evaluates published articles for quality and marks low-quality articles for regeneration
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

interface QualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
}

function evaluateContentQuality(content: string | null): QualityIssue[] {
  const issues: QualityIssue[] = [];
  
  if (!content) {
    issues.push({ type: 'no_content', severity: 'high' });
    return issues;
  }

  // Check for placeholder text
  if (content.includes('## Key Properties') && content.length < 200) {
    issues.push({ type: 'placeholder_text', severity: 'high' });
  }

  // Check for generic AI wording
  if (content.includes('Learn about') && content.length < 300) {
    issues.push({ type: 'generic_ai_wording', severity: 'high' });
  }

  // Check for weak explanations
  if (content.length < 500) {
    issues.push({ type: 'weak_explanations', severity: 'high' });
  }

  // Check for raw renderer output
  if (content.includes('headers:{type:')) {
    issues.push({ type: 'raw_renderer_output', severity: 'high' });
  }

  // Check for HTML comments only (metadata without content)
  const contentWithoutComments = content.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (contentWithoutComments.length < 200) {
    issues.push({ type: 'missing_practical_value', severity: 'high' });
  }

  return issues;
}

async function main() {
  console.log("=== Evaluating Article Quality ===\n");

  // Get all published topics
  const { data: topics, error: topicsError } = await sb
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (topicsError) {
    console.error("Error fetching topics:", topicsError);
    return;
  }

  if (!topics || topics.length === 0) {
    console.log("No published topics found.");
    return;
  }

  console.log(`Found ${topics.length} published topics.\n`);

  // Get topic translations with content
  const topicIds = topics.map(t => t.id);
  const { data: translations, error: translationsError } = await sb
    .from("topic_translations")
    .select("topic_id, content")
    .eq("language_code", "en")
    .in("topic_id", topicIds);

  if (translationsError) {
    console.error("Error fetching translations:", translationsError);
    return;
  }

  const contentMap = new Map(translations?.map(t => [t.topic_id, t.content]) || []);

  let regenerationRequired = 0;
  let goodQuality = 0;
  const topicsToRegenerate: string[] = [];

  for (const topic of topics) {
    const content = contentMap.get(topic.id);
    const issues = evaluateContentQuality(content || null);

    if (issues.some(i => i.severity === 'high')) {
      console.log(`❌ REGENERATION_REQUIRED: ${topic.slug}`);
      console.log(`   Issues: ${issues.map(i => i.type).join(', ')}`);
      console.log(`   Content length: ${content?.length || 0}`);
      regenerationRequired++;
      topicsToRegenerate.push(topic.id);
    } else {
      console.log(`✓ GOOD_QUALITY: ${topic.slug}`);
      goodQuality++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Total topics: ${topics.length}`);
  console.log(`  Regeneration required: ${regenerationRequired}`);
  console.log(`  Good quality: ${goodQuality}`);
  console.log(`\nTopics marked for regeneration: ${topicsToRegenerate.length}`);

  // Update topics with regeneration flag
  if (topicsToRegenerate.length > 0) {
    console.log(`\nMarking ${topicsToRegenerate.length} topics for regeneration...`);
    
    const { error: updateError } = await sb
      .from("topics")
      .update({ regeneration_required: true })
      .in("id", topicsToRegenerate);

    if (updateError) {
      console.error("Error marking topics for regeneration:", updateError);
    } else {
      console.log(`✓ Successfully marked ${topicsToRegenerate.length} topics for regeneration`);
    }
  }

  console.log(`\n=== Quality Evaluation Complete ===`);
}

main().catch(console.error);
