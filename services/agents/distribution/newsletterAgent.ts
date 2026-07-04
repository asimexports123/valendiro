/**
 * Newsletter Agent
 *
 * Purpose: Distribute content via newsletter
 *
 * This agent:
 * - Compiles newsletter content
 * - Formats newsletter
 * - Sends to subscribers
 * - Tracks open rates
 * - Tracks click rates
 */

import { AgentRegistry, type AgentMetadata } from "../agentRegistry";
import { SharedMemory } from "../sharedMemory";
import { AgentCommunication } from "../agentCommunication";
import { TaskQueue } from "../taskQueue";

export interface NewsletterInput {
  topic: string;
  category: string;
  content: string;
  schedule?: "immediate" | "weekly" | "monthly";
}

export interface NewsletterOutput {
  topic: string;
  newsletterSent: boolean;
  subscribers: number;
  openRate: number;
  clickRate: number;
  scheduled: boolean;
  scheduledDate?: string;
}

export class NewsletterAgent {
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
    if (this.registry.getAgent("newsletter-agent")) {
      return;
    }

    const metadata: AgentMetadata = {
      id: "newsletter-agent",
      name: "Newsletter Agent",
      purpose: "Distribute content via newsletter",
      inputSchema: {
        topic: "string",
        category: "string",
        content: "string",
        schedule: "string",
      },
      outputSchema: {
        topic: "string",
        newsletterSent: "boolean",
        subscribers: "number",
        openRate: "number",
        clickRate: "number",
        scheduled: "boolean",
        scheduledDate: "string",
      },
      priority: 5,
      dependencies: ["seo-agent"],
      status: "idle",
      lastExecution: null,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastError: null,
      featureFlag: "ENABLE_NEWSLETTER_AGENT",
    };

    this.registry.register({
      agent: metadata,
      execute: (input: NewsletterInput) => this.execute(input),
    });
  }

  async execute(input: NewsletterInput): Promise<NewsletterOutput> {
    console.log("[Newsletter Agent] Starting newsletter distribution for", input.topic);

    const output: NewsletterOutput = {
      topic: input.topic,
      newsletterSent: false,
      subscribers: 0,
      openRate: 0,
      clickRate: 0,
      scheduled: false,
      scheduledDate: undefined,
    };

    this.memory.setKnowledge(`newsletter:${input.topic}`, output, "newsletter-agent");

    console.log("[Newsletter Agent] Newsletter distribution complete", output);

    return output;
  }

  scheduleNewsletter(input: NewsletterInput, priority: number = 55): void {
    this.taskQueue.add({
      type: "newsletter",
      title: `Newsletter: ${input.topic}`,
      description: "Distribute content via newsletter",
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
