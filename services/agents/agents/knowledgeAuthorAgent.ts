/**
 * Knowledge Author Agent
 *
 * Purpose: Use the new Knowledge Authoring Engine
 *
 * This agent:
 * - Uses the Knowledge Authoring Engine to produce natural, category-aware content
 * - Ensures each category has its own personality
 * - Technology, Finance, Travel, Health, Home, Business and Education never sound identical
 * - Answers reader questions before they are asked
 * - Decides learning journey
 * - Fills knowledge gaps
 * - Applies category personality
 * - Writes in human expert style (no templates)
 * - Decides on visual components
 * - Performs editorial review
 * - Runs final acceptance test
 */

import { AgentRegistry, type AgentMetadata } from "../agentRegistry";
import { SharedMemory } from "../sharedMemory";
import { AgentCommunication } from "../agentCommunication";
import { TaskQueue } from "../taskQueue";
import { KnowledgeAuthoringOrchestrator, type AuthoringContext } from "../../renderer/authoring/knowledgeAuthoringOrchestrator";

export interface KnowledgeAuthorInput {
  topic: string;
  category: string;
  facts: Array<{
    id: string;
    statement: string;
    factType: string;
    confidence: number;
    scope: string;
    tags: string[];
    domain: string;
  }>;
}

export interface KnowledgeAuthorOutput {
  topic: string;
  category: string;
  authoringComplete: boolean;
  passesAllChecks: boolean;
  qualityScore: number;
  acceptanceConfidence: number;
  recommendation: string;
  sections: number;
  readerQuestions: number;
  gapsFilled: number;
  document: {
    introduction: string;
    sections: Array<{
      heading: string;
      content: string;
    }>;
    conclusion: string;
  };
}

export class KnowledgeAuthorAgent {
  private registry: AgentRegistry;
  private memory: SharedMemory;
  private communication: AgentCommunication;
  private taskQueue: TaskQueue;
  private authoringOrchestrator: KnowledgeAuthoringOrchestrator;

  constructor() {
    this.registry = AgentRegistry.getInstance();
    this.memory = SharedMemory.getInstance();
    this.communication = AgentCommunication.getInstance();
    this.taskQueue = TaskQueue.getInstance();
    this.authoringOrchestrator = new KnowledgeAuthoringOrchestrator();

    this.register();
  }

  private register(): void {
    // Check if already registered
    if (this.registry.getAgent("knowledge-author-agent")) {
      return;
    }

    const metadata: AgentMetadata = {
      id: "knowledge-author-agent",
      name: "Knowledge Author Agent",
      purpose: "Use the Knowledge Authoring Engine to produce natural, category-aware content",
      inputSchema: {
        topic: "string",
        category: "string",
        facts: "array",
      },
      outputSchema: {
        topic: "string",
        category: "string",
        authoringComplete: "boolean",
        passesAllChecks: "boolean",
        qualityScore: "number",
        acceptanceConfidence: "number",
        recommendation: "string",
        sections: "number",
        readerQuestions: "number",
        gapsFilled: "number",
        document: "object",
      },
      priority: 10,
      dependencies: ["knowledge-graph-agent"],
      status: "idle",
      lastExecution: null,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastError: null,
      featureFlag: "ENABLE_KNOWLEDGE_AUTHOR_AGENT",
    };

    this.registry.register({
      agent: metadata,
      execute: (input: KnowledgeAuthorInput) => this.execute(input),
    });

    this.communication.registerHandler(
      "knowledge-author-agent",
      "authoring-request",
      async (message) => {
        const result = await this.execute(message.data as KnowledgeAuthorInput);
        await this.communication.send(
          "knowledge-author-agent",
          message.fromAgentId,
          "authoring-response",
          result,
          message.correlationId
        );
      }
    );
  }

  async execute(input: KnowledgeAuthorInput): Promise<KnowledgeAuthorOutput> {
    console.log("[Knowledge Author Agent] Starting authoring for", input.topic);

    // Map input to AuthoringContext
    const context: AuthoringContext = {
      topic: input.topic,
      category: input.category,
      subject: input.category,
      intent: input.category === "travel" ? "guide" as const : "educate" as const,
      complexity: "intermediate",
      facts: input.facts.map(f => ({
        ...f,
        confidence: String(f.confidence),
      })),
    };

    // Run the Knowledge Authoring Engine
    const result = await this.authoringOrchestrator.authorDocument(context);

    // Map result to output
    const output: KnowledgeAuthorOutput = {
      topic: input.topic,
      category: input.category,
      authoringComplete: true,
      passesAllChecks: result.passesAllChecks,
      qualityScore: result.editorialResult.qualityScore,
      acceptanceConfidence: result.acceptanceTest.overallConfidence,
      recommendation: result.acceptanceTest.recommendation,
      sections: result.document.sections.length,
      readerQuestions: result.readerQuestions.length,
      gapsFilled: result.gapCompletion.filledGacts.length,
      document: {
        introduction: result.document.introduction,
        sections: result.document.sections,
        conclusion: result.document.conclusion,
      },
    };

    // Store results in shared memory
    this.memory.setKnowledge(
      `authoring:${input.topic}`,
      output,
      "knowledge-author-agent"
    );

    // Store full authoring result
    this.memory.setKnowledge(
      `authoring:${input.topic}:full`,
      result,
      "knowledge-author-agent"
    );

    // Notify Quality Agent about new content
    if (output.passesAllChecks) {
      await this.communication.send(
        "knowledge-author-agent",
        "quality-agent",
        "new-content-authored",
        {
          topic: input.topic,
          qualityScore: output.qualityScore,
          passesAllChecks: output.passesAllChecks,
        }
      );
    }

    console.log("[Knowledge Author Agent] Authoring complete", output);

    return output;
  }

  /**
   * Schedule an authoring task
   */
  scheduleAuthoring(input: KnowledgeAuthorInput, priority: number = 80): void {
    this.taskQueue.addAuthoringTask(
      `Author Content: ${input.topic}`,
      `Use Knowledge Authoring Engine to write content for ${input.topic}`,
      input,
      priority
    );
  }
}
