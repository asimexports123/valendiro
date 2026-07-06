"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Database, 
  Layers,
  Activity,
  Pause,
  Play,
  RotateCcw
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
  averageWordCount: number;
  averageReferences: number;
  averageInternalLinks: number;
  averageReadingTime: number;
  rssSources: number;
  feedlySources: number;
  officialSources: number;
  governmentSources: number;
  universitySources: number;
  trustedSources: number;
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
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mission Control Center</h1>
        <p className="text-gray-600 mt-2">Autonomous Knowledge Platform Operations</p>
      </div>

      {/* Autonomous Publishing Controls */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Autonomous Publishing</h2>
            <p className="text-sm text-gray-600">Control the autonomous publishing pipeline</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={autonomousEnabled ? "default" : "secondary"}>
              {autonomousEnabled ? "Enabled" : "Disabled"}
            </Badge>
            <Button variant={autonomousEnabled ? "danger" : "primary"} onClick={toggleAutonomousPublishing}>
              {autonomousEnabled ? "Disable" : "Enable"}
            </Button>
            <Button variant="secondary" onClick={runOneCycle}>
              <Play className="w-4 h-4 mr-2" />
              Run One Cycle
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Articles Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.articlesPublished}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.drafts}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Publish</p>
                <p className="text-2xl font-bold text-gray-900">{stats.readyToPublish}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Knowledge Packages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.knowledgePackages}</p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rendered Outputs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.renderedOutputs}</p>
              </div>
              <Layers className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Editorial Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageEditorialScore}/100</p>
              </div>
              <Activity className="w-8 h-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Discovery Queue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.discoveryQueue}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {Object.entries(pipelineStatus).map(([stage, status]) => (
              <div key={stage} className="flex-1 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    status.status === "running" ? "bg-green-500 animate-pulse" :
                    status.status === "waiting" ? "bg-yellow-500" :
                    status.status === "failed" ? "bg-red-500" :
                    "bg-blue-500"
                  }`}></div>
                  <Badge variant={
                    status.status === "running" ? "default" :
                    status.status === "waiting" ? "secondary" :
                    status.status === "failed" ? "destructive" :
                    "outline"
                  }>
                    {status.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {stage.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-xs text-gray-600">Queue: {status.queueSize}</div>
                <div className="text-xs text-gray-600">
                  Last: {new Date(status.lastExecution).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Discovery Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.rssSources}</p>
              <p className="text-sm text-gray-600">RSS Sources</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.feedlySources}</p>
              <p className="text-sm text-gray-600">Feedly Sources</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.officialSources}</p>
              <p className="text-sm text-gray-600">Official Sources</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.governmentSources}</p>
              <p className="text-sm text-gray-600">Government Sources</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.universitySources}</p>
              <p className="text-sm text-gray-600">University Sources</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.trustedSources}</p>
              <p className="text-sm text-gray-600">Trusted Sources</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
