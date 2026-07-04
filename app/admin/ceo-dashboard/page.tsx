"use client";

import { useEffect, useState } from "react";

interface CEODashboardData {
  timestamp: string;
  knowledgeCoverage: any;
  categoryHealth: any;
  revenue: any;
  traffic: any;
  quality: any;
  production: any;
  aiWorkforce: any;
  queue: any;
  growth: any;
  monetization: any;
  distribution: any;
  analytics: any;
  experiments: any;
  policies: any;
  businessGoals: any;
}

export default function CEODashboard() {
  const [data, setData] = useState<CEODashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch("/api/admin/ceo-dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const dashboardData = await response.json();
      setData(dashboardData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading CEO Dashboard...</div>;
  if (!data) return <div className="p-8">No data available</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Valendiro CEO Dashboard</h1>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-bold">${data.revenue.totalRevenue}</div>
          <div className="text-xs text-gray-500">Trend: {data.revenue.revenueTrend}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600">Page Views</div>
          <div className="text-2xl font-bold">{data.traffic.pageViews}</div>
          <div className="text-xs text-gray-500">Unique: {data.traffic.uniqueVisitors}</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-gray-600">Quality Score</div>
          <div className="text-2xl font-bold">{data.quality.averageQualityScore}/100</div>
          <div className="text-xs text-gray-500">Status: {data.quality.overallQuality}</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="text-sm text-gray-600">AI Agents</div>
          <div className="text-2xl font-bold">{data.aiWorkforce.totalAgents}</div>
          <div className="text-xs text-gray-500">Healthy: {data.aiWorkforce.healthyAgents}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">AI Workforce</h2>
          <div className="space-y-2">
            {data.aiWorkforce.agents.map((agent: any) => (
              <div key={agent.id} className="p-2 bg-gray-50 rounded flex justify-between">
                <span>{agent.name}</span>
                <span className={`text-sm ${
                  agent.status === "running" ? "text-green-600" :
                  agent.status === "failed" ? "text-red-600" :
                  "text-gray-600"
                }`}>{agent.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Task Queue</h2>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-yellow-50 rounded">
              <div className="text-gray-600">Pending</div>
              <div className="font-bold">{data.queue.pendingTasks}</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-gray-600">In Progress</div>
              <div className="font-bold">{data.queue.inProgressTasks}</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="text-gray-600">Completed</div>
              <div className="font-bold">{data.queue.completedTasks}</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Completion Rate: {(data.queue.completionRate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Revenue by Source</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Affiliate</span>
              <span>${data.revenue.revenueBySource.affiliate}</span>
            </div>
            <div className="flex justify-between">
              <span>Ads</span>
              <span>${data.revenue.revenueBySource.ads}</span>
            </div>
            <div className="flex justify-between">
              <span>Products</span>
              <span>${data.revenue.revenueBySource.products}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Business Goals</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm">
                <span>Monthly Revenue</span>
                <span>${data.businessGoals.monthlyRevenue.current} / ${data.businessGoals.monthlyRevenue.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${data.businessGoals.monthlyRevenue.progress}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Monthly Traffic</span>
                <span>{data.businessGoals.monthlyTraffic.current} / {data.businessGoals.monthlyTraffic.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${data.businessGoals.monthlyTraffic.progress}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Quality Score</span>
                <span>{data.businessGoals.qualityScore.current} / {data.businessGoals.qualityScore.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.businessGoals.qualityScore.progress}%` }}></div>
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
