/**
 * Social Distribution Agent
 *
 * Purpose: Distribute content to social platforms
 *
 * This agent:
 * - Posts to Pinterest
 * - Posts to LinkedIn
 * - Posts to X (Twitter)
 * - Optimizes content per platform
 * - Schedules posts
 * - Tracks engagement
 */

import { AgentRegistry, type AgentMetadata } from "../agentRegistry";
import { SharedMemory } from "../sharedMemory";
import { AgentCommunication } from "../agentCommunication";
import { TaskQueue } from "../taskQueue";

export interface SocialDistributionInput {
  topic: string;
  category: string;
  content: string;
  platforms?: ("pinterest" | "linkedin" | "x")[];
  imageUrl?: string;
}

export interface SocialDistributionOutput {
  topic: string;
  platforms: {
    pinterest: { posted: boolean; url?: string; engagement?: number };
    linkedin: { posted: boolean; url?: string; engagement?: number };
    x: { posted: boolean; url?: string; engagement?: number };
  };
  totalPosts: number;
  scheduled: number;
  engagement: number;
}

export class SocialDistributionAgent {
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
    if (this.registry.getAgent("social-distribution-agent")) {
      return;
    }

    const metadata: AgentMetadata = {
      id: "social-distribution-agent",
      name: "Social Distribution Agent",
      purpose: "Distribute content to social platforms",
      inputSchema: {
        topic: "string",
        category: "string",
        content: "string",
        platforms: "array",
        imageUrl: "string",
      },
      outputSchema: {
        topic: "string",
        platforms: "object",
        totalPosts: "number",
        scheduled: "number",
        engagement: "number",
      },
      priority: 6,
      dependencies: ["seo-agent"],
      status: "idle",
      lastExecution: null,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastError: null,
      featureFlag: "ENABLE_SOCIAL_DISTRIBUTION_AGENT",
    };

    this.registry.register({
      agent: metadata,
      execute: (input: SocialDistributionInput) => this.execute(input),
    });

    this.communication.registerHandler(
      "social-distribution-agent",
      "seo-complete",
      async (message) => {
        const result = await this.execute(message.data as SocialDistributionInput);
        await this.communication.send(
          "social-distribution-agent",
          message.fromAgentId,
          "social-distribution-complete",
          result,
          message.correlationId
        );
      }
    );
  }

  async execute(input: SocialDistributionInput): Promise<SocialDistributionOutput> {
    console.log("[Social Distribution Agent] Starting social distribution for", input.topic);

    const platforms = input.platforms || ["pinterest", "linkedin", "x"];

    const output: SocialDistributionOutput = {
      topic: input.topic,
      platforms: {
        pinterest: { posted: false },
        linkedin: { posted: false },
        x: { posted: false },
      },
      totalPosts: 0,
      scheduled: 0,
      engagement: 0,
    };

    this.memory.setKnowledge(`social-distribution:${input.topic}`, output, "social-distribution-agent");

    console.log("[Social Distribution Agent] Social distribution complete", output);

    return output;
  }

  scheduleSocialDistribution(input: SocialDistributionInput, priority: number = 60): void {
    this.taskQueue.add({
      type: "social-distribution",
      title: `Social Distribution: ${input.topic}`,
      description: "Distribute content to social platforms",
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
