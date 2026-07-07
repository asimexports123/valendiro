/**
 * Self-Monitoring and Auto-Recovery Service
 * 
 * Detects broken workers, stalled queues, failed regeneration, dead RSS, expired feeds, duplicate jobs
 * and recovers automatically
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export interface HealthCheckResult {
  componentName: string;
  componentType: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'dead';
  healthScore: number;
  details: any;
}

/**
 * Run comprehensive health check
 */
export async function runHealthCheck(): Promise<HealthCheckResult[]> {
  console.log(`[SelfMonitoring] Running comprehensive health check`);

  const results: HealthCheckResult[] = [];

  // Check discovery sources
  const discoverySourcesHealth = await checkDiscoverySources();
  results.push(...discoverySourcesHealth);

  // Check queues
  const queueHealth = await checkQueues();
  results.push(...queueHealth);

  // Check regeneration jobs
  const regenerationHealth = await checkRegenerationJobs();
  results.push(...regenerationHealth);

  // Check duplicate jobs
  const duplicateJobsHealth = await checkDuplicateJobs();
  results.push(...duplicateJobsHealth);

  // Update system health in database
  await updateSystemHealth(results);

  // Auto-recover from issues
  await autoRecover(results);

  console.log(`[SelfMonitoring] Health check complete. Checked ${results.length} components`);
  return results;
}

/**
 * Check discovery sources health
 */
async function checkDiscoverySources(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  const { data: sources, error } = await supabase
    .from("discovery_sources")
    .select("*");

  if (error) {
    results.push({
      componentName: 'discovery_sources_db',
      componentType: 'database',
      status: 'unhealthy',
      healthScore: 0,
      details: { error: error.message },
    });
    return results;
  }

  let healthyCount = 0;
  let failedCount = 0;

  for (const source of sources || []) {
    if (source.status === 'active') {
      healthyCount++;
    } else if (source.status === 'failed') {
      failedCount++;
    }
  }

  const totalSources = sources?.length || 0;
  const healthScore = totalSources > 0 ? (healthyCount / totalSources) * 100 : 0;
  const status = healthScore > 80 ? 'healthy' : healthScore > 50 ? 'degraded' : 'unhealthy';

  results.push({
    componentName: 'discovery_sources',
    componentType: 'service',
    status,
    healthScore,
    details: { total: totalSources, healthy: healthyCount, failed: failedCount },
  });

  return results;
}

/**
 * Check queue health
 */
async function checkQueues(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // Check discovery queue
  const { data: discoveryQueue } = await supabase
    .from("discovery_queue")
    .select("status")
    .eq("status", "running");

  const { data: regenerationQueue } = await supabase
    .from("content_regeneration_queue")
    .select("status")
    .eq("status", "running");

  // Check for stalled jobs (running for more than 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  const { data: stalledDiscovery } = await supabase
    .from("discovery_queue")
    .select("id")
    .eq("status", "running")
    .lt("started_at", thirtyMinutesAgo);

  const { data: stalledRegeneration } = await supabase
    .from("content_regeneration_queue")
    .select("id")
    .eq("status", "running")
    .lt("started_at", thirtyMinutesAgo);

  const stalledCount = (stalledDiscovery?.length || 0) + (stalledRegeneration?.length || 0);
  const healthScore = stalledCount === 0 ? 100 : Math.max(0, 100 - stalledCount * 20);
  const status = healthScore > 80 ? 'healthy' : healthScore > 50 ? 'degraded' : 'unhealthy';

  results.push({
    componentName: 'queues',
    componentType: 'queue',
    status,
    healthScore,
    details: {
      discoveryRunning: discoveryQueue?.length || 0,
      regenerationRunning: regenerationQueue?.length || 0,
      stalledJobs: stalledCount,
    },
  });

  return results;
}

/**
 * Check regeneration jobs health
 */
async function checkRegenerationJobs(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  const { data: failedJobs } = await supabase
    .from("content_regeneration_queue")
    .select("id")
    .eq("status", "failed");

  const { data: recentJobs } = await supabase
    .from("content_regeneration_queue")
    .select("id, status, completed_at")
    .eq("status", "published")
    .order("completed_at", { ascending: false })
    .limit(10);

  const failedCount = failedJobs?.length || 0;
  const recentSuccessCount = recentJobs?.length || 0;
  
  const healthScore = failedCount === 0 ? 100 : Math.max(0, 100 - failedCount * 10);
  const status = healthScore > 80 ? 'healthy' : healthScore > 50 ? 'degraded' : 'unhealthy';

  results.push({
    componentName: 'regeneration_jobs',
    componentType: 'worker',
    status,
    healthScore,
    details: {
      failed: failedCount,
      recentSuccess: recentSuccessCount,
    },
  });

  return results;
}

/**
 * Check for duplicate jobs
 */
