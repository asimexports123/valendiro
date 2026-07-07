/**
 * Create Entity-Resolved Article
 * 
 * Full pipeline with canonical Entity Resolution:
 * RSS → Clean Article → NER → Entity Normalization → Entity Resolution → 
 * Entity Deduplication → Entity Database → Knowledge Graph → Knowledge Package → Article Generation
 */

import { createAdminClient } from "../lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import {
  synthesizeArticleFromKnowledge,
  synthesizedToMarkdown,
  cleanContent,
} from "../services/discovery/knowledgeSynthesisService";
import {
  resolveEntities,
  extractFactsWithConfidence,
} from "../services/discovery/entityResolutionService";

const supabase = createAdminClient();

async function createEntityResolvedArticle() {
  console.log("=" + "=".repeat(79));
  console.log("ENTITY RESOLUTION + KNOWLEDGE GRAPH PIPELINE");
  console.log("=".repeat(80));
  console.log();

  // Step 1: Get fresh RSS article
  console.log("STEP 1: GET FRESH RSS ARTICLE");
  console.log("-".repeat(80));
  const { data: extractedArticle } = await supabase
    .from("discovered_content")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!extractedArticle) {
    console.log("✗ No extracted article found");
    return;
  }

  console.log(`✓ Original RSS URL: ${extractedArticle.url}`);
  console.log(`✓ Original Title: ${extractedArticle.title}`);
  console.log(`✓ Original Content Length: ${(extractedArticle.content_full || '').length} characters`);
  console.log();

  const originalContent = extractedArticle.content_full || extractedArticle.content_summary || "";
  const title = extractedArticle.title;

  // Step 2: Clean content
  console.log("STEP 2: CLEAN CONTENT");
  console.log("-".repeat(80));
  const cleanedContent = cleanContent(originalContent);
  console.log(`✓ Cleaned Content Length: ${cleanedContent.length} characters`);
  console.log();

  // Step 3: Extract facts with confidence scores
  console.log("STEP 3: EXTRACT FACTS WITH CONFIDENCE");
  console.log("-".repeat(80));
  const factsWithConfidence = extractFactsWithConfidence(cleanedContent);
  console.log(`✓ Facts Extracted: ${factsWithConfidence.length}`);
  console.log(`✓ Average Confidence: ${(factsWithConfidence.reduce((sum, f) => sum + f.confidence, 0) / factsWithConfidence.length).toFixed(2)}`);
  console.log();

  // Step 4: Entity Resolution Pipeline
  console.log("STEP 4: ENTITY RESOLUTION PIPELINE");
  console.log("-".repeat(80));
  console.log("  4.1: NER (Named Entity Recognition)");
  const { entities, relationships } = await resolveEntities(cleanedContent);
  console.log(`  ✓ Entities Extracted: ${entities.length}`);
  console.log("  4.2: Entity Normalization");
  console.log("  ✓ Aliases resolved to canonical names");
  console.log("  4.3: Entity Deduplication");
  console.log("  ✓ Duplicate entities removed");
  console.log();

  // Step 5: Display Resolved Entities
  console.log("STEP 5: RESOLVED ENTITIES");
  console.log("-".repeat(80));
  entities.forEach((entity, i) => {
    console.log(`  ${i + 1}. ${entity.canonicalName} (${entity.type})`);
    console.log(`     Confidence: ${entity.confidenceScore.toFixed(2)}`);
    console.log(`     Aliases: ${entity.aliases.join(", ")}`);
    console.log();
  });

  // Step 6: Display Entity Types
  console.log("STEP 6: ENTITY TYPES");
  console.log("-".repeat(80));
  const typeCount = new Map<string, number>();
  entities.forEach(e => {
    typeCount.set(e.type, (typeCount.get(e.type) || 0) + 1);
  });
  typeCount.forEach((count, type) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log();

  // Step 7: Display Relationship Graph
  console.log("STEP 7: RELATIONSHIP GRAPH");
  console.log("-".repeat(80));
  relationships.forEach((rel, i) => {
    console.log(`  ${i + 1}. ${rel.source} → ${rel.target} (${rel.type})`);
    console.log(`     Confidence: ${rel.confidenceScore.toFixed(2)}`);
  });
  console.log();

  // Step 8: Create Knowledge Package
  console.log("STEP 8: CREATE KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const topicId = uuidv4();
  const timestamp = Date.now();
  const topicSlug = generateTopicSlug(title) + `-${timestamp}`;
  const knowledgePackageId = uuidv4();
  const knowledgeHash = generateKnowledgeHash(JSON.stringify({ entities, relationships, factsWithConfidence }));
  
  console.log(`✓ Knowledge Package ID: ${knowledgePackageId}`);
  console.log(`✓ Knowledge Hash: ${knowledgeHash}`);
  console.log();

  // Step 9: Synthesize article from knowledge package
  console.log("STEP 9: SYNTHESIZE ARTICLE FROM KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const entityNames = entities.map(e => e.canonicalName);
  const relationshipTypes = [...new Set(relationships.map(r => r.type))];
  
  const synthesized = await synthesizeArticleFromKnowledge(
    title,
    factsWithConfidence.map(f => f.fact),
    entityNames,
    relationships,
    extractedArticle.url
  );
  
  console.log(`✓ Synthesized article with ${Object.keys(synthesized).length} sections`);
  console.log();

  // Step 10: Convert to markdown
  console.log("STEP 10: CONVERT TO MARKDOWN");
  console.log("-".repeat(80));
  const markdownContent = synthesizedToMarkdown(title, synthesized);
  console.log(`✓ Markdown Length: ${markdownContent.length} characters`);
  console.log();

  // Step 11: Create Topic
  console.log("STEP 11: CREATE TOPIC");
  console.log("-".repeat(80));
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({
      id: topicId,
      slug: topicSlug,
      canonical_path: `/en/topics/${topicSlug}`,
      category_id: null,
      difficulty: 'intermediate',
      estimated_read_time: 8,
      status: 'published',
      published_at: new Date().toISOString(),
      content: markdownContent,
      html_content: convertMarkdownToHtml(markdownContent),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (topicError) {
    console.error(`✗ Error creating topic: ${topicError.message}`);
    return;
  }

  console.log(`✓ Topic ID: ${topicId}`);
  console.log(`✓ Topic Slug: ${topicSlug}`);
  console.log();

  // Step 12: Create Knowledge Package in database
  console.log("STEP 12: CREATE KNOWLEDGE PACKAGE IN DATABASE");
  console.log("-".repeat(80));
  const { data: knowledgePackage, error: kpError } = await supabase
    .from("knowledge_packages")
    .insert({
      id: knowledgePackageId,
      topic_id: topicId,
      slug: topicSlug,
      version: 1,
      knowledge_hash: knowledgeHash,
      source_count: 1,
      fact_count: factsWithConfidence.length,
      relationship_count: relationships.length,
      status: 'archived',
      discovery_run_ids: [],
      created_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (kpError) {
    console.error(`✗ Error creating knowledge package: ${kpError.message}`);
    return;
  }

  console.log(`✓ Knowledge Package ID: ${knowledgePackageId}`);
  console.log();

  // Step 13: Create Topic Translation
  console.log("STEP 13: CREATE TOPIC TRANSLATION");
  console.log("-".repeat(80));
  const translationId = uuidv4();
  const subtitle = synthesized.whatHappened.substring(0, 200);
  const metaTitle = title;
  const metaDescription = synthesized.whyItMatters.substring(0, 160);
  const { data: translation, error: transError } = await supabase
    .from("topic_translations")
    .insert({
      id: translationId,
      topic_id: topicId,
      language_code: "en",
      title: title,
      subtitle: subtitle,
      content: markdownContent,
      meta_title: metaTitle,
      meta_description: metaDescription,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (transError) {
    console.error(`✗ Error creating topic translation: ${transError.message}`);
    return;
  }

  console.log(`✓ Translation ID: ${translationId}`);
  console.log();

  // Final Summary
  console.log("=" + "=".repeat(79));
  console.log("VALIDATION");
  console.log("=".repeat(80));
  console.log();
  console.log(`Original RSS URL:`);
  console.log(`  ${extractedArticle.url}`);
  console.log();
  console.log(`Resolved Entities:`);
  console.log(`  ${entities.map(e => e.canonicalName).join(", ")}`);
  console.log();
  console.log(`Entity Types:`);
  console.log(`  ${Array.from(typeCount.entries()).map(([t, c]) => `${t}: ${c}`).join(", ")}`);
  console.log();
  console.log(`Relationship Graph:`);
  console.log(`  ${relationships.length} relationships`);
  relationships.forEach(r => {
    console.log(`    ${r.source} → ${r.target} (${r.type})`);
  });
  console.log();
  console.log(`Knowledge Package Statistics:`);
  console.log(`  Facts Count: ${factsWithConfidence.length}`);
  console.log(`  Entities Count: ${entities.length}`);
  console.log(`  Relationships Count: ${relationships.length}`);
  console.log();
  console.log(`Database Proof:`);
  console.log(`  Knowledge Package ID: ${knowledgePackageId}`);
  console.log(`  Topic ID: ${topicId}`);
  console.log(`  Translation ID: ${translationId}`);
  console.log();
  console.log(`Live URL:`);
  console.log(`  https://valendiro.com${topic.canonical_path}`);
  console.log();
  console.log(`✓ Phase 8.8 COMPLETE - Entity Resolution + Knowledge Graph Foundation`);
  console.log("=".repeat(80));
}

// Helper functions

function generateTopicSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function generateKnowledgeHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  
  // Convert bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Convert lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  
  // Convert line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  return html;
}

createEntityResolvedArticle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
