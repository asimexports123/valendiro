/**
 * Demonstrate Admin Dashboard with LIVE values
 */

import { createAdminClient } from "../lib/supabase/admin";
import { runHealthCheck } from "../services/monitoring/selfMonitoringService";

const supabase = createAdminClient();

async function demonstrateLiveDashboard() {
  console.log("=" + "=".repeat(79));
  console.log("ADMIN OPERATIONS CENTER - LIVE DASHBOARD");
  console.log("=".repeat(80));
  console.log();

  // System Health
  console.log("LIVE SYSTEM HEALTH");
  console.log("-".repeat(80));
  const health = await runHealthCheck();
  health.forEach(h => {
    const status = h.status.toUpperCase();
    const bar = "█".repeat(Math.floor(h.healthScore / 10)) + "░".repeat(10 - Math.floor(h.healthScore / 10));
    console.log(`  ${h.componentName.padEnd(25)} ${status.padEnd(10)} [${bar}] ${h.healthScore}%`);
  });
  console.log();

  // Discovery Queue
  console.log("LIVE DISCOVERY QUEUE");
  console.log("-".repeat(80));
  const { count: dQueued } = await supabase
    .from("discovery_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");

  const { count: dRunning } = await supabase
    .from("discovery_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "running");

  const { count: dCompleted } = await supabase
    .from("discovery_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  console.log(`  Queued:    ${dQueued || 0}`);
  console.log(`  Running:   ${dRunning || 0}`);
  console.log(`  Completed: ${dCompleted || 0}`);
  console.log();

  // Regeneration Queue
  console.log("LIVE REGENERATION QUEUE");
  console.log("-".repeat(80));
  const { count: rQueued } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");

  const { count: rRunning } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "running");

  const { count: rPublished } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const { count: rFailed } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed");

  console.log(`  Queued:    ${rQueued || 0}`);
  console.log(`  Running:   ${rRunning || 0}`);
  console.log(`  Published: ${rPublished || 0}`);
  console.log(`  Failed:    ${rFailed || 0}`);
  console.log();

  // Recent Regeneration Jobs
  console.log("LIVE REGENERATION JOBS (Last 5)");
  console.log("-".repeat(80));
  const { data: recentJobs } = await supabase
    .from("content_regeneration_queue")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(5);

  if (recentJobs) {
    recentJobs.forEach(job => {
      const slug = (job as any).topic_slug || "unknown";
      const status = job.status.toUpperCase();
      const stage = (job as any).stage || "unknown";
      console.log(`  ${slug.padEnd(30)} ${status.padEnd(10)} Stage: ${stage.padEnd(15)} Progress: ${job.progress}%`);
    });
  }
  console.log();

  // Knowledge Graph
  console.log("LIVE KNOWLEDGE GRAPH");
  console.log("-".repeat(80));
  const { count: nodesCount } = await supabase
    .from("knowledge_graph_nodes")
    .select("id", { count: "exact", head: true });

  const { count: edgesCount } = await supabase
    .from("knowledge_graph_edges")
    .select("id", { count: "exact", head: true });

  console.log(`  Nodes: ${nodesCount || 0}`);
  console.log(`  Edges: ${edgesCount || 0}`);
  console.log();

  // Discovery Sources
  console.log("LIVE DISCOVERY SOURCES");
  console.log("-".repeat(80));
  const { data: sources } = await supabase
    .from("discovery_sources")
    .select("*");

  if (sources) {
    sources.forEach(source => {
      const status = source.status.toUpperCase();
      console.log(`  ${source.name.padEnd(25)} ${status.padEnd(10)} Trust: ${source.trust_score} Discovered: ${source.discovery_count}`);
    });
  }
  console.log();

  // Discovered Content
  console.log("LIVE DISCOVERED CONTENT");
  console.log("-".repeat(80));
  const { count: contentCount } = await supabase
    .from("discovered_content")
    .select("id", { count: "exact", head: true });

  const { count: processedCount } = await supabase
    .from("discovered_content")
    .select("id", { count: "exact", head: true })
    .neq("status", "pending");

  console.log(`  Total Discovered: ${contentCount || 0}`);
  console.log(`  Processed:        ${processedCount || 0}`);
  console.log();

  // Gap Analysis
  console.log("LIVE GAP ANALYSIS");
  console.log("-".repeat(80));
  const { count: gapCount } = await supabase
    .from("gap_analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("action_required", true);

  const { count: gapActioned } = await supabase
    .from("gap_analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("action_taken", true);

  console.log(`  Action Required: ${gapCount || 0}`);
  console.log(`  Action Taken:    ${gapActioned || 0}`);
  console.log();

  console.log("=" + "=".repeat(79));
  console.log("LIVE DASHBOARD END");
  console.log("=".repeat(80));
}

demonstrateLiveDashboard()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
