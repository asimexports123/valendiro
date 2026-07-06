import { NextResponse } from "next/server";
import { AgentRegistry } from "@/services/agents/agentRegistry";
import { AgentOrchestrator } from "@/services/agents/agentOrchestrator";
import { SharedMemory } from "@/services/agents/sharedMemory";
import { TaskQueue } from "@/services/agents/taskQueue";
import { AgentCommunication } from "@/services/agents/agentCommunication";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const registry = AgentRegistry.getInstance();
    const orchestrator = new AgentOrchestrator();
    const memory = SharedMemory.getInstance();
    const queue = TaskQueue.getInstance();
    const communication = AgentCommunication.getInstance();

    // Get statistics from all components
    const registryStats = registry.getStatistics();
    const orchestratorStats = orchestrator.getStatistics();
    const memoryStats = memory.getStatistics();
    const queueStats = queue.getStatistics();
    const communicationStats = communication.getStatistics();

    // Get all agents
    const allAgents = Array.from(registry.getAllAgents().values());

    // Get recent tasks
    const recentTasks = queue.getAll().slice(0, 10);

    // Get recent messages
    const recentMessages = communication.getMessages(20);

    // Dashboard data
    const dashboardData = {
      timestamp: new Date().toISOString(),
      
      // Agent status
      agents: {
        total: registryStats.totalAgents,
        byStatus: registryStats.byStatus,
        averageSuccessRate: registryStats.averageSuccessRate,
        averageExecutionTime: registryStats.averageExecutionTime,
        agents: allAgents.map(a => ({
          id: a.agent.id,
          name: a.agent.name,
          purpose: a.agent.purpose,
          status: a.agent.status,
          priority: a.agent.priority,
          executionCount: a.agent.executionCount,
          successRate: a.agent.successRate,
          lastExecution: a.agent.lastExecution,
        })),
      },

      // Task queue
      tasks: {
        total: queueStats.totalTasks,
        byStatus: queueStats.byStatus,
        byType: queueStats.byType,
        averagePriority: queueStats.averagePriority,
        tasksInProgress: queueStats.tasksInProgress,
        completionRate: queueStats.completionRate,
        recentTasks,
      },

      // Execution statistics
      execution: {
        totalExecutions: orchestratorStats.totalExecutions,
        successCount: orchestratorStats.successCount,
        failureCount: orchestratorStats.failureCount,
        successRate: orchestratorStats.successRate,
        averageExecutionTime: orchestratorStats.averageExecutionTime,
        byAgent: orchestratorStats.byAgent,
      },

      // Memory statistics
      memory: {
        totalEntries: memoryStats.totalEntries,
        byType: memoryStats.byType,
        byAgent: memoryStats.byAgent,
        oldestEntry: memoryStats.oldestEntry,
        newestEntry: memoryStats.newestEntry,
      },

      // Communication statistics
      communication: {
        totalMessages: communicationStats.totalMessages,
        byType: communicationStats.byType,
        byAgent: communicationStats.byAgent,
        broadcasts: communicationStats.broadcasts,
        directMessages: communicationStats.directMessages,
        recentMessages,
      },

      // System health
      health: {
        status: "healthy",
        uptime: process.uptime(),
        activeAgents: registryStats.byStatus["running"] || 0,
        failedAgents: registryStats.byStatus["failed"] || 0,
        failedTasks: queueStats.byStatus["failed"] || 0,
        successRate: orchestratorStats.successRate,
      },
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
