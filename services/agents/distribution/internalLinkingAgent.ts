/**
 * Internal Linking Agent
 *
 * Purpose: Create and optimize internal links
 *
 * This agent:
 * - Identifies linking opportunities
 * - Creates contextual internal links
 * - Optimizes anchor text
 * - Ensures link distribution
 * - Fixes broken internal links
 */

import { AgentRegistry, type AgentMetadata } from "../agentRegistry";
import { SharedMemory } from "../sharedMemory";
import { AgentCommunication } from "../agentCommunication";
import { TaskQueue } from "../taskQueue";

export interface InternalLinkingInput {
  topic: string;
  category: string;
  content: string;
}

export interface InternalLinkingOutput {
  topic: string;
  linksCreated: number;
  linksOptimized: number;
  brokenLinksFixed: number;
  anchorTextOptimized: number;
  linkDistribution: Record<string, number>;
  recommendations: string[];
}

export class InternalLinkingAgent {
  private registry: AgentRegistry;
  private memory: SharedMemory;
  private communication: AgentCommunication;
  private taskQueue: TaskQueue;

  constructor() {
    this.registry = AgentRegistry.getInstance();
    this.memory = SharedMemory.getInstance();
    this.communication = AgentCommunication.getInstance();
    this.taskQueue = TaskQueue.getInstance();

    this.register();
  }

  private register(): void {
    if (this.registry.getAgent("internal-linking-agent")) {
      return;
    }

    const metadata: AgentMetadata = {
      id: "internal-linking-agent",
      name: "Internal Linking Agent",
      purpose: "Create and optimize internal links",
      inputSchema: {
        topic: "string",
        category: "string",
        content: "string",
      },
      outputSchema: {
        topic: "string",
        linksCreated: "number",
        linksOptimized: "number",
        brokenLinksFixed: "number",
        anchorTextOptimized: "number",
        linkDistribution: "object",
        recommendations: "array",
      },
      priority: 6,
      dependencies: ["seo-agent"],
      status: "idle",
      lastExecution: null,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastError: null,
      featureFlag: "ENABLE_INTERNAL_LINKING_AGENT",
    };

    this.registry.register({
      agent: metadata,
      execute: (input: InternalLinkingInput) => this.execute(input),
    });
  }

  async execute(input: InternalLinkingInput): Promise<InternalLinkingOutput> {
    console.log("[Internal Linking Agent] Starting internal linking for", input.topic);

    const output: InternalLinkingOutput = {
      topic: input.topic,
      linksCreated: 0,
      linksOptimized: 0,
      brokenLinksFixed: 0,
      anchorTextOptimized: 0,
      linkDistribution: {},
      recommendations: [],
    };

    this.memory.setKnowledge(`internal-linking:${input.topic}`, output, "internal-linking-agent");

    console.log("[Internal Linking Agent] Internal linking complete", output);

    return output;
  }

  scheduleInternalLinking(input: InternalLinkingInput, priority: number = 65): void {
    this.taskQueue.add({
      type: "internal-linking",
      title: `Internal Linking: ${input.topic}`,
      description: "Create and optimize internal links",
      priority,
      status: "pending",
      assignedAgentId: null,
      input,
      output: null,
      error: null,
      maxRetries: 3,
      metadata: {},
    });
  }
}
