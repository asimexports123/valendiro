/**
 * Chief AI Officer (Meta Agent)
 *
 * Purpose: Monitor all agents
 *
 * This agent does NOT work on articles.
 * This agent manages other AI agents.
 *
 * This agent:
 * - Monitors if any agent is failing repeatedly
 * - Monitors if quality is improving or declining
 * - Monitors if the Knowledge Graph is weakening
 * - Monitors if traffic opportunities are being missed
 * - Monitors if any agent needs optimization
 * - Provides AI-level management and oversight
 */

import { AgentRegistry, type AgentMetadata } from "../agentRegistry";
import { SharedMemory } from "../sharedMemory";
import { AgentCommunication } from "../agentCommunication";
import { TaskQueue } from "../taskQueue";

export interface ChiefAIInput {
  analysisScope?: "all-agents" | "specific-agent";
  agentId?: string;
  timeframe?: "hourly" | "daily" | "weekly";
}

export interface ChiefAIOutput {
  timestamp: string;
  agentHealth: {
    totalAgents: number;
    healthyAgents: number;
    degradedAgents: number;
    failingAgents: number;
    agentsByStatus: Record<string, number>;
  };
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    successRate: number;
    avgExecutionTime: number;
    executionCount: number;
    trend: "improving" | "stable" | "declining";
    health: "healthy" | "degraded" | "critical";
  }>;
  systemHealth: {
    qualityTrend: "improving" | "stable" | "declining";
    knowledgeGraphHealth: number;
    trafficOpportunities: number;
    missedOpportunities: number;
  };
  alerts: Array<{
    severity: "critical" | "warning" | "info";
    category: string;
    message: string;
    agentId?: string;
    recommendation: string;
  }>;
  recommendations: Array<{
    priority: number;
    action: string;
    reason: string;
    targetAgent?: string;
  }>;
}

export class ChiefAIOfficerAgent {
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
    if (this.registry.getAgent("chief-ai-officer")) {
      return;
    }

    const metadata: AgentMetadata = {
      id: "chief-ai-officer",
      name: "Chief AI Officer (Meta Agent)",
      purpose: "Monitor all agents and provide AI-level management oversight",
      inputSchema: {
        analysisScope: "string",
        agentId: "string",
        timeframe: "string",
      },
      outputSchema: {
        timestamp: "string",
        agentHealth: "object",
        agentPerformance: "array",
        systemHealth: "object",
        alerts: "array",
        recommendations: "array",
      },
      priority: 10,
      dependencies: [], // No dependencies - monitors all agents
      status: "idle",
      lastExecution: null,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastError: null,
      featureFlag: "ENABLE_CHIEF_AI_OFFICER",
    };

    this.registry.register({
      agent: metadata,
      execute: (input: ChiefAIInput) => this.execute(input),
    });

    this.communication.registerHandler(
      "chief-ai-officer",
      "health-check-request",
      async (message) => {
        const result = await this.execute(message.data as ChiefAIInput);
        await this.communication.send(
          "chief-ai-officer",
          message.fromAgentId,
          "health-check-response",
          result,
          message.correlationId
        );
      }
    );

