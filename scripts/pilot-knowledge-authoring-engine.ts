/**
 * Pilot Script: Test Knowledge Authoring Engine on 5 Pillar Pages
 *
 * Topics:
 * - Python Programming Fundamentals (Technology)
 * - Investing Basics (Personal Finance)
 * - Nutrition Fundamentals (Health)
 * - Travel Planning Fundamentals (Travel)
 * - Marketing Fundamentals (Business)
 */

import "dotenv/config";
import { createAdminClient } from "../lib/supabase/admin";
import { KnowledgeAuthoringOrchestrator, type AuthoringContext } from "../services/renderer/authoring/knowledgeAuthoringOrchestrator";

const TOPICS = [
  { slug: "python-programming-fundamentals", category: "technology", intent: "educate" as const },
  { slug: "investing-basics", category: "finance", intent: "educate" as const },
  { slug: "nutrition-fundamentals", category: "health", intent: "educate" as const },
  { slug: "travel-planning-fundamentals", category: "travel", intent: "guide" as const },
  { slug: "marketing-fundamentals", category: "business", intent: "educate" as const },
];

async function getTopicId(slug: string): Promise<string | null> {
  const sb = createAdminClient();
  const { data } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
  return data?.id || null;
}

async function getKnowledgePackage(topicId: string) {
  const sb = createAdminClient();

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topicId)
    .maybeSingle();

  if (!pkg) return null;

  const { data: factsData } = await sb
    .from("knowledge_facts")
    .select("*")
    .eq("package_id", pkg.id)
    .order("created_at");

  const facts = (factsData ?? []).map((f: any) => ({
    id: f.id,
    statement: f.statement,
    factType: f.fact_type,
    confidence: f.confidence,
    scope: f.scope,
    tags: f.tags ?? [],
    domain: f.domain,
  }));

  return { pkg, facts };
}

async function runPilot() {
  console.log("=== Knowledge Authoring Engine Pilot ===");
  console.log("Testing on 5 pillar pages...\n");

  const orchestrator = new KnowledgeAuthoringOrchestrator();

  for (const topic of TOPICS) {
    console.log(`\n--- ${topic.slug} (${topic.category}) ---`);

    const topicId = await getTopicId(topic.slug);
    if (!topicId) {
      console.log("ERROR: Topic not found");
      continue;
    }

    const packageData = await getKnowledgePackage(topicId);
    if (!packageData) {
      console.log("ERROR: Knowledge package not found");
      continue;
    }

    console.log(`Facts loaded: ${packageData.facts.length}`);

    const context: AuthoringContext = {
      topic: topic.slug,
      category: topic.category,
      intent: topic.intent,
      complexity: "intermediate",
      facts: packageData.facts,
    };

    try {
      const result = await orchestrator.authorDocument(context);

      console.log(`✓ Authoring complete`);
      console.log(`  - Sections: ${result.document.sections.length}`);
      console.log(`  - Reader questions: ${result.readerQuestions.length}`);
      console.log(`  - Gaps identified: ${result.gapCompletion.gaps.length}`);
      console.log(`  - Gaps filled: ${result.gapCompletion.filledGacts.length}`);
      console.log(`  - Reader readiness: ${result.gapCompletion.readerReadinessScore}/100`);
      console.log(`  - Editorial quality: ${result.editorialResult.qualityScore}/100`);
      console.log(`  - Passes editorial: ${result.editorialResult.passesEditorial}`);
      console.log(`  - Acceptance test passed: ${result.acceptanceTest.allPassed}`);
      console.log(`  - Acceptance confidence: ${result.acceptanceTest.overallConfidence}/100`);
      console.log(`  - Recommendation: ${result.acceptanceTest.recommendation}`);
      console.log(`  - Passes all checks: ${result.passesAllChecks}`);

      // Output document structure
      console.log(`\n  Document structure:`);
      console.log(`    Introduction: ${result.document.introduction.substring(0, 100)}...`);
      for (const section of result.document.sections) {
        console.log(`    - ${section.heading} (${section.content.length} chars)`);
      }
      console.log(`    Conclusion: ${result.document.conclusion.substring(0, 100)}...`);

    } catch (error) {
      console.log(`ERROR: ${error}`);
    }
  }

  console.log("\n=== Pilot Complete ===");
}

runPilot().catch(console.error);
