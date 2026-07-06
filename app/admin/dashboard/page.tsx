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
  indexing: { status: string; queueSize: number; lastExecution: string };
  monitoring: { status: string; queueSize: number; lastExecution: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autonomousEnabled, setAutonomousEnabled] = useState(false);

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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Mission Control Center</h1>
          <p className="text-gray-400 mt-1">Valendiro Autonomous Knowledge Platform</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={toggleAutonomousPublishing}
            variant={autonomousEnabled ? "primary" : "secondary"}
            className={autonomousEnabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {autonomousEnabled ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Autonomous
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Autonomous
              </>
            )}
          </Button>
          <Button onClick={runOneCycle} variant="secondary">
            <RotateCcw className="w-4 h-4 mr-2" />
            Run One Cycle
          </Button>
        </div>
      </div>

      {/* Live Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Articles Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.articlesPublished}</div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.drafts}</div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Ready to Publish</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.readyToPublish}</div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.failed}</div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.needsReview}</div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Knowledge Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.knowledgePackages}</div>
              <Database className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Rendered Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.renderedOutputs}</div>
              <Layers className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Editorial Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.averageEditorialScore.toFixed(1)}</div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Discovery Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.discoveryQueue}</div>
              <Badge variant={stats.discoveryQueue > 0 ? "default" : "secondary"}>
                {stats.discoveryQueue > 0 ? "Processing" : "Empty"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Rendering Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.renderingQueue}</div>
              <Badge variant={stats.renderingQueue > 0 ? "default" : "secondary"}>
                {stats.renderingQueue > 0 ? "Processing" : "Empty"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Publishing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.publishingQueue}</div>
              <Badge variant={stats.publishingQueue > 0 ? "default" : "secondary"}>
                {stats.publishingQueue > 0 ? "Processing" : "Empty"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
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
                <div className="text-sm font-medium text-white capitalize">
                  {stage.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-xs text-gray-400">Queue: {status.queueSize}</div>
                <div className="text-xs text-gray-400">
                  Last: {new Date(status.lastExecution).toLocaleTimeString()}
                </div>
                {stage !== Object.keys(pipelineStatus)[Object.keys(pipelineStatus).length - 1] && (
                  <div className="text-gray-600 text-lg">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Word Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.averageWordCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg References</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.averageReferences}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Internal Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.averageInternalLinks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Reading Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.averageReadingTime}m</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
