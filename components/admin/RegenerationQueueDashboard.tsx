/**
 * Admin UI: Regeneration Queue Dashboard
 * 
 * Shows queue status, running jobs, completed jobs, failed jobs,
 * current pipeline stage, estimated remaining time, and logs
 */

"use client";

import { useEffect, useState } from "react";

interface QueueStats {
  queued: number;
  running: number;
  failed: number;
  published: number;
  currentStage: string | null;
  estimatedRemainingSeconds: number | null;
  lastPublished: string | null;
}

interface RegenerationJob {
  id: string;
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  status: "queued" | "running" | "failed" | "published";
  stage: string;
  progress: number;
  logs: string[];
  error: string | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedRemainingSeconds: number | null;
}

export function RegenerationQueueDashboard() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<RegenerationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<RegenerationJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        fetch("/api/regeneration?action=stats"),
        fetch("/api/regeneration?action=jobs"),
      ]);

      const statsData = await statsRes.json();
      const jobsData = await jobsRes.json();

      setStats(statsData);
      setJobs(jobsData.jobs || []);
    } catch (error) {
      console.error("Failed to fetch queue data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "queued": return "bg-yellow-100 text-yellow-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      case "published": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function formatTime(timestamp: string | null): string {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Content Regeneration Queue</h2>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Queue Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{stats?.queued || 0}</div>
              <div className="text-sm text-yellow-700">Queued</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats?.running || 0}</div>
              <div className="text-sm text-blue-700">Running</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats?.published || 0}</div>
              <div className="text-sm text-green-700">Published</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{stats?.failed || 0}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
          </div>

          {/* Current Pipeline Stage */}
          {stats?.currentStage && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-semibold text-blue-700">Current Pipeline Stage</div>
              <div className="text-lg font-bold text-blue-900">{stats.currentStage}</div>
              {stats.estimatedRemainingSeconds && (
                <div className="text-sm text-blue-600">
                  Estimated remaining: {formatDuration(stats.estimatedRemainingSeconds)}
                </div>
              )}
            </div>
          )}

          {/* Last Published */}
          {stats?.lastPublished && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-semibold text-green-700">Last Published</div>
              <div className="text-sm text-green-900">{formatTime(stats.lastPublished)}</div>
            </div>
          )}

          {/* Jobs List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
            <div className="space-y-2">
              {jobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{job.topicTitle}</div>
                      <div className="text-sm text-gray-600">{job.topicSlug}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      {job.progress > 0 && (
                        <div className="text-sm text-gray-600">{job.progress}%</div>
                      )}
                    </div>
                  </div>
                  {job.stage && (
                    <div className="text-sm text-gray-500 mt-2">Stage: {job.stage}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Job Details Modal */}
          {selectedJob && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{selectedJob.topicTitle}</h3>
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold inline-block ${getStatusColor(selectedJob.status)}`}>
                          {selectedJob.status}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Progress</div>
                        <div className="font-semibold">{selectedJob.progress}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Stage</div>
                        <div className="font-semibold">{selectedJob.stage}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Queued At</div>
                        <div className="font-semibold">{formatTime(selectedJob.queuedAt)}</div>
                      </div>
                      {selectedJob.startedAt && (
                        <div>
                          <div className="text-sm text-gray-600">Started At</div>
                          <div className="font-semibold">{formatTime(selectedJob.startedAt)}</div>
                        </div>
                      )}
                      {selectedJob.completedAt && (
                        <div>
                          <div className="text-sm text-gray-600">Completed At</div>
                          <div className="font-semibold">{formatTime(selectedJob.completedAt)}</div>
                        </div>
                      )}
                    </div>

                    {selectedJob.error && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="text-sm font-semibold text-red-700">Error</div>
                        <div className="text-sm text-red-900 mt-1">{selectedJob.error}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-semibold mb-2">Logs</div>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-auto">
                        {selectedJob.logs.map((log, index) => (
                          <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
