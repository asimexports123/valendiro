/**
 * Create Canonical Topic Article
 * 
 * Full pipeline with canonical topic identity:
 * RSS → Clean Article → NER → Entity Resolution → Knowledge Package → 
 * Canonical Topic Resolution → Article Generation
 * 
 * One concept = one topic ID = one canonical slug = one permanent URL
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
import {
  resolveOrCreateTopic,
  generateCanonicalSlug,
} from "../services/discovery/canonicalTopicService";

const supabase = createAdminClient();

async function createCanonicalTopicArticle() {
  console.log("=" + "=".repeat(79));
  console.log("CANONICAL TOPIC + CLEAN URL PIPELINE");
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
  console.log();

  // Step 4: Entity Resolution Pipeline
  console.log("STEP 4: ENTITY RESOLUTION PIPELINE");
  console.log("-".repeat(80));
  const { entities, relationships } = await resolveEntities(cleanedContent);
  console.log(`✓ Entities Extracted: ${entities.length}`);
  console.log(`✓ Relationships Extracted: ${relationships.length}`);
  console.log();

  // Step 5: Generate canonical slug (NO TIMESTAMP)
  console.log("STEP 5: GENERATE CANONICAL SLUG");
  console.log("-".repeat(80));
  const canonicalSlug = generateCanonicalSlug(title);
  console.log(`✓ Canonical Slug: ${canonicalSlug}`);
  console.log(`✓ No timestamp suffix`);
  console.log();

  // Step 6: Synthesize article from knowledge package
  console.log("STEP 6: SYNTHESIZE ARTICLE FROM KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const entityNames = entities.map(e => e.canonicalName);
  
  const synthesized = await synthesizeArticleFromKnowledge(
    title,
    factsWithConfidence.map(f => f.fact),
    entityNames,
    relationships,
    extractedArticle.url
  );
  
  console.log(`✓ Synthesized article with ${Object.keys(synthesized).length} sections`);
  console.log();

  // Step 7: Convert to markdown
  console.log("STEP 7: CONVERT TO MARKDOWN");
  console.log("-".repeat(80));
  const markdownContent = synthesizedToMarkdown(title, synthesized);
  const htmlContent = convertMarkdownToHtml(markdownContent);
  console.log(`✓ Markdown Length: ${markdownContent.length} characters`);
  console.log();

  // Step 8: Canonical Topic Resolution
  console.log("STEP 8: CANONICAL TOPIC RESOLUTION");
  console.log("-".repeat(80));
  const topicResolution = await resolveOrCreateTopic(title, markdownContent, htmlContent);
  console.log(`✓ Action: ${topicResolution.action}`);
  console.log(`✓ Is New Topic: ${topicResolution.isNewTopic}`);
  console.log();

  // Step 9: Create or Update Knowledge Package
  console.log("STEP 9: CREATE OR UPDATE KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const knowledgePackageId = uuidv4();
  const knowledgeHash = generateKnowledgeHash(JSON.stringify({ entities, relationships, factsWithConfidence }));
  
  // Check if knowledge package exists for this topic
  const { data: existingKP } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topicResolution.topic.id)
    .single();
  
  if (existingKP) {
    console.log("  Updating existing knowledge package...");
    const { error: kpUpdateError } = await supabase
      .from("knowledge_packages")
      .update({
        knowledge_hash: knowledgeHash,
        fact_count: factsWithConfidence.length,
        relationship_count: relationships.length,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", existingKP.id);
    
    if (kpUpdateError) {
      console.error(`  ✗ Error updating knowledge package: ${kpUpdateError.message}`);
      return;
    }
    console.log("  ✓ Knowledge package updated");
  } else {
    console.log("  Creating new knowledge package...");
    const { error: kpCreateError } = await supabase
      .from("knowledge_packages")
      .insert({
        id: knowledgePackageId,
        topic_id: topicResolution.topic.id,
        slug: canonicalSlug,
        version: 1,
        knowledge_hash: knowledgeHash,
        source_count: 1,
        fact_count: factsWithConfidence.length,
        relationship_count: relationships.length,
        status: 'archived',
        discovery_run_ids: [],
        created_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      });
    
    if (kpCreateError) {
      console.error(`  ✗ Error creating knowledge package: ${kpCreateError.message}`);
      return;
    }
    console.log("  ✓ Knowledge package created");
  }
  console.log();

  // Final Summary
  console.log("=" + "=".repeat(79));
  console.log("VALIDATION");
  console.log("=".repeat(80));
  console.log();
  console.log(`Canonical Topic ID:`);
  console.log(`  ${topicResolution.topic.id}`);
  console.log();
  console.log(`Canonical Slug:`);
  console.log(`  ${topicResolution.topic.slug}`);
  console.log();
  console.log(`Final URL (no timestamp):`);
  console.log(`  https://valendiro.com${topicResolution.topic.canonicalPath}`);
  console.log();
  console.log(`Existing topic detection log:`);
  console.log(`  ${topicResolution.isNewTopic ? "No existing topic found" : "Existing topic found and updated"}`);
  console.log(`  Action taken: ${topicResolution.action}`);
  console.log();
  console.log(`Whether a new topic was created or an existing one was updated:`);
  console.log(`  ${topicResolution.isNewTopic ? "NEW TOPIC CREATED" : "EXISTING TOPIC UPDATED"}`);
  console.log();
  console.log(`✓ Phase 8.9 COMPLETE - Canonical Topics + Clean URLs`);
  console.log("=".repeat(80));
}

// Helper functions

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

createCanonicalTopicArticle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