    // Subscribe to all agent messages for monitoring
    this.communication.subscribe("chief-ai-officer", "research-response");
    this.communication.subscribe("chief-ai-officer", "coverage-response");
    this.communication.subscribe("chief-ai-officer", "acquisition-response");
    this.communication.subscribe("chief-ai-officer", "graph-update-response");
    this.communication.subscribe("chief-ai-officer", "authoring-response");
    this.communication.subscribe("chief-ai-officer", "editorial-response");
    this.communication.subscribe("chief-ai-officer", "quality-evaluation-response");
    this.communication.subscribe("chief-ai-officer", "validation-response");
    this.communication.subscribe("chief-ai-officer", "analytics-response");
    this.communication.subscribe("chief-ai-officer", "roadmap-response");
  }

  async execute(input: ChiefAIInput): Promise<ChiefAIOutput> {
    console.log("[Chief AI Officer] Starting health analysis", input);

    // Get all agents from registry
    const allAgents = this.registry.getAllAgents();
    const orchestratorStats = this.registry.getStatistics();

    // Analyze each agent's performance
    const agentPerformance: ChiefAIOutput["agentPerformance"] = [];
    let healthyAgents = 0;
    let degradedAgents = 0;
    let failingAgents = 0;

    for (const [agentId, registration] of allAgents) {
      const agent = registration.agent;
      let health: "healthy" | "degraded" | "critical" = "healthy";
      let trend: "improving" | "stable" | "declining" = "stable";

      // Determine health based on success rate and execution count
      if (agent.executionCount > 10) {
        if (agent.successRate < 0.7) {
          health = "critical";
          failingAgents++;
        } else if (agent.successRate < 0.9) {
          health = "degraded";
          degradedAgents++;
        } else {
          healthyAgents++;
        }

        // Determine trend (simplified - would need historical data)
        if (agent.successRate > 0.95) {
          trend = "improving";
        } else if (agent.successRate < 0.85) {
          trend = "declining";
        }
      } else {
        healthyAgents++; // Not enough data yet
      }

      agentPerformance.push({
        agentId,
        agentName: agent.name,
        successRate: agent.successRate,
        avgExecutionTime: agent.averageExecutionTime,
        executionCount: agent.executionCount,
        trend,
        health,
      });
    }

    // Generate alerts
    const alerts: ChiefAIOutput["alerts"] = [];
    
    for (const perf of agentPerformance) {
      if (perf.health === "critical") {
        alerts.push({
          severity: "critical",
          category: "agent-failure",
          message: `Agent ${perf.agentName} is failing repeatedly (success rate: ${(perf.successRate * 100).toFixed(1)}%)`,
          agentId: perf.agentId,
          recommendation: "Investigate agent logic, check dependencies, review error logs",
        });
      } else if (perf.health === "degraded") {
        alerts.push({
          severity: "warning",
          category: "agent-degradation",
          message: `Agent ${perf.agentName} performance is degrading (success rate: ${(perf.successRate * 100).toFixed(1)}%)`,
          agentId: perf.agentId,
          recommendation: "Monitor closely, investigate recent failures",
        });
      }
    }

    // Generate recommendations
    const recommendations: ChiefAIOutput["recommendations"] = [];
    
    for (const perf of agentPerformance) {
      if (perf.health === "critical") {
        recommendations.push({
          priority: 95,
          action: `Debug and fix ${perf.agentName}`,
          reason: `Critical failure rate of ${(100 - perf.successRate * 100).toFixed(1)}%`,
          targetAgent: perf.agentId,
        });
      } else if (perf.trend === "declining") {
        recommendations.push({
          priority: 75,
          action: `Optimize ${perf.agentName}`,
          reason: "Performance trend is declining",
          targetAgent: perf.agentId,
        });
      }
    }

    const output: ChiefAIOutput = {
      timestamp: new Date().toISOString(),
      agentHealth: {
        totalAgents: allAgents.size,
        healthyAgents,
        degradedAgents,
        failingAgents,
        agentsByStatus: orchestratorStats.byStatus,
      },
      agentPerformance,
      systemHealth: {
        qualityTrend: "stable",
        knowledgeGraphHealth: 100,
        trafficOpportunities: 0,
        missedOpportunities: 0,
      },
      alerts,
      recommendations,
    };

    // Store results in shared memory
    this.memory.setKnowledge(
      "chief-ai-officer:health-report",
      output,
      "chief-ai-officer"
    );

    // Broadcast alerts if critical
    const criticalAlerts = alerts.filter(a => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      await this.communication.broadcast(
        "chief-ai-officer",
        "critical-alerts",
        {
          alerts: criticalAlerts,
          timestamp: output.timestamp,
        }
      );
    }

    console.log("[Chief AI Officer] Health analysis complete", output);

    return output;
  }

  /**
   * Schedule a health check
   */
  scheduleHealthCheck(input: ChiefAIInput, priority: number = 70): void {
    this.taskQueue.add({
      type: "health-check",
      title: `Chief AI Officer Health Check`,
      description: "Monitor all agents and system health",
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
