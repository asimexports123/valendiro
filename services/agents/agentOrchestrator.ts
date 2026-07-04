/**
 * Agent Orchestrator
 *
 * Responsible for:
 * - Scheduling agents
 * - Running agents
 * - Passing outputs between agents
 * - Handling failures
 * - Retrying failed tasks
 * - Logging everything
 */

import { AgentRegistry, type AgentRegistration } from "./agentRegistry";

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  success: boolean;
  output: any;
  error: string | null;
  executionTime: number;
  timestamp: Date;
}

export interface OrchestratorConfig {
  maxRetries: number;
  retryDelay: number;
  maxConcurrentAgents: number;
  loggingEnabled: boolean;
}

export class AgentOrchestrator {
  private registry: AgentRegistry;
  private config: OrchestratorConfig;
  private executionHistory: AgentExecutionResult[] = [];
  private isRunning: boolean = false;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.registry = AgentRegistry.getInstance();
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      maxConcurrentAgents: 5,
      loggingEnabled: true,
      ...config,
    };
  }

  /**
   * Run a single agent with retry logic
   */
  async runAgent(agentId: string, input: any): Promise<AgentExecutionResult> {
    const registration = this.registry.getAgent(agentId);
    if (!registration) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const startTime = Date.now();
    let lastError: string | null = null;

    this.log(`Starting agent: ${registration.agent.name} (${agentId})`);
    this.registry.updateStatus(agentId, "running");

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const output = await registration.execute(input);
        const executionTime = Date.now() - startTime;

        this.registry.updateStatus(agentId, "success");
        this.registry.updatePerformance(agentId, executionTime, true);

        const result: AgentExecutionResult = {
          agentId,
          agentName: registration.agent.name,
          success: true,
          output,
          error: null,
          executionTime,
          timestamp: new Date(),
        };

        this.executionHistory.push(result);
        this.log(`Agent succeeded: ${registration.agent.name} (${executionTime}ms)`);

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.log(`Agent attempt ${attempt + 1} failed: ${lastError}`);

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    // All retries failed
    const executionTime = Date.now() - startTime;
    this.registry.updateStatus(agentId, "failed");
    this.registry.updatePerformance(agentId, executionTime, false);

    const result: AgentExecutionResult = {
      agentId,
      agentName: registration.agent.name,
      success: false,
      output: null,
      error: lastError,
      executionTime,
      timestamp: new Date(),
    };

    this.executionHistory.push(result);
    this.log(`Agent failed after ${this.config.maxRetries + 1} attempts: ${registration.agent.name}`);

    return result;
  }

  /**
   * Run the autonomous workflow
   * Automatically picks ready agents and runs them
   */
  async runWorkflow(): Promise<void> {
    if (this.isRunning) {
      this.log("Orchestrator is already running");
      return;
    }

    this.isRunning = true;
    this.log("Starting autonomous workflow");

    try {
      let iterations = 0;
      const maxIterations = 100; // Prevent infinite loops

      while (iterations < maxIterations) {
        iterations++;

        // Get ready agents
        const readyAgents = this.registry.getReadyAgents();

        if (readyAgents.length === 0) {
          this.log("No ready agents, workflow complete");
          break;
        }

        this.log(`Found ${readyAgents.length} ready agents`);

        // Run agents (up to max concurrent)
        const agentsToRun = readyAgents.slice(0, this.config.maxConcurrentAgents);
        const promises = agentsToRun.map(agent =>
          this.runAgent(agent.agent.id, {})
        );

        await Promise.all(promises);
      }

    } finally {
      this.isRunning = false;
      this.log("Workflow complete");
    }
  }

  /**
   * Run a specific sequence of agents
   */
  async runSequence(agentIds: string[]): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = [];
    let currentInput: any = {};

    for (const agentId of agentIds) {
      const result = await this.runAgent(agentId, currentInput);
      results.push(result);

      if (result.success) {
        // Pass output as input to next agent
        currentInput = result.output;
      } else {
        this.log(`Sequence failed at agent: ${agentId}`);
        break;
      }
    }

    return results;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): AgentExecutionResult[] {
    const history = [...this.executionHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageExecutionTime: number;
    byAgent: Record<string, { count: number; successRate: number; avgTime: number }>;
  } {
    const history = this.executionHistory;
    const total = history.length;
    const successCount = history.filter(r => r.success).length;
    const failureCount = total - successCount;

    const totalTime = history.reduce((sum, r) => sum + r.executionTime, 0);

    const byAgent: Record<string, { count: number; successRate: number; avgTime: number }> = {};

    for (const result of history) {
      if (!byAgent[result.agentId]) {
        byAgent[result.agentId] = { count: 0, successRate: 0, avgTime: 0 };
      }

      const stats = byAgent[result.agentId];
      stats.count++;
      stats.successRate = (stats.successRate * (stats.count - 1) + (result.success ? 1 : 0)) / stats.count;
      stats.avgTime = (stats.avgTime * (stats.count - 1) + result.executionTime) / stats.count;
    }

    return {
      totalExecutions: total,
      successCount,
      failureCount,
      successRate: total > 0 ? successCount / total : 0,
      averageExecutionTime: total > 0 ? totalTime / total : 0,
      byAgent,
    };
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.executionHistory = [];
    this.isRunning = false;
    this.log("Orchestrator reset");
  }

  private log(message: string): void {
    if (this.config.loggingEnabled) {
      console.log(`[Agent Orchestrator] ${message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
