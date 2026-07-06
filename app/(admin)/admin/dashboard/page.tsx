"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  FileText, 
  CheckCircle, 
  Database, 
  Activity,
  Play,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface DashboardStats {
  articlesPublished: number;
  drafts: number;
  readyToPublish: number;
  failed: number;
  needsReview: number;
  knowledgePackages: number;
  renderedOutputs: number;
  discoveryQueue: number;
  renderingQueue: number;
  publishingQueue: number;
  averageEditorialScore: number;
  totalTopics: number;
  activeSources: number;
  todayArticles: number;
  weeklyGrowth: number;
}

interface PipelineStatus {
  discovery: { status: string; queueSize: number; lastExecution: string };
  knowledgeExtraction: { status: string; queueSize: number; lastExecution: string };
  knowledgePackage: { status: string; queueSize: number; lastExecution: string };
  knowledgeValidation: { status: string; queueSize: number; lastExecution: string };
  rendering: { status: string; queueSize: number; lastExecution: string };
  editorialQA: { status: string; queueSize: number; lastExecution: string };
  publishing: { status: string; queueSize: number; lastExecution: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [autonomousEnabled, setAutonomousEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, pipelineRes, automationRes] = await Promise.all([
        fetch("/api/admin/dashboard/stats"),
        fetch("/api/admin/dashboard/pipeline-status"),
        fetch("/api/admin/dashboard/automation/status"),
      ]);

      const statsData = await statsRes.json();
      const pipelineData = await pipelineRes.json();
      const automationData = await automationRes.json();

      setStats(statsData);
      setPipelineStatus(pipelineData);
      setAutonomousEnabled(automationData.enabled);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutonomousPublishing = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/automation/toggle", {
        method: "POST",
      });
      const data = await res.json();
      setAutonomousEnabled(data.enabled);
    } catch (error) {
      console.error("Failed to toggle autonomous publishing:", error);
    }
  };

  const runOneCycle = async () => {
    try {
      await fetch("/api/admin/dashboard/pipeline/run", {
        method: "POST",
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to run pipeline cycle:", error);
    }
  };

  if (loading || !stats || !pipelineStatus) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Platform Overview</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={autonomousEnabled ? "danger" : "primary"} 
            onClick={toggleAutonomousPublishing}
            size="sm"
          >
            {autonomousEnabled ? "Disable Auto-Publish" : "Enable Auto-Publish"}
          </Button>
          <Button variant="secondary" onClick={runOneCycle} size="sm">
            <Play className="w-4 h-4 mr-2" />
            Run Pipeline
          </Button>
          <Button variant="secondary" onClick={fetchDashboardData} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Articles</p>
                <p className="text-2xl font-bold text-white">{stats.articlesPublished}</p>
                <p className="text-xs text-green-400 mt-1">+{stats.todayArticles} today</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ready to Publish</p>
                <p className="text-2xl font-bold text-white">{stats.readyToPublish}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Quality Score</p>
                <p className="text-2xl font-bold text-white">{stats.averageEditorialScore}/100</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-white text-red-400">{stats.failed}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(pipelineStatus).map(([stage, status]) => (
              <div key={stage} className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  status.status === "running" ? "bg-green-500 animate-pulse" :
                  status.status === "waiting" ? "bg-yellow-500" :
                  status.status === "failed" ? "bg-red-500" :
                  "bg-blue-500"
                }`}></div>
                <div className="text-xs font-medium text-white capitalize mb-1">
                  {stage.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-xs text-gray-400">Queue: {status.queueSize}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
