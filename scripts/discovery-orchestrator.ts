/**
 * Discovery Orchestrator Script
 * Main orchestration script that runs the entire discovery pipeline continuously
 * 
 * This script:
 * 1. Runs scheduled discoveries from RSS and Feedly sources
 * 2. Queues discovered articles for knowledge extraction
 * 3. Processes knowledge extraction queue
 * 4. Detects topics for discovered articles
 * 5. Queues article regeneration for affected topics
 * 6. Monitors system health and auto-recovers from errors
 * 7. Cleans up stale data
 * 
 * Run this script continuously to enable autonomous knowledge acquisition
 */

import { createDiscoveryScheduler } from "../jobs/schedulers/discoveryScheduler";
import { createTopicDetectionService } from "../services/discovery/topicDetection";
import { createIncrementalRegenerationService } from "../services/discovery/incrementalRegeneration";
import { createDiscoveryMonitoringService } from "../services/discovery/monitoring";

interface OrchestratorConfig {
  discoveryIntervalSeconds: number;
  processingIntervalSeconds: number;
  monitoringIntervalSeconds: number;
  cleanupIntervalSeconds: number;
  batchSize: number;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  discoveryIntervalSeconds: 300, // 5 minutes
  processingIntervalSeconds: 60, // 1 minute
  monitoringIntervalSeconds: 300, // 5 minutes
  cleanupIntervalSeconds: 3600, // 1 hour
  batchSize: 50,
};

class DiscoveryOrchestrator {
  private config: OrchestratorConfig;
  private running = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log("Discovery orchestrator is already running");
      return;
    }

    console.log("Starting Discovery Orchestrator...");
    console.log("Configuration:", JSON.stringify(this.config, null, 2));

    this.running = true;

    // Start discovery loop
    this.intervals.push(
      setInterval(() => this.runDiscoveryCycle(), this.config.discoveryIntervalSeconds * 1000)
    );

    // Start processing loop
    this.intervals.push(
      setInterval(() => this.runProcessingCycle(), this.config.processingIntervalSeconds * 1000)
    );

    // Start monitoring loop
    this.intervals.push(
      setInterval(() => this.runMonitoringCycle(), this.config.monitoringIntervalSeconds * 1000)
    );

    // Start cleanup loop
    this.intervals.push(
      setInterval(() => this.runCleanupCycle(), this.config.cleanupIntervalSeconds * 1000)
    );

    // Run initial cycles
    await Promise.all([
      this.runDiscoveryCycle(),
      this.runProcessingCycle(),
      this.runMonitoringCycle(),
    ]);

    console.log("Discovery Orchestrator started successfully");
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    console.log("Stopping Discovery Orchestrator...");
    this.running = false;

    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    console.log("Discovery Orchestrator stopped");
  }

  public async runDiscoveryCycle(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running discovery cycle...`);

      const scheduler = await createDiscoveryScheduler();
      const results = await scheduler.runScheduledDiscoveries();

      console.log(`Discovery results:`, JSON.stringify(results, null, 2));

      // Update schedules
      await scheduler.updateSchedules();

      // Queue knowledge extraction for new articles
      await scheduler.queueKnowledgeExtraction();

      console.log("Discovery cycle completed successfully");
    } catch (error) {
      console.error("Discovery cycle failed:", error);
    }
  }

  public async runProcessingCycle(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running processing cycle...`);

      // Auto-map articles to topics
      const topicDetection = await createTopicDetectionService();
      const mappingResults = await topicDetection.autoMapArticlesToTopics(this.config.batchSize);
      console.log(`Topic mapping: ${mappingResults.mapped} mapped, ${mappingResults.unmapped} unmapped`);

      // Queue regeneration for topics with new knowledge
      const regeneration = await createIncrementalRegenerationService();
      const regenerationResults = await regeneration.autoQueueRegeneration();
      console.log(`Regeneration: ${regenerationResults.queued} queued, ${regenerationResults.skipped} skipped`);

      // Process regeneration queue
      const processingResults = await regeneration.processRegenerationQueue(Math.floor(this.config.batchSize / 2));
      console.log(`Regeneration processing: ${processingResults.processed} processed, ${processingResults.failed} failed, ${processingResults.skipped} skipped`);

      console.log("Processing cycle completed successfully");
    } catch (error) {
      console.error("Processing cycle failed:", error);
    }
  }

  public async runMonitoringCycle(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running monitoring cycle...`);

      const monitoring = await createDiscoveryMonitoringService();
      const health = await monitoring.getSystemHealth();
      console.log(`System health: ${health.status}`, JSON.stringify(health, null, 2));

      // Record health check
      await monitoring.recordHealthCheck();

      // Auto-recover failed sources if system is degraded
      if (health.status !== "healthy") {
        console.log("System is degraded, attempting auto-recovery...");
        const recoveryResults = await monitoring.autoRecoverFailedSources();
        console.log(`Recovery results: ${recoveryResults.recovered} recovered, ${recoveryResults.failed} failed`);
      }

      console.log("Monitoring cycle completed successfully");
    } catch (error) {
      console.error("Monitoring cycle failed:", error);
    }
  }

  private async runCleanupCycle(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running cleanup cycle...`);

      const monitoring = await createDiscoveryMonitoringService();
      const cleanupResults = await monitoring.cleanupStaleArticles(72); // 72 hours
      console.log(`Cleanup: ${cleanupResults.cleaned} stale articles cleaned`);

      console.log("Cleanup cycle completed successfully");
    } catch (error) {
      console.error("Cleanup cycle failed:", error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const orchestrator = new DiscoveryOrchestrator({
    discoveryIntervalSeconds: parseInt(process.env.DISCOVERY_INTERVAL_SECONDS || "300"),
    processingIntervalSeconds: parseInt(process.env.PROCESSING_INTERVAL_SECONDS || "60"),
    monitoringIntervalSeconds: parseInt(process.env.MONITORING_INTERVAL_SECONDS || "300"),
    cleanupIntervalSeconds: parseInt(process.env.CLEANUP_INTERVAL_SECONDS || "3600"),
    batchSize: parseInt(process.env.BATCH_SIZE || "50"),
  });

  if (command === "start") {
    await orchestrator.start();

    // Keep process alive
    process.on("SIGINT", async () => {
      console.log("Received SIGINT, shutting down...");
      await orchestrator.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Received SIGTERM, shutting down...");
      await orchestrator.stop();
      process.exit(0);
    });
  } else if (command === "once") {
    console.log("Running single cycle...");
    await orchestrator.runDiscoveryCycle();
    await orchestrator.runProcessingCycle();
    await orchestrator.runMonitoringCycle();
    console.log("Single cycle completed");
    process.exit(0);
  } else {
    console.log("Usage: tsx discovery-orchestrator.ts [start|once]");
    console.log("  start  - Run continuously (default)");
    console.log("  once   - Run a single cycle and exit");
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { DiscoveryOrchestrator };
