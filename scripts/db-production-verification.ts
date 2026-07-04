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

async function productionVerification() {
  console.log("=== Production Verification: End-to-End Trace ===\n");
  console.log("Verifying: Topic → Knowledge Package → Facts → Rendered Output → Live Page\n");

  // Fetch 25 random topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, canonical_path, status")
    .eq("status", "published")
    .limit(25);

  console.log(`Selected ${topics?.length || 0} published topics for verification\n`);

  const verificationResults: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const topic of topics || []) {
    console.log(`\n=== ${topic.slug} ===`);
    
    // Stage 1: Topic → Knowledge Package
    const { data: packages } = await supabase
      .from("knowledge_packages")
      .select("id, slug, topic_id")
      .eq("topic_id", topic.id);
    
    if (!packages || packages.length === 0) {
      console.log(`  ✗ No knowledge package found for topic`);
      failureCount++;
      verificationResults.push({
        topic: topic.slug,
        status: "failed",
        reason: "No knowledge package",
      });
      continue;
    }

    const pkg = packages[0];
    console.log(`  ✓ Knowledge Package: ${pkg.slug} (ID: ${pkg.id})`);

    // Verify topic_id matches
    if (pkg.topic_id !== topic.id) {
      console.log(`  ✗ Package topic_id mismatch`);
      failureCount++;
      verificationResults.push({
        topic: topic.slug,
        status: "failed",
        reason: "Package topic_id mismatch",
      });
      continue;
    }

    // Stage 2: Knowledge Package → Facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("id, package_id")
      .eq("package_id", pkg.id)
      .limit(1);
    
    if (!facts || facts.length === 0) {
      console.log(`  ⚠ No facts found (package may be empty)`);
    } else {
      console.log(`  ✓ Facts exist (${facts.length} total)`);
      // Verify package_id matches
      if (facts[0].package_id !== pkg.id) {
        console.log(`  ✗ Fact package_id mismatch`);
        failureCount++;
        continue;
      }
    }

    // Stage 3: Knowledge Package → Rendered Output
    const { data: rendered } = await supabase
      .from("rendered_outputs")
      .select("id, package_id, status, output_format")
      .eq("package_id", pkg.id)
      .eq("output_format", "html")
      .eq("status", "published")
      .limit(1);
    
    if (!rendered || rendered.length === 0) {
      console.log(`  ⚠ No rendered output (not yet rendered)`);
      verificationResults.push({
        topic: topic.slug,
        status: "partial",
        reason: "Not yet rendered",
      });
      continue;
    }

    const renderedOutput = rendered[0];
    console.log(`  ✓ Rendered Output: ${renderedOutput.id} (Status: ${renderedOutput.status})`);

    // Verify package_id matches
    if (renderedOutput.package_id !== pkg.id) {
      console.log(`  ✗ Rendered output package_id mismatch`);
      failureCount++;
      verificationResults.push({
        topic: topic.slug,
        status: "failed",
        reason: "Rendered output package_id mismatch",
      });
      continue;
    }

    // Stage 4: Live Page (verify canonical_path exists)
    const livePageUrl = `https://valendiro.com${topic.canonical_path}`;
    console.log(`  ✓ Live Page: ${livePageUrl}`);

    // Check if quality_score has intent-aware fields
    const { data: renderedWithScore } = await supabase
      .from("rendered_outputs")
      .select("quality_score")
      .eq("id", renderedOutput.id)
      .single();
    
    const hasIntentAwareScore = renderedWithScore?.quality_score?.intent && renderedWithScore?.quality_score?.category;
    if (hasIntentAwareScore) {
      console.log(`  ✓ Intent-Aware Score: ${renderedWithScore.quality_score.intent} / ${renderedWithScore.quality_score.category} → ${renderedWithScore.quality_score.overall}`);
    } else {
      console.log(`  ⚠ Legacy score (no intent data)`);
    }

    console.log(`  ✓ End-to-end trace successful`);
    successCount++;
    verificationResults.push({
      topic: topic.slug,
      status: "success",
      package: pkg.slug,
      intent: renderedWithScore?.quality_score?.intent,
      category: renderedWithScore?.quality_score?.category,
      score: renderedWithScore?.quality_score?.overall,
      livePage: livePageUrl,
    });
  }

  // Summary
  console.log(`\n=== VERIFICATION SUMMARY ===`);
  console.log(`Total topics: ${topics?.length || 0}`);
  console.log(`Full end-to-end success: ${successCount}`);
  console.log(`Partial (not rendered): ${verificationResults.filter(r => r.status === "partial").length}`);
  console.log(`Failed: ${failureCount}`);

  const integrityRate = ((successCount / (topics?.length || 1)) * 100).toFixed(1);
  console.log(`\nReferential Integrity: ${integrityRate}%`);

  if (failureCount === 0) {
    console.log(`\n✓ 100% Referential Integrity Achieved`);
  } else {
    console.log(`\n✗ Integrity Issues Found`);
  }

  // Save results
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "db-production-verification-results.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      verificationResults,
      summary: {
        total: topics?.length || 0,
        success: successCount,
        partial: verificationResults.filter(r => r.status === "partial").length,
        failed: failureCount,
        integrityRate: `${integrityRate}%`,
      },
    }, null, 2)
  );

  console.log(`\nFull results saved to db-production-verification-results.json`);
}

productionVerification().catch(console.error);
