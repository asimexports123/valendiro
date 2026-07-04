"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  timestamp: string;
  agents: {
    total: number;
    byStatus: Record<string, number>;
    averageSuccessRate: number;
    averageExecutionTime: number;
    agents: Array<{
      id: string;
      name: string;
      purpose: string;
      status: string;
      priority: number;
      executionCount: number;
      successRate: number;
      lastExecution: string | null;
    }>;
  };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    averagePriority: number;
    tasksInProgress: number;
    completionRate: number;
    recentTasks: any[];
  };
  execution: {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageExecutionTime: number;
    byAgent: Record<string, any>;
  };
  memory: {
    totalEntries: number;
    byType: Record<string, number>;
    byAgent: Record<string, number>;
    oldestEntry: string | null;
    newestEntry: string | null;
  };
  communication: {
    totalMessages: number;
    byType: Record<string, number>;
    byAgent: Record<string, number>;
    broadcasts: number;
    directMessages: number;
    recentMessages: any[];
  };
  health: {
    status: string;
    uptime: number;
    activeAgents: number;
    failedAgents: number;
    failedTasks: number;
    successRate: number;
  };
}

export default function AgentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch("/api/admin/agent-dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8">No data available</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Valendiro AI Agent Dashboard</h1>
      
      {/* System Health */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">System Health</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className={`font-bold ${data.health.status === "healthy" ? "text-green-600" : "text-red-600"}`}>
              {data.health.status}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Uptime</div>
            <div className="font-bold">{Math.floor(data.health.uptime / 60)}m</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Active Agents</div>
            <div className="font-bold">{data.health.activeAgents}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="font-bold">{(data.health.successRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Agents */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Agents ({data.agents.total})</h2>
          <div className="space-y-2">
            {data.agents.agents.map(agent => (
              <div key={agent.id} className="p-2 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span className="font-medium">{agent.name}</span>
                  <span className={`text-sm ${
                    agent.status === "running" ? "text-green-600" :
                    agent.status === "failed" ? "text-red-600" :
                    agent.status === "success" ? "text-blue-600" :
                    "text-gray-600"
                  }`}>{agent.status}</span>
                </div>
                <div className="text-sm text-gray-600">{agent.purpose}</div>
                <div className="text-xs text-gray-500">
                  Executions: {agent.executionCount} | Success: {(agent.successRate * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Tasks ({data.tasks.total})</h2>
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-2 bg-yellow-50 rounded">
                <div className="text-gray-600">Pending</div>
                <div className="font-bold">{data.tasks.byStatus["pending"] || 0}</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-gray-600">In Progress</div>
                <div className="font-bold">{data.tasks.byStatus["in-progress"] || 0}</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-gray-600">Completed</div>
                <div className="font-bold">{data.tasks.byStatus["completed"] || 0}</div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Completion Rate: {(data.tasks.completionRate * 100).toFixed(1)}%
          </div>
          <div className="space-y-2">
            {data.tasks.recentTasks.slice(0, 5).map(task => (
              <div key={task.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{task.title}</div>
                <div className="text-gray-600">{task.type} - Priority: {task.priority}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Stats */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Execution Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Executions</div>
              <div className="font-bold">{data.execution.totalExecutions}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="font-bold text-green-600">{(data.execution.successRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Execution Time</div>
              <div className="font-bold">{data.execution.averageExecutionTime.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Failures</div>
              <div className="font-bold text-red-600">{data.execution.failureCount}</div>
            </div>
          </div>
        </div>

        {/* Memory Stats */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Shared Memory</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Entries</div>
              <div className="font-bold">{data.memory.totalEntries}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">By Type</div>
              <div className="text-sm">
                {Object.entries(data.memory.byType).map(([type, count]) => (
                  <div key={type}>{type}: {count}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
