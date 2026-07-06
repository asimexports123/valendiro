/**
 * Publish Topics with Editorial OS Runtime
 *
 * This script publishes topics using the new Editorial OS runtime:
 * - Topic Classification Engine
 * - Composition Planner
 * - Renderer Orchestrator
 *
 * Usage: ALLOW_RENDER=true tsx scripts/publish-editorial-os.ts
 */

import { createAdminClient } from "../lib/supabase/admin";
import { topicClassificationEngine } from "../services/renderer/topicClassificationEngine";
import { compositionPlanner } from "../services/renderer/compositionPlanner";
import { loadKnowledgePackage } from "../services/renderer/knowledgePackageLoader";
import { render } from "../services/renderer/orchestrator";
import { serializeToHTML } from "../services/renderer/serializers/html";

const TOPICS_TO_PUBLISH = [
  "nodejs-cluster",
  "family-vacations",
  "vendor-management",
];

interface PublishResult {
  topic: string;
  category: string;
  classification: {
    subcategory: string;
    keywordFamily: string;
    subjectModel: string;
    confidence: number;
    reasoning: string[];
  };
  compositionPlan: {
    subjectModel: string;
    editorialBlueprint: string;
    intent: string;
    sections: Array<{
      type: string;
      heading: string;
      required: boolean;
      order: number;
    }>;
    renderingStrategy: string;
  };
  renderResult: {
    outputId: string | null;
    qualityScore: number;
    status: string;
    wordCount: number;
  };
  validation: {
    passed: boolean;
    issues: string[];
  };
  success: boolean;
  error?: string;
}

interface QAValidation {
  hasPlaceholderContent: boolean;
  hasGenericSections: boolean;
  hasDomainSpecificContent: boolean;
  issues: string[];
  passed: boolean;
}

async function getCategorySlug(categoryId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle();
  return data?.slug || null;
}

function validateRenderedContent(content: string, expectedSections: string[]): QAValidation {
  const issues: string[] = [];
  let hasPlaceholderContent = false;
  let hasGenericSections = false;
  let hasDomainSpecificContent = false;

  // Check for placeholder content
  const placeholderPatterns = [
    /placeholder/i,
    /lorem ipsum/i,
    /generic content/i,
    /executive summary/i,
    /core concepts/i,
    /this is a template/i,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(content)) {
      hasPlaceholderContent = true;
      issues.push(`Found placeholder content: ${pattern}`);
    }
  }

  // Check if expected sections are present
  const contentLower = content.toLowerCase();
  for (const section of expectedSections) {
    if (!contentLower.includes(section.toLowerCase())) {
      hasGenericSections = true;
      issues.push(`Missing expected section: ${section}`);
    }
  }

  // Check for domain-specific content indicators
  const domainSpecificPatterns = [
    /\b(node\.js|cluster|worker|ipc|process)\b/i,
    /\b(vacation|travel|itinerary|destination)\b/i,
    /\b(vendor|procurement|contract|sla|kpi)\b/i,
  ];

  for (const pattern of domainSpecificPatterns) {
    if (pattern.test(content)) {
      hasDomainSpecificContent = true;
      break;
    }
  }

  if (!hasDomainSpecificContent) {
    issues.push("No domain-specific content detected");
  }

  const passed = !hasPlaceholderContent && !hasGenericSections && hasDomainSpecificContent;

  return {
    hasPlaceholderContent,
    hasGenericSections,
    hasDomainSpecificContent,
    issues,
    passed,
  };
}

