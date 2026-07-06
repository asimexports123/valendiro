"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Database, 
  Layers,
  Activity,
  Play,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  BarChart3
} from "lucide-react";
import Link from "next/link";

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

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [autonomousEnabled, setAutonomousEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

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
      
      // Generate mock recent activity
      setRecentActivity([
        { id: "1", type: "article", message: "New article published: 'Understanding AI'", timestamp: "2 min ago" },
        { id: "2", type: "pipeline", message: "Pipeline cycle completed successfully", timestamp: "15 min ago" },
        { id: "3", type: "source", message: "New RSS source added: TechCrunch", timestamp: "1 hour ago" },
        { id: "4", type: "article", message: "Article approved: 'Machine Learning Basics'", timestamp: "2 hours ago" },
        { id: "5", type: "system", message: "System health check passed", timestamp: "3 hours ago" },
      ]);
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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your knowledge platform</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant={autonomousEnabled ? "danger" : "primary"} 
            onClick={toggleAutonomousPublishing}
          >
            {autonomousEnabled ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Disable Auto-Publish
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Enable Auto-Publish
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={runOneCycle}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Pipeline
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 hover:border-blue-500 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.articlesPublished}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{stats.todayArticles} today
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-green-500 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Publish</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.readyToPublish}</p>
                <p className="text-sm text-gray-500 mt-2">Awaiting approval</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-purple-500 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageEditorialScore}/100</p>
                <p className="text-sm text-gray-500 mt-2">Average rating</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-red-500 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.failed}</p>
                <p className="text-sm text-red-600 mt-2">Needs attention</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/dashboard/articles">
              <Button variant="secondary" className="w-full justify-start h-auto py-4">
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Manage Articles</div>
                  <div className="text-sm text-gray-500">View, edit, delete</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/discovery">
              <Button variant="secondary" className="w-full justify-start h-auto py-4">
                <Database className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Discovery</div>
                  <div className="text-sm text-gray-500">Sources & topics</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/automation">
              <Button variant="secondary" className="w-full justify-start h-auto py-4">
                <Zap className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Automation</div>
                  <div className="text-sm text-gray-500">Pipeline settings</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/system-health">
              <Button variant="secondary" className="w-full justify-start h-auto py-4">
                <BarChart3 className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">System Health</div>
                  <div className="text-sm text-gray-500">Monitor status</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(pipelineStatus).map(([stage, status]) => (
                <div key={stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      status.status === "running" ? "bg-green-500 animate-pulse" :
                      status.status === "waiting" ? "bg-yellow-500" :
                      status.status === "failed" ? "bg-red-500" :
                      "bg-blue-500"
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {stage.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-xs text-gray-500">Queue: {status.queueSize}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status.status === "running" ? "bg-green-100 text-green-700" :
                    status.status === "waiting" ? "bg-yellow-100 text-yellow-700" :
                    status.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {status.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === "article" ? "bg-blue-500" :
                    activity.type === "pipeline" ? "bg-green-500" :
                    activity.type === "source" ? "bg-purple-500" :
                    "bg-gray-500"
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">{activity.message}</div>
                    <div className="text-xs text-gray-500 mt-1">{activity.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.drafts}</div>
              <div className="text-sm text-gray-600 mt-1">Drafts</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.needsReview}</div>
              <div className="text-sm text-gray-600 mt-1">Needs Review</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.knowledgePackages}</div>
              <div className="text-sm text-gray-600 mt-1">Knowledge Packages</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.renderedOutputs}</div>
              <div className="text-sm text-gray-600 mt-1">Rendered Outputs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
