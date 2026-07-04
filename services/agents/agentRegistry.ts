/**
 * Agent Registry
 *
 * Every agent registers itself with metadata.
 * This is the foundation for the autonomous agent system.
 *
 * Agent Metadata:
 * - Name
 * - Purpose
 * - Input schema
 * - Output schema
 * - Priority
 * - Dependencies
 * - Status
 * - Last execution
 * - Performance metrics
 */

export interface AgentMetadata {
  id: string;
  name: string;
  purpose: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  priority: number; // 1-10, higher = more important
  dependencies: string[]; // IDs of agents this depends on
  status: "idle" | "running" | "success" | "failed" | "paused";
  lastExecution: Date | null;
  executionCount: number;
  averageExecutionTime: number; // in milliseconds
  successRate: number; // 0-1
  lastError: string | null;
  featureFlag: string | null; // Feature flag to enable/disable this agent
}

export interface AgentRegistration {
  agent: AgentMetadata;
  execute: (input: any) => Promise<any>;
}

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentRegistration> = new Map();

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register a new agent
   */
  register(registration: AgentRegistration): void {
    const { id } = registration.agent;
    
    if (this.agents.has(id)) {
      throw new Error(`Agent with id "${id}" already registered`);
    }

    this.agents.set(id, registration);
    console.log(`[Agent Registry] Registered agent: ${registration.agent.name} (${id})`);
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentRegistration | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Map<string, AgentRegistration> {
    return new Map(this.agents);
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentMetadata["status"]): AgentRegistration[] {
    return Array.from(this.agents.values()).filter(
      a => a.agent.status === status
    );
  }

  /**
   * Get agents by priority (highest first)
   */
  getAgentsByPriority(): AgentRegistration[] {
    return Array.from(this.agents.values()).sort(
      (a, b) => b.agent.priority - a.agent.priority
    );
  }

  /**
   * Get agents that are ready to run (idle and dependencies satisfied)
   */
  getReadyAgents(): AgentRegistration[] {
    return Array.from(this.agents.values()).filter(agent => {
      if (agent.agent.status !== "idle") return false;
      
      // Check if all dependencies are satisfied
      for (const depId of agent.agent.dependencies) {
        const depAgent = this.agents.get(depId);
        if (!depAgent || depAgent.agent.status !== "success") {
          return false;
        }
      }

      // Check feature flag
      if (agent.agent.featureFlag) {
        const isEnabled = this.checkFeatureFlag(agent.agent.featureFlag);
        if (!isEnabled) return false;
      }

      return true;
    });
  }

  /**
   * Update agent status
   */
  updateStatus(id: string, status: AgentMetadata["status"]): void {
    const registration = this.agents.get(id);
    if (!registration) {
      throw new Error(`Agent not found: ${id}`);
    }

    registration.agent.status = status;

    if (status === "success" || status === "failed") {
      registration.agent.lastExecution = new Date();
      registration.agent.executionCount++;
    }
  }

  /**
   * Update agent performance metrics
   */
  updatePerformance(
    id: string,
    executionTime: number,
    success: boolean
  ): void {
    const registration = this.agents.get(id);
    if (!registration) {
      throw new Error(`Agent not found: ${id}`);
    }

    const agent = registration.agent;
    
    // Update average execution time (moving average)
    if (agent.executionCount === 0) {
      agent.averageExecutionTime = executionTime;
    } else {
      agent.averageExecutionTime = 
        (agent.averageExecutionTime * 0.9) + (executionTime * 0.1);
    }

    // Update success rate (moving average)
    if (agent.executionCount === 0) {
      agent.successRate = success ? 1 : 0;
    } else {
      agent.successRate = 
        (agent.successRate * 0.9) + ((success ? 1 : 0) * 0.1);
    }

    if (!success) {
      agent.lastError = new Date().toISOString();
    }
  }

  /**
   * Check feature flag
   */
  private checkFeatureFlag(flag: string): boolean {
    const envValue = process.env[flag];
    return envValue === "true" || envValue === "1";
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalAgents: number;
    byStatus: Record<string, number>;
    averageSuccessRate: number;
    averageExecutionTime: number;
  } {
    const agents = Array.from(this.agents.values());
    const byStatus: Record<string, number> = {};

    for (const agent of agents) {
      const status = agent.agent.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    const totalSuccessRate = agents.reduce(
      (sum, a) => sum + a.agent.successRate,
      0
    );
    const totalExecutionTime = agents.reduce(
      (sum, a) => sum + a.agent.averageExecutionTime,
      0
    );

    return {
      totalAgents: agents.length,
      byStatus,
      averageSuccessRate: agents.length > 0 ? totalSuccessRate / agents.length : 0,
      averageExecutionTime: agents.length > 0 ? totalExecutionTime / agents.length : 0,
    };
  }
}
