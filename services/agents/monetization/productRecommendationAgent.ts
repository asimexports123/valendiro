/**
 * Product Recommendation Agent
 *
 * Purpose: Recommend relevant products
 *
 * This agent:
 * - Identifies relevant products
 * - Matches products to content
 * - Inserts product recommendations
 * - Tracks product clicks
 * - Calculates conversion rates
 */

import { AgentRegistry, type AgentMetadata } from "../agentRegistry";
import { SharedMemory } from "../sharedMemory";
import { AgentCommunication } from "../agentCommunication";
import { TaskQueue } from "../taskQueue";

export interface ProductRecommendationInput {
  topic: string;
  category: string;
  content: string;
}

export interface ProductRecommendationOutput {
  topic: string;
  productsRecommended: number;
  productsMatched: number;
  clicksTracked: number;
  conversionsTracked: number;
  revenueGenerated: number;
  recommendations: string[];
}

export class ProductRecommendationAgent {
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
    if (this.registry.getAgent("product-recommendation-agent")) {
      return;
    }

    const metadata: AgentMetadata = {
      id: "product-recommendation-agent",
      name: "Product Recommendation Agent",
      purpose: "Recommend relevant products",
      inputSchema: {
        topic: "string",
        category: "string",
        content: "string",
      },
      outputSchema: {
        topic: "string",
        productsRecommended: "number",
        productsMatched: "number",
        clicksTracked: "number",
        conversionsTracked: "number",
        revenueGenerated: "number",
        recommendations: "array",
      },
      priority: 6,
      dependencies: [],
      status: "idle",
      lastExecution: null,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastError: null,
      featureFlag: "ENABLE_PRODUCT_RECOMMENDATION_AGENT",
    };

    this.registry.register({
      agent: metadata,
      execute: (input: ProductRecommendationInput) => this.execute(input),
    });
  }

  async execute(input: ProductRecommendationInput): Promise<ProductRecommendationOutput> {
    console.log("[Product Recommendation Agent] Starting product recommendation for", input.topic);

    const output: ProductRecommendationOutput = {
      topic: input.topic,
      productsRecommended: 0,
      productsMatched: 0,
      clicksTracked: 0,
      conversionsTracked: 0,
      revenueGenerated: 0,
      recommendations: [],
    };

    this.memory.setKnowledge(`product-recommendation:${input.topic}`, output, "product-recommendation-agent");

    console.log("[Product Recommendation Agent] Product recommendation complete", output);

    return output;
  }

  scheduleProductRecommendation(input: ProductRecommendationInput, priority: number = 60): void {
    this.taskQueue.add({
      type: "product-recommendation",
      title: `Product Recommendation: ${input.topic}`,
      description: "Recommend relevant products",
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
