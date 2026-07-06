/**
 * Discovery Admin Interface
 * Admin experience for managing discovery sources and monitoring system health
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface DiscoverySource {
  id: string;
  source_type: string;
  name: string;
  url: string | null;
  status: string;
  last_fetched_at: string | null;
  fetch_interval_minutes: number;
  error_count: number;
  last_error: string | null;
  created_at: string;
}

interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  activeSources: number;
  failedSources: number;
  articlesPending: number;
  articlesProcessing: number;
  articlesAcceptedLast24h: number;
  articlesRejectedLast24h: number;
  averageProcessingTime: number;
  errorRate: number;
  lastDiscoveryRun: string | null;
  issues: string[];
}

export default function DiscoveryAdmin() {
  const supabase = createClient();
  const [sources, setSources] = useState<DiscoverySource[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddRSS, setShowAddRSS] = useState(false);
  const [showFeedlyConfig, setShowFeedlyConfig] = useState(false);
  const [newRSSUrl, setNewRSSUrl] = useState("");
  const [newRSSName, setNewRSSName] = useState("");
  const [feedlyAccessToken, setFeedlyAccessToken] = useState("");
  const [feedlyRefreshToken, setFeedlyRefreshToken] = useState("");
  const [feedlyUserId, setFeedlyUserId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sourcesData, healthData] = await Promise.all([
        fetchSources(),
        fetchHealth(),
      ]);
      setSources(sourcesData);
      setHealth(healthData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async (): Promise<DiscoverySource[]> => {
    const { data } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .order("created_at", { ascending: false });
    return data || [];
  };

  const fetchHealth = async (): Promise<SystemHealth | null> => {
    const response = await fetch("/api/discovery/health");
    if (!response.ok) return null;
    return response.json();
  };

  const handleAddRSS = async () => {
    try {
      const response = await fetch("/api/discovery/sources/rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRSSName,
          url: newRSSUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to add RSS source");

      setShowAddRSS(false);
      setNewRSSUrl("");
      setNewRSSName("");
      loadData();
    } catch (error) {
      console.error("Failed to add RSS source:", error);
      alert("Failed to add RSS source");
    }
  };

  const handleConfigureFeedly = async () => {
    try {
      const response = await fetch("/api/discovery/sources/feedly/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: feedlyAccessToken,
          refreshToken: feedlyRefreshToken,
          userId: feedlyUserId,
        }),
      });

      if (!response.ok) throw new Error("Failed to configure Feedly");

      setShowFeedlyConfig(false);
      setFeedlyAccessToken("");
      setFeedlyRefreshToken("");
      setFeedlyUserId("");
      loadData();
    } catch (error) {
      console.error("Failed to configure Feedly:", error);
      alert("Failed to configure Feedly");
    }
  };

  const handleToggleSource = async (sourceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      const response = await fetch(`/api/discovery/sources/${sourceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update source status");
      loadData();
    } catch (error) {
      console.error("Failed to toggle source:", error);
      alert("Failed to update source status");
    }
  };

  const handleRunDiscovery = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/discovery/sources/${sourceId}/run`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to run discovery");
      alert("Discovery run initiated");
    } catch (error) {
      console.error("Failed to run discovery:", error);
      alert("Failed to run discovery");
    }
  };

  const handleAutoRecover = async () => {
    try {
      const response = await fetch("/api/discovery/recover", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to recover sources");
      loadData();
    } catch (error) {
      console.error("Failed to recover sources:", error);
      alert("Failed to recover sources");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600";
      case "paused": return "text-yellow-600";
      case "failed": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800";
      case "degraded": return "bg-yellow-100 text-yellow-800";
      case "unhealthy": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Discovery System Admin</h1>

      {/* System Health */}
      {health && (
        <div className="mb-8 p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">System Health</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(health.status)}`}>
              {health.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Active Sources</div>
              <div className="text-2xl font-bold">{health.activeSources}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Failed Sources</div>
              <div className="text-2xl font-bold text-red-600">{health.failedSources}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Pending Articles</div>
              <div className="text-2xl font-bold">{health.articlesPending}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Accepted (24h)</div>
              <div className="text-2xl font-bold text-green-600">{health.articlesAcceptedLast24h}</div>
            </div>
          </div>
          {health.issues.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">Issues:</div>
              <ul className="list-disc list-inside text-sm text-red-600">
                {health.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={handleAutoRecover}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Auto-Recover Failed Sources
          </button>
        </div>
      )}

      {/* Source Management */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Discovery Sources</h2>
          <div className="space-x-2">
            <button
              onClick={() => setShowAddRSS(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add RSS Feed
            </button>
            <button
              onClick={() => setShowFeedlyConfig(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Configure Feedly
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Last Fetched</th>
                <th className="px-4 py-2 text-left">Errors</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-t">
                  <td className="px-4 py-2">{source.name}</td>
                  <td className="px-4 py-2 capitalize">{source.source_type}</td>
                  <td className="px-4 py-2">
                    <span className={getStatusColor(source.status)}>{source.status}</span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {source.last_fetched_at
                      ? new Date(source.last_fetched_at).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-2">
                    {source.error_count > 0 && (
                      <span className="text-red-600">{source.error_count}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleToggleSource(source.id, source.status)}
                      className="text-blue-600 hover:underline"
                    >
                      {source.status === "active" ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => handleRunDiscovery(source.id)}
                      className="text-green-600 hover:underline"
                    >
                      Run Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add RSS Modal */}
      {showAddRSS && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add RSS Feed</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newRSSName}
                  onChange={(e) => setNewRSSName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="My Tech Blog"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={newRSSUrl}
                  onChange={(e) => setNewRSSUrl(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://example.com/feed.xml"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddRSS(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRSS}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedly Config Modal */}
      {showFeedlyConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Configure Feedly</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Access Token</label>
                <input
                  type="text"
                  value={feedlyAccessToken}
                  onChange={(e) => setFeedlyAccessToken(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Refresh Token</label>
                <input
                  type="text"
                  value={feedlyRefreshToken}
                  onChange={(e) => setFeedlyRefreshToken(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <input
                  type="text"
                  value={feedlyUserId}
                  onChange={(e) => setFeedlyUserId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowFeedlyConfig(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfigureFeedly}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
