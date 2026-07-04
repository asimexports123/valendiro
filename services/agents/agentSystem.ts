/**
 * Agent System Initialization
 *
 * This file initializes the entire AI Agent Framework.
 * It sets up all agents and their connections.
 *
 * Usage:
 * import { initializeAgentSystem } from '@/services/agents/agentSystem';
 * await initializeAgentSystem();
 */

import { ResearchAgent } from "./agents/researchAgent";
import { CoverageAgent } from "./agents/coverageAgent";
import { KnowledgeAcquisitionAgent } from "./agents/knowledgeAcquisitionAgent";
import { KnowledgeGraphAgent } from "./agents/knowledgeGraphAgent";
import { KnowledgeAuthorAgent } from "./agents/knowledgeAuthorAgent";
import { EditorialAgent } from "./agents/editorialAgent";
import { QualityAgent } from "./agents/qualityAgent";
import { ProductionValidationAgent } from "./agents/productionValidationAgent";
import { AnalyticsAgent } from "./agents/analyticsAgent";
import { RoadmapAgent } from "./agents/roadmapAgent";
import { ChiefAIOfficerAgent } from "./agents/chiefAIOfficerAgent";

let initialized = false;

export async function initializeAgentSystem(): Promise<void> {
  if (initialized) {
    console.log("[Agent System] Already initialized");
    return;
  }

  console.log("[Agent System] Initializing AI Agent Framework...");

  // Initialize all agents
  const researchAgent = new ResearchAgent();
  const coverageAgent = new CoverageAgent();
  const knowledgeAcquisitionAgent = new KnowledgeAcquisitionAgent();
  const knowledgeGraphAgent = new KnowledgeGraphAgent();
  const knowledgeAuthorAgent = new KnowledgeAuthorAgent();
  const editorialAgent = new EditorialAgent();
  const qualityAgent = new QualityAgent();
  const productionValidationAgent = new ProductionValidationAgent();
  const analyticsAgent = new AnalyticsAgent();
  const roadmapAgent = new RoadmapAgent();
  const chiefAIOfficerAgent = new ChiefAIOfficerAgent();

  console.log("[Agent System] All agents initialized successfully");
  console.log("[Agent System] Active agents:");
  console.log("  - Research Agent");
  console.log("  - Coverage Agent");
  console.log("  - Knowledge Acquisition Agent");
  console.log("  - Knowledge Graph Agent");
  console.log("  - Knowledge Author Agent");
  console.log("  - Editorial Agent");
  console.log("  - Quality Agent");
  console.log("  - Production Validation Agent");
  console.log("  - Analytics Agent");
  console.log("  - Roadmap Agent");
  console.log("  - Chief AI Officer (Meta Agent)");

  initialized = true;
}

export function isAgentSystemInitialized(): boolean {
  return initialized;
}

export async function startAutonomousWorkflow(): Promise<void> {
  if (!initialized) {
    throw new Error("Agent system not initialized. Call initializeAgentSystem() first.");
  }

  console.log("[Agent System] Starting autonomous workflow...");

  // Schedule initial tasks
  const researchAgent = new ResearchAgent();
  const coverageAgent = new CoverageAgent();
  const chiefAIOfficerAgent = new ChiefAIOfficerAgent();

  // Start with coverage analysis
  coverageAgent.scheduleCoverage({});

  // Start Chief AI Officer health monitoring
  chiefAIOfficerAgent.scheduleHealthCheck({});

  console.log("[Agent System] Autonomous workflow started");
}
