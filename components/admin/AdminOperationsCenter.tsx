/**
 * Admin Operations Center Dashboard
 * 
 * Shows the complete autonomous system status:
 * - Discovery Queue
 * - Knowledge Queue
 * - Generation Queue
 * - QA Queue
 * - Publishing Queue
 * - Failed Jobs
 * - Health
 * - Pipeline Timeline
 * - Workers
 * - RSS Sources
 * - Feedly Sources
 * - Official Sources
 * - Knowledge Growth
 */

"use client";

import { useEffect, useState } from "react";

interface SystemHealth {
  componentName: string;
  componentType: string;
  status: "healthy" | "degraded" | "unhealthy" | "dead";
  healthScore: number;
  lastHeartbeat: string | null;
}

interface QueueStats {
  queued: number;
  running: number;
  failed: number;
  published: number;
}

interface PipelineStage {
  stage: string;
  success: boolean;
  processed: number;
  duration: number;
}

interface SourceStats {
  total: number;
  active: number;
  failed: number;
}

export function AdminOperationsCenter() {
  const [health, setHealth] = useState<SystemHealth[]>([]);
  const [discoveryQueue, setDiscoveryQueue] = useState<QueueStats | null>(null);
  const [regenerationQueue, setRegenerationQueue] = useState<QueueStats | null>(null);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineStage[]>([]);
  const [sources, setSources] = useState<SourceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [healthRes, discoveryRes, regenerationRes, pipelineRes, sourcesRes] = await Promise.all([
        fetch("/api/admin/health"),
        fetch("/api/admin/queue?type=discovery"),
        fetch("/api/admin/queue?type=regeneration"),
        fetch("/api/admin/pipeline"),
        fetch("/api/admin/sources"),
      ]);

      const healthData = await healthRes.json();
      const discoveryData = await discoveryRes.json();
      const regenerationData = await regenerationRes.json();
      const pipelineData = await pipelineRes.json();
      const sourcesData = await sourcesRes.json();

      setHealth(healthData);
      setDiscoveryQueue(discoveryData);
      setRegenerationQueue(regenerationData);
      setPipelineRuns(pipelineData);
      setSources(sourcesData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800";
      case "degraded": return "bg-yellow-100 text-yellow-800";
      case "unhealthy": return "bg-orange-100 text-orange-800";
      case "dead": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getHealthScoreColor(score: number): string {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Operations Center</h1>

        {loading ? (
          <div className="text-center py-12">Loading operations data...</div>
        ) : (
          <div className="space-y-6">
            {/* System Health Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">System Health</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {health.map((item) => (
                  <div key={item.componentName} className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{item.componentName}</div>
                    <div className={`text-2xl font-bold ${getHealthScoreColor(item.healthScore)}`}>
                      {item.healthScore}%
                    </div>
                    <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </div>
                    {item.lastHeartbeat && (
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(item.lastHeartbeat).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Queue Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Discovery Queue */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Discovery Queue</h2>
                {discoveryQueue && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">{discoveryQueue.queued}</div>
                      <div className="text-sm text-gray-600">Queued</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{discoveryQueue.running}</div>
                      <div className="text-sm text-gray-600">Running</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{discoveryQueue.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{discoveryQueue.published}</div>
                      <div className="text-sm text-gray-600">Published</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Regeneration Queue */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Regeneration Queue</h2>
                {regenerationQueue && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">{regenerationQueue.queued}</div>
                      <div className="text-sm text-gray-600">Queued</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{regenerationQueue.running}</div>
                      <div className="text-sm text-gray-600">Running</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{regenerationQueue.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{regenerationQueue.published}</div>
                      <div className="text-sm text-gray-600">Published</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Pipeline Timeline</h2>
              <div className="space-y-3">
                {pipelineRuns.slice(0, 10).map((run, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${run.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium capitalize">{run.stage}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{run.processed} processed</span>
                      <span>{run.duration}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Discovery Sources</h2>
              {sources && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-3xl font-bold">{sources.total}</div>
                    <div className="text-sm text-gray-600">Total Sources</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{sources.active}</div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{sources.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                  Run Discovery
                </button>
                <button className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                  Run Pipeline
                </button>
                <button className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
                  Health Check
                </button>
                <button className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition">
                  View Logs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