async function checkDuplicateJobs(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // Check for duplicate regeneration jobs for same topic
  const { data: regenerationJobs } = await supabase
    .from("content_regeneration_queue")
    .select("topic_slug, status");

  const topicCounts: Record<string, number> = {};
  for (const job of regenerationJobs || []) {
    const slug = (job as any).topic_slug;
    if (slug) {
      topicCounts[slug] = (topicCounts[slug] || 0) + 1;
    }
  }

  const duplicates = Object.values(topicCounts).filter(count => count > 1);
  const healthScore = duplicates.length === 0 ? 100 : Math.max(0, 100 - duplicates.length * 25);
  const status = healthScore > 80 ? 'healthy' : healthScore > 50 ? 'degraded' : 'unhealthy';

  results.push({
    componentName: 'duplicate_jobs',
    componentType: 'queue',
    status,
    healthScore,
    details: {
      duplicateCount: duplicates.length,
    },
  });

  return results;
}

/**
 * Update system health in database
 */
async function updateSystemHealth(results: HealthCheckResult[]): Promise<void> {
  for (const result of results) {
    const { data: existing } = await supabase
      .from("system_health")
      .select("*")
      .eq("component_name", result.componentName)
      .maybeSingle();

    const updateData: any = {
      status: result.status,
      health_score: result.healthScore,
      details: result.details,
      last_heartbeat_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (result.status === 'healthy') {
      updateData.success_count = (existing?.success_count || 0) + 1;
      updateData.error_count = 0;
      updateData.last_error = null;
    } else {
      updateData.error_count = (existing?.error_count || 0) + 1;
      updateData.last_error = result.details.error || 'Health check failed';
    }

    if (existing) {
      await supabase
        .from("system_health")
        .update(updateData)
        .eq("id", existing.id);
    } else {
      await supabase
        .from("system_health")
        .insert({
          component_name: result.componentName,
          component_type: result.componentType,
          ...updateData,
        });
    }
  }
}

/**
 * Auto-recover from detected issues
 */
async function autoRecover(results: HealthCheckResult[]): Promise<void> {
  console.log(`[SelfMonitoring] Running auto-recovery`);

  for (const result of results) {
    if (result.status === 'unhealthy' || result.status === 'dead') {
      console.log(`[SelfMonitoring] Recovering component: ${result.componentName}`);
      
      switch (result.componentName) {
        case 'queues':
          await recoverStalledJobs();
          break;
        case 'duplicate_jobs':
          await removeDuplicateJobs();
          break;
        case 'discovery_sources':
          await recoverFailedSources();
          break;
        default:
          console.log(`[SelfMonitoring] No auto-recovery action for: ${result.componentName}`);
      }
    }
  }
}

/**
 * Recover stalled jobs
 */
async function recoverStalledJobs(): Promise<void> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Reset stalled discovery jobs
  await supabase
    .from("discovery_queue")
    .update({
      status: 'queued',
      started_at: null,
      error_message: 'Auto-recovered from stalled state',
    })
    .eq("status", "running")
    .lt("started_at", thirtyMinutesAgo);

  // Reset stalled regeneration jobs
  await supabase
    .from("content_regeneration_queue")
    .update({
      status: 'queued',
      started_at: null,
      error_message: 'Auto-recovered from stalled state',
    })
    .eq("status", "running")
    .lt("started_at", thirtyMinutesAgo);

  console.log(`[SelfMonitoring] Recovered stalled jobs`);
}

/**
 * Remove duplicate jobs
 */
async function removeDuplicateJobs(): Promise<void> {
  // Keep only the most recent job for each topic
  const { data: regenerationJobs } = await supabase
    .from("content_regeneration_queue")
    .select("id, topic_slug, queued_at")
    .in("status", ["queued", "running"])
    .order("queued_at", { ascending: false });

  const topicToKeep: Record<string, string> = {};

  for (const job of regenerationJobs || []) {
    const slug = (job as any).topic_slug;
    if (slug && !topicToKeep[slug]) {
      topicToKeep[slug] = job.id;
    } else if (slug) {
      // This is a duplicate, mark as failed
      await supabase
        .from("content_regeneration_queue")
        .update({
          status: 'failed',
          error_message: 'Auto-recovered: Duplicate job removed',
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
  }

  console.log(`[SelfMonitoring] Removed duplicate jobs`);
}

/**
 * Recover failed discovery sources
 */
async function recoverFailedSources(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Reset sources that failed more than an hour ago
  await supabase
    .from("discovery_sources")
    .update({
      status: 'active',
      error_count: 0,
      last_error: null,
    })
    .eq("status", "failed")
    .lt("last_checked_at", oneHourAgo);

  console.log(`[SelfMonitoring] Recovered failed sources`);
}

/**
 * Start continuous monitoring
 */
export function startContinuousMonitoring(intervalMinutes = 5): void {
  console.log(`[SelfMonitoring] Starting continuous monitoring (interval: ${intervalMinutes} minutes)`);

  setInterval(async () => {
    try {
      await runHealthCheck();
    } catch (error) {
      console.error(`[SelfMonitoring] Health check failed:`, error);
    }
  }, intervalMinutes * 60 * 1000);
}
