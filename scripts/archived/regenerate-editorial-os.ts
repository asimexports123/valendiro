/**
 * Regenerate Topics with Editorial OS Runtime
 *
 * This script regenerates specific topics using the new Editorial OS runtime:
 * - nodejs-cluster
 * - family-vacations
 * - vendor-management
 *
 * Usage: ALLOW_RENDER=true tsx scripts/regenerate-editorial-os.ts
 */

import { createAdminClient } from "../lib/supabase/admin";
import { topicClassificationEngine } from "../services/renderer/topicClassificationEngine";
import { compositionPlanner } from "../services/renderer/compositionPlanner";
import { loadKnowledgePackage } from "../services/renderer/knowledgePackageLoader";
import { render } from "../services/renderer/orchestrator";
import { serializeToHTML } from "../services/renderer/serializers/html";

const TOPICS_TO_REGENERATE = [
  "nodejs-cluster",
  "family-vacations",
  "vendor-management",
];

interface ExecutionTrace {
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
  renderedSections: string[];
  success: boolean;
  error?: string;
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

async function regenerateTopic(slug: string): Promise<ExecutionTrace> {
  console.log(`\n========================================`);
  console.log(`Regenerating: ${slug}`);
  console.log(`========================================`);

  const trace: ExecutionTrace = {
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
    renderedSections: [],
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

    trace.category = topic.category_id || "";

    // Step 2: Get category slug
    const categorySlug = await getCategorySlug(topic.category_id);
    if (!categorySlug) {
      throw new Error(`Category not found for topic: ${slug}`);
    }

    trace.category = categorySlug;

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
    const loadResult = await loadKnowledgePackage({ packageId: packageData.id });
    if (loadResult.error || !loadResult.package) {
      throw new Error(`Failed to load knowledge package: ${loadResult.error}`);
    }

    const knowledgePackage = loadResult.package;

    // Step 5: Topic Classification
    console.log(`\n--- Topic Classification ---`);
    const classification = topicClassificationEngine.classify({
      category: categorySlug,
      slug: topic.slug,
      title: topic.topic_translations?.[0]?.title,
      facts: knowledgePackage.facts,
    });

    trace.classification = classification;
    console.log(`Subcategory: ${classification.subcategory}`);
    console.log(`Keyword Family: ${classification.keywordFamily}`);
    console.log(`Subject Model: ${classification.subjectModel}`);
    console.log(`Confidence: ${classification.confidence}`);
    console.log(`Reasoning: ${classification.reasoning.join("; ")}`);

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

    trace.compositionPlan = {
      subjectModel: compositionPlan.subjectModel,
      editorialBlueprint: compositionPlan.editorialBlueprint,
      intent: compositionPlan.intent,
      sections: compositionPlan.sections.map(s => ({
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
    console.log(`Sections:`);
    compositionPlan.sections.forEach(section => {
      console.log(`  ${section.order}. ${section.heading} (${section.type}) - ${section.required ? 'REQUIRED' : 'OPTIONAL'}`);
    });

    // Step 7: Render using orchestrator
    console.log(`\n--- Rendering ---`);
    const renderResult = await render({
      packageId: packageData.id,
      format: "html",
      rendererId: compositionPlan.renderingStrategy,
      forceRerender: true,
    });

    if (!renderResult.outputId) {
      throw new Error(`Rendering failed for topic: ${slug}`);
    }

    console.log(`Render successful. Output ID: ${renderResult.outputId}`);
    console.log(`Status: ${renderResult.status}`);
    console.log(`Quality Score: ${renderResult.qualityScore.overall}`);

    // Step 8: Extract rendered sections
    const content = renderResult.content;
    const sectionRegex = /<h2[^>]*>(.*?)<\/h2>/g;
    const sections: string[] = [];
    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push(match[1]);
    }

    trace.renderedSections = sections;
    console.log(`\n--- Rendered Sections ---`);
    sections.forEach((section, i) => {
      console.log(`${i + 1}. ${section}`);
    });

    trace.success = true;

  } catch (error) {
    trace.success = false;
    trace.error = error instanceof Error ? error.message : String(error);
    console.error(`Error regenerating ${slug}:`, error);
  }

  return trace;
}

async function main() {
  console.log("Editorial OS Runtime Integration - Regeneration Script");
  console.log("=========================================================");

  // Verify offline context
  if (process.env.ALLOW_RENDER !== "true") {
    console.error("ERROR: ALLOW_RENDER must be set to 'true'");
    process.exit(1);
  }

  const traces: ExecutionTrace[] = [];

  for (const slug of TOPICS_TO_REGENERATE) {
    const trace = await regenerateTopic(slug);
    traces.push(trace);
  }

  console.log(`\n\n========================================`);
  console.log(`SUMMARY`);
  console.log(`========================================`);

  traces.forEach(trace => {
    console.log(`\nTopic: ${trace.topic}`);
    console.log(`Category: ${trace.category}`);
    console.log(`Subject Model: ${trace.classification.subjectModel}`);
    console.log(`Keyword Family: ${trace.classification.keywordFamily}`);
    console.log(`Subcategory: ${trace.classification.subcategory}`);
    console.log(`Editorial Blueprint: ${trace.compositionPlan.editorialBlueprint}`);
    console.log(`Success: ${trace.success}`);
    if (trace.error) {
      console.log(`Error: ${trace.error}`);
    }
    console.log(`Rendered Sections: ${trace.renderedSections.join(", ")}`);
  });

  // Save traces to file for reference
  const fs = require("fs");
  fs.writeFileSync(
    "./editorial-os-execution-traces.json",
    JSON.stringify(traces, null, 2)
  );
  console.log(`\nExecution traces saved to: editorial-os-execution-traces.json`);
}

main().catch(console.error);