async function publishTopic(slug: string): Promise<PublishResult> {
  console.log(`\n========================================`);
  console.log(`Publishing: ${slug}`);
  console.log(`========================================`);

  const result: PublishResult = {
    topic: slug,
    category: "",
    classification: {
      subcategory: "",
      keywordFamily: "",
      subjectModel: "",
      confidence: 0,
      reasoning: [],
    },
    compositionPlan: {
      subjectModel: "",
      editorialBlueprint: "",
      intent: "",
      sections: [],
      renderingStrategy: "",
    },
    renderResult: {
      outputId: null,
      qualityScore: 0,
      status: "",
      wordCount: 0,
    },
    validation: {
      passed: false,
      issues: [],
    },
    success: false,
  };

  try {
    const supabase = createAdminClient();

    // Step 1: Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id, slug, category_id, topic_translations(title)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .eq("status", "published")
      .maybeSingle();

    if (!topic) {
      throw new Error(`Topic not found: ${slug}`);
    }

    result.category = topic.category_id || "";

    // Step 2: Get category slug
    const categorySlug = await getCategorySlug(topic.category_id);
    if (!categorySlug) {
      throw new Error(`Category not found for topic: ${slug}`);
    }

    result.category = categorySlug;

    // Step 3: Get knowledge package
    const { data: packageData } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!packageData) {
      throw new Error(`Knowledge package not found for topic: ${slug}`);
    }

    // Step 4: Load full knowledge package
    console.log(`\n--- Loading Knowledge Package ---`);
    const loadResult = await loadKnowledgePackage({ packageId: packageData.id });
    if (loadResult.error || !loadResult.package) {
      throw new Error(`Failed to load knowledge package: ${loadResult.error}`);
    }

    const knowledgePackage = loadResult.package;
    console.log(`Loaded ${knowledgePackage.facts.length} facts, ${knowledgePackage.citations.length} citations`);

    // Step 5: Topic Classification
    console.log(`\n--- Topic Classification ---`);
    const classification = topicClassificationEngine.classify({
      category: categorySlug,
      slug: topic.slug,
      title: topic.topic_translations?.[0]?.title,
      facts: knowledgePackage.facts,
    });

    result.classification = classification;
    console.log(`Subcategory: ${classification.subcategory}`);
    console.log(`Keyword Family: ${classification.keywordFamily}`);
    console.log(`Subject Model: ${classification.subjectModel}`);
    console.log(`Confidence: ${classification.confidence.toFixed(2)}`);

    // Step 6: Composition Planning
    console.log(`\n--- Composition Planning ---`);
    const compositionPlan = compositionPlanner.plan({
      topic: topic.slug,
      category: categorySlug,
      slug: topic.slug,
      title: topic.topic_translations?.[0]?.title,
      knowledgePackage: {
        facts: knowledgePackage.facts,
        citations: knowledgePackage.citations,
        relationships: knowledgePackage.relationships,
      },
    });

    result.compositionPlan = {
      subjectModel: compositionPlan.subjectModel,
      editorialBlueprint: compositionPlan.editorialBlueprint,
      intent: compositionPlan.intent,
      sections: compositionPlan.sections.map((s: any) => ({
        type: s.type,
        heading: s.heading,
        required: s.required,
        order: s.order,
      })),
      renderingStrategy: compositionPlan.renderingStrategy,
    };

    console.log(`Subject Model: ${compositionPlan.subjectModel}`);
    console.log(`Editorial Blueprint: ${compositionPlan.editorialBlueprint}`);
    console.log(`Intent: ${compositionPlan.intent}`);
    console.log(`Rendering Strategy: ${compositionPlan.renderingStrategy}`);
    console.log(`Sections: ${compositionPlan.sections.length}`);

    // Step 7: Render using orchestrator
    console.log(`\n--- Rendering ---`);
    const renderResult = await render({
      packageId: packageData.id,
      format: "html",
      rendererId: compositionPlan.renderingStrategy,
      forceRerender: true,
    });

    result.renderResult = {
      outputId: renderResult.outputId,
      qualityScore: renderResult.qualityScore.overall,
      status: renderResult.status,
      wordCount: renderResult.qualityScore.wordCount,
    };

    console.log(`Render successful. Output ID: ${renderResult.outputId}`);
    console.log(`Status: ${renderResult.status}`);
    console.log(`Quality Score: ${renderResult.qualityScore.overall}`);
    console.log(`Word Count: ${renderResult.qualityScore.wordCount}`);

    if (!renderResult.outputId) {
      throw new Error(`Rendering failed for topic: ${slug}`);
    }

    // Step 8: QA Validation
    console.log(`\n--- QA Validation ---`);
    const expectedSections = compositionPlan.sections.map((s: any) => s.heading);
    const validation = validateRenderedContent(renderResult.content, expectedSections);

    result.validation = validation;

    console.log(`Placeholder Content: ${validation.hasPlaceholderContent ? 'YES' : 'NO'}`);
    console.log(`Generic Sections: ${validation.hasGenericSections ? 'YES' : 'NO'}`);
    console.log(`Domain-Specific Content: ${validation.hasDomainSpecificContent ? 'YES' : 'NO'}`);

    if (validation.issues.length > 0) {
      console.log(`Issues:`);
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    validation.passed = !validation.hasPlaceholderContent && !validation.hasGenericSections && validation.hasDomainSpecificContent;

    if (!validation.passed) {
      throw new Error(`QA validation failed for topic: ${slug}`);
    }

    console.log(`\n--- Publish Successful ---`);
    result.success = true;

  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`Error publishing ${slug}:`, error);
  }

  return result;
}

async function main() {
  console.log("Editorial OS Runtime - Publishing Pipeline");
  console.log("============================================");

  // Verify offline context
  if (process.env.ALLOW_RENDER !== "true") {
    console.error("ERROR: ALLOW_RENDER must be set to 'true'");
    process.exit(1);
  }

  const results: PublishResult[] = [];

  for (const slug of TOPICS_TO_PUBLISH) {
    const result = await publishTopic(slug);
    results.push(result);
  }

  console.log(`\n\n========================================`);
  console.log(`PUBLISHING SUMMARY`);
  console.log(`========================================`);

  results.forEach(result => {
    console.log(`\n--- ${result.topic} ---`);
    console.log(`Category: ${result.category}`);
    console.log(`Subject Model: ${result.classification.subjectModel}`);
    console.log(`Keyword Family: ${result.classification.keywordFamily}`);
    console.log(`Subcategory: ${result.classification.subcategory}`);
    console.log(`Editorial Blueprint: ${result.compositionPlan.editorialBlueprint}`);
    console.log(`Rendering Strategy: ${result.compositionPlan.renderingStrategy}`);
    console.log(`Output ID: ${result.renderResult.outputId}`);
    console.log(`Quality Score: ${result.renderResult.qualityScore}`);
    console.log(`Word Count: ${result.renderResult.wordCount}`);
    console.log(`Status: ${result.renderResult.status}`);
    console.log(`QA Passed: ${result.validation.passed}`);
    console.log(`Success: ${result.success}`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
  });

  // Save results to file
  const fs = require("fs");
  fs.writeFileSync(
    "./editorial-os-publishing-results.json",
    JSON.stringify(results, null, 2)
  );
  console.log(`\nPublishing results saved to: editorial-os-publishing-results.json`);
}

main().catch(console.error);
