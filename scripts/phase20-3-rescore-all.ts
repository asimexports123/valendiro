import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function rescoreAllArticles() {
  console.log("=== Phase 20.3: Re-score All Articles with Intent-Aware Engine ===\n");

  // Fetch rendered outputs
  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select("id, package_id, document_tree")
    .neq("status", "failed")
    .eq("output_format", "html");

  console.log(`Found ${outputs?.length || 0} rendered outputs to re-score\n`);

  // Fetch knowledge packages
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, slug");

  const packageMap = new Map();
  (packages || []).forEach((p: any) => {
    packageMap.set(p.id, p);
  });

  console.log(`Fetched ${packages?.length || 0} knowledge packages\n`);
  console.log(`Package map size: ${packageMap.size}\n`);

  const { scoreIntentAwareQuality } = await import("../services/renderer/intentAwareQualityScorer.ts");

  let updatedCount = 0;
  let failedCount = 0;
  const scoreChanges: any[] = [];

  for (const output of outputs || []) {
    const pkg = packageMap.get(output.package_id);
    if (!pkg) {
      console.log(`Skipping ${output.package_id} - no package found`);
      failedCount++;
      continue;
    }

    try {
      // Fetch facts
      const { data: facts } = await supabase
        .from("knowledge_facts")
        .select("id, statement, fact_type, confidence, scope, tags, domain")
        .eq("package_id", output.package_id);

      // Map database facts to PluginFact format
      const mappedFacts = (facts || []).map((f: any) => ({
        id: f.id,
        statement: f.statement,
        factType: f.fact_type,
        confidence: f.confidence,
        scope: f.scope,
        tags: f.tags,
        domain: f.domain,
      }));

      // Fetch citations
      const { data: citations } = await supabase
        .from("citations")
        .select("id, source_name, source_url, adapter_name, source_authority, retrieved_at")
        .eq("package_id", output.package_id);

      // Map database citations to CitationInput format
      const mappedCitations = (citations || []).map((c: any) => ({
        id: c.id,
        sourceName: c.source_name,
        sourceUrl: c.source_url,
        adapterName: c.adapter_name,
        sourceAuthority: c.source_authority,
        retrievedAt: c.retrieved_at,
      }));

      const decision = {
        eligible: true,
        reason: null,
        policy: {
          id: "default",
          name: "default",
          categoryMatch: [],
          requiredFactTypes: ["definition"],
          preferredFormat: "long-article",
          preferredStyle: ["intermediate"],
          minFactCount: 5,
          minCitationCount: 1,
          sectionOverrides: [],
          commercialPlaceholders: false,
        },
        blockOrder: [],
        missingKnowledge: [],
        warnings: [],
      };

      const tree = output.document_tree || [];
      const newScore = scoreIntentAwareQuality(
        tree,
        mappedFacts,
        mappedCitations,
        decision,
        pkg.slug,
        null  // subcategory_slug doesn't exist in knowledge_packages
      );

      // Update database
      const { error } = await supabase
        .from("rendered_outputs")
        .update({
          quality_score: {
            overall: newScore.overall,
            intent: newScore.intent,
            category: newScore.category,
            ...newScore.metrics,
            missingKnowledgeCount: 0,
            missingKnowledgeSeverity: {},
            wordCount: newScore.wordCount,
            sectionCount: newScore.sectionCount,
            internalLinkCount: 0,
            citationCount: citations?.length || 0,
            readingFlow: newScore.readingFlow,
          },
        })
        .eq("id", output.id);

      if (error) {
        console.error(`Error updating ${pkg.slug}:`, error);
        failedCount++;
      } else {
        updatedCount++;
        scoreChanges.push({
          slug: pkg.slug,
          intent: newScore.intent,
          category: newScore.category,
          newScore: newScore.overall,
        });
        console.log(`✓ ${pkg.slug}: ${newScore.intent} / ${newScore.category} → ${newScore.overall}`);
      }
    } catch (err) {
      console.error(`Error processing ${output.package_id}:`, err);
      failedCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total processed: ${outputs?.length || 0}`);
  console.log(`Successfully updated: ${updatedCount}`);
  console.log(`Failed: ${failedCount}`);

  // Save score changes
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-3-rescore-results.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      scoreChanges,
    }, null, 2)
  );

  console.log(`\nScore changes saved to phase20-3-rescore-results.json`);
}

rescoreAllArticles().catch(console.error);
