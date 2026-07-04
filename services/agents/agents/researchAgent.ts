/**
 * Research Agent
 *
 * Purpose: Find trusted knowledge sources
 *
 * This agent:
 * - Scans trusted sources for new topics
 * - Identifies updates to existing topics
 * - Finds better explanations
 * - Discovers new examples
 * - Finds better comparisons
 * - Discovers case studies
 * - Finds practical guidance
 */

import { AgentRegistry, type AgentMetadata } from "../agentRegistry";
import { SharedMemory } from "../sharedMemory";
import { AgentCommunication } from "../agentCommunication";
import { TaskQueue } from "../taskQueue";

export interface ResearchAgentInput {
  topic?: string;
  category?: string;
  searchQuery?: string;
}

export interface ResearchAgentOutput {
  sourcesFound: number;
  topicsDiscovered: number;
  updatesFound: number;
  examplesFound: number;
  sources: Array<{
    url: string;
    title: string;
    authority: number;
    relevance: number;
    type: string;
  }>;
  recommendations: string[];
}

export class ResearchAgent {
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
    // Check if already registered
    if (this.registry.getAgent("research-agent")) {
      return;
    }

    const metadata: AgentMetadata = {
      id: "research-agent",
      name: "Research Agent",
      purpose: "Find trusted knowledge sources and discover new topics, updates, examples, and guidance",
      inputSchema: {
        topic: "string",
        category: "string",
        searchQuery: "string",
      },
      outputSchema: {
        sourcesFound: "number",
        topicsDiscovered: "number",
        updatesFound: "number",
        examplesFound: "number",
        sources: "array",
        recommendations: "array",
      },
      priority: 7,
      dependencies: [],
      status: "idle",
      lastExecution: null,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastError: null,
      featureFlag: "ENABLE_RESEARCH_AGENT",
    };

    this.registry.register({
      agent: metadata,
      execute: (input: ResearchAgentInput) => this.execute(input),
    });

    // Register message handlers
    this.communication.registerHandler(
      "research-agent",
      "research-request",
      async (message) => {
        const result = await this.execute(message.data as ResearchAgentInput);
        await this.communication.send(
          "research-agent",
          message.fromAgentId,
          "research-response",
          result,
          message.correlationId
        );
      }
    );
  }

  async execute(input: ResearchAgentInput): Promise<ResearchAgentOutput> {
    console.log("[Research Agent] Starting research execution", input);

    // TODO: Implement actual research logic
    // This would:
    // 1. Query trusted sources (Wikipedia, official docs, academic papers)
    // 2. Search for the topic/query
    // 3. Analyze source authority
    // 4. Extract relevant information
    // 5. Store findings in shared memory

    // Placeholder implementation
    const output: ResearchAgentOutput = {
      sourcesFound: 0,
      topicsDiscovered: 0,
      updatesFound: 0,
      examplesFound: 0,
      sources: [],
      recommendations: [],
    };

    // Store results in shared memory
    if (input.topic) {
      this.memory.setKnowledge(
        `research:${input.topic}`,
        output,
        "research-agent"
      );
    }

    // Notify other agents about findings
    if (output.topicsDiscovered > 0) {
      await this.communication.broadcast(
        "research-agent",
        "new-topics-discovered",
        {
          topics: output.topicsDiscovered,
          sources: output.sources,
        }
      );
    }

    console.log("[Research Agent] Research execution complete", output);

    return output;
  }

  /**
   * Schedule a research task
   */
  scheduleResearch(input: ResearchAgentInput, priority: number = 50): void {
    this.taskQueue.addResearchTask(
      `Research: ${input.topic || input.searchQuery || "General"}`,
      `Find trusted sources for ${input.topic || input.searchQuery}`,
      input,
      priority
    );
  }
}
