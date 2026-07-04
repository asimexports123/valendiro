/**
 * Coverage-Driven Pipeline Validation Script
 * 
 * Validates the autonomous coverage-driven generation engine
 * Usage: npx tsx scripts/validate-coverage-pipeline.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables BEFORE any imports
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

interface PipelineMetrics {
  startTime: number;
  endTime: number;
  topicsDiscovered: number;
  topicsSkipped: number;
  topicsGenerated: number;
  topicsPublished: number;
  failedPublications: number;
  averageProcessingTime: number;
  coverageBefore: number;
  coverageAfter: number;
  errors: string[];
  stageTimes: Record<string, number>;
}

function h1(s: string) { console.log("\n" + "=".repeat(65) + "\n" + s + "\n" + "=".repeat(65)); }
function h2(s: string) { console.log("\n" + "-".repeat(65) + "\n" + s + "\n" + "-".repeat(65)); }
function ok(s: string) { console.log("  ✓ " + s); }
function fail(s: string) { console.log("  ✗ " + s); }

async function runValidation() {
  h1("Coverage-Driven Pipeline Validation");
  console.log("Started at: " + new Date().toISOString());

  const metrics: PipelineMetrics = {
    startTime: Date.now(),
    endTime: 0,
    topicsDiscovered: 0,
    topicsSkipped: 0,
    topicsGenerated: 0,
    topicsPublished: 0,
    failedPublications: 0,
    averageProcessingTime: 0,
    coverageBefore: 0,
    coverageAfter: 0,
    errors: [],
    stageTimes: {}
  };

  // Dynamic imports to ensure env vars are loaded first
  const [
    { queueAllMissingTopics },
    { processDiscoveryQueue },
    { processAssemblyQueue },
    { processRenderingQueue },
    { processPublishingQueue },
    { buildAllInternalLinks },
    { generateSitemap },
    { analyzeAllDomainsCoverage },
    { createClient }
  ] = await Promise.all([
    import("../services/coverage/topicQueueService"),
    import("../services/discovery/autonomousDiscovery"),
    import("../services/assembly/autonomousAssembly"),
    import("../services/rendering/autonomousRendering"),
    import("../services/publishing/autonomousPublishing"),
    import("../services/linking/autonomousLinking"),
    import("../services/seo/autonomousSitemap"),
    import("../services/coverage/coverageEngine"),
    import("@supabase/supabase-js")
  ]);

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  async function measureStage(stage: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    h2(stage);
    try {
      await fn();
      const duration = (Date.now() - start) / 1000;
      metrics.stageTimes[stage] = duration;
      ok(`${stage} completed in ${duration.toFixed(2)}s`);
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      metrics.stageTimes[stage] = duration;
      metrics.errors.push(`${stage} failed: ${error}`);
      fail(`${stage} failed in ${duration.toFixed(2)}s: ${error}`);
    }
  }

  async function measureCoverage(): Promise<number> {
    const analyses = await analyzeAllDomainsCoverage();
    const totalCoverage = analyses.reduce((sum: number, analysis: any) => sum + analysis.coveragePercentage, 0);
    return totalCoverage / analyses.length;
  }

  async function countQueueItems(status: string): Promise<number> {
    const { count } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    return count || 0;
  }

  async function countPublishedTopics(): Promise<number> {
    const { count } = await supabase
      .from("topics")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");
    return count || 0;
  }

  // Step 1: Measure initial coverage
  await measureStage("Initial Coverage Measurement", async () => {
    metrics.coverageBefore = await measureCoverage();
    console.log(`  Coverage: ${metrics.coverageBefore.toFixed(2)}%`);
  });

  // Step 2: Count initial published topics
  await measureStage("Initial Topic Count", async () => {
    const initialCount = await countPublishedTopics();
    console.log(`  Published topics: ${initialCount}`);
  });

  // Step 3: Queue missing topics
  await measureStage("Queue Missing Topics", async () => {
    await queueAllMissingTopics();
    const pendingCount = await countQueueItems("pending");
    console.log(`  Queued topics: ${pendingCount}`);
  });

  // Step 4: Discover topics
  await measureStage("Topic Discovery", async () => {
    await processDiscoveryQueue();
    const discoveredCount = await countQueueItems("discovered");
    metrics.topicsDiscovered = discoveredCount;
    console.log(`  Discovered: ${discoveredCount}`);
  });

  // Step 5: Assemble Knowledge Packages
  await measureStage("Knowledge Package Generation", async () => {
    await processAssemblyQueue();
    const assembledCount = await countQueueItems("assembled");
    metrics.topicsGenerated = assembledCount;
    console.log(`  Assembled: ${assembledCount}`);
  });

  // Step 6: Render pages
  await measureStage("Page Rendering", async () => {
    await processRenderingQueue();
    const renderedCount = await countQueueItems("rendered");
    console.log(`  Rendered: ${renderedCount}`);
  });

  // Step 7: Publish pages
  await measureStage("Publishing", async () => {
    await processPublishingQueue();
    const finalCount = await countPublishedTopics();
    metrics.topicsPublished = finalCount;
    console.log(`  Published topics: ${finalCount}`);
  });

  // Step 8: Build internal links
  await measureStage("Internal Linking", async () => {
    await buildAllInternalLinks();
    console.log("  Internal links built");
  });

  // Step 9: Update sitemap
  await measureStage("Sitemap Update", async () => {
    await generateSitemap();
    console.log("  Sitemap updated");
  });

  // Step 10: Measure final coverage
  await measureStage("Final Coverage Measurement", async () => {
    metrics.coverageAfter = await measureCoverage();
    const improvement = metrics.coverageAfter - metrics.coverageBefore;
    console.log(`  Coverage: ${metrics.coverageAfter.toFixed(2)}%`);
    console.log(`  Improvement: ${improvement.toFixed(2)}%`);
  });

  // Calculate final metrics
  metrics.endTime = Date.now();
  metrics.averageProcessingTime = (metrics.endTime - metrics.startTime) / 1000;

  // Print results
  h1("Pipeline Validation Results");
  console.log(`Total Time: ${metrics.averageProcessingTime.toFixed(2)}s`);
  console.log(`\nStage Times:`);
  Object.entries(metrics.stageTimes).forEach(([stage, time]) => {
    console.log(`  ${stage}: ${time.toFixed(2)}s`);
  });
  console.log(`\nMetrics:`);
  console.log(`  Topics Discovered: ${metrics.topicsDiscovered}`);
  console.log(`  Topics Generated: ${metrics.topicsGenerated}`);
  console.log(`  Topics Published: ${metrics.topicsPublished}`);
  console.log(`  Coverage Before: ${metrics.coverageBefore.toFixed(2)}%`);
  console.log(`  Coverage After: ${metrics.coverageAfter.toFixed(2)}%`);
  console.log(`  Coverage Improvement: ${(metrics.coverageAfter - metrics.coverageBefore).toFixed(2)}%`);
  console.log(`  Errors: ${metrics.errors.length}`);
  
  if (metrics.errors.length > 0) {
    console.log(`\nErrors:`);
    metrics.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  // Identify bottlenecks
  h1("Bottleneck Analysis");
  const slowStages = Object.entries(metrics.stageTimes)
    .filter(([_, time]) => time > 5)
    .sort((a, b) => b[1] - a[1]);
  
  if (slowStages.length > 0) {
    console.log("\nSlow stages (>5s):");
    slowStages.forEach(([stage, time]) => {
      console.log(`  ${stage}: ${time.toFixed(2)}s`);
    });
  } else {
    console.log("\n✓ All stages completed in acceptable time");
  }

  return metrics;
}

runValidation()
  .then((results) => {
    console.log("\n" + "=".repeat(65));
    console.log("✅ Validation Complete");
    console.log("=".repeat(65));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n" + "=".repeat(65));
    console.error("❌ Validation Failed");
    console.error("=".repeat(65));
    console.error(error);
    process.exit(1);
  });
