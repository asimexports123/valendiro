"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { 
  Zap,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface AutomationStatus {
  enabled: boolean;
  scheduler: {
    interval: string;
    lastRun: string;
    nextRun: string;
  };
  workers: {
    discovery: { status: string; lastActivity: string };
    knowledge: { status: string; lastActivity: string };
    rendering: { status: string; lastActivity: string };
    publishing: { status: string; lastActivity: string };
  };
  queueStats: {
    discovery: number;
    knowledge: number;
    rendering: number;
    publishing: number;
    failed: number;
  };
}

export default function AutomationPage() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [emergencyStop, setEmergencyStop] = useState(false);

  useEffect(() => {
    fetchAutomationStatus();
    const interval = setInterval(fetchAutomationStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAutomationStatus = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/automation/status");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch automation status:", error);
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
      setStatus(prev => prev ? { ...prev, enabled: data.enabled } : null);
    } catch (error) {
      console.error("Failed to toggle autonomous publishing:", error);
    }
  };

  const runOneCycle = async () => {
    try {
      await fetch("/api/admin/dashboard/pipeline/run", {
        method: "POST",
      });
      fetchAutomationStatus();
    } catch (error) {
      console.error("Failed to run pipeline cycle:", error);
    }
  };

  const emergencyStopPipeline = async () => {
    if (!confirm("Are you sure you want to emergency stop the pipeline? This will immediately halt all workers.")) return;
    
    try {
      await fetch("/api/admin/dashboard/automation/emergency-stop", {
        method: "POST",
      });
      setEmergencyStop(true);
      fetchAutomationStatus();
    } catch (error) {
      console.error("Failed to emergency stop:", error);
    }
  };

  const updateScheduler = async (interval: string) => {
    try {
      await fetch("/api/admin/dashboard/automation/scheduler", {
        method: "PATCH",
        body: JSON.stringify({ interval }),
      });
      fetchAutomationStatus();
    } catch (error) {
      console.error("Failed to update scheduler:", error);
    }
  };

  const restartWorker = async (worker: string) => {
    try {
      await fetch(`/api/admin/dashboard/automation/workers/${worker}/restart`, {
        method: "POST",
      });
      fetchAutomationStatus();
    } catch (error) {
      console.error("Failed to restart worker:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Automation Control</h1>
          <p className="text-gray-400 mt-1">Control the autonomous publishing pipeline</p>
        </div>
        {emergencyStop && (
          <Badge className="bg-red-600 animate-pulse">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Emergency Stop Active
          </Badge>
        )}
      </div>

      {/* Master Control */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Master Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-lg font-semibold">
                Autonomous Publishing
              </div>
              <div className="text-gray-400 text-sm mt-1">
                {status?.enabled ? "System is running autonomously" : "System is paused"}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={toggleAutonomousPublishing}
                variant={status?.enabled ? "primary" : "secondary"}
                className={status?.enabled ? "bg-green-600 hover:bg-green-700" : ""}
                size="lg"
              >
                {status?.enabled ? (
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
              <Button onClick={runOneCycle} variant="secondary" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                Run One Cycle
              </Button>
              <Button
                onClick={emergencyStopPipeline}
                variant="danger"
                size="lg"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Stop
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduler */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400">Current Interval</div>
              <div className="text-lg font-bold text-white mt-1">
                {status?.scheduler.interval || "30 min"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Last Run</div>
              <div className="text-lg font-bold text-white mt-1">
                {status?.scheduler.lastRun ? new Date(status.scheduler.lastRun).toLocaleString() : "Never"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Next Run</div>
              <div className="text-lg font-bold text-white mt-1">
                {status?.scheduler.nextRun ? new Date(status.scheduler.nextRun).toLocaleString() : "Not scheduled"}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => updateScheduler("15min")}
            >
              15 min
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateScheduler("30min")}
            >
              30 min
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateScheduler("60min")}
            >
              1 hour
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateScheduler("6hours")}
            >
              6 hours
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateScheduler("24hours")}
            >
              24 hours
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Worker Status */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Worker Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {status?.workers && Object.entries(status.workers).map(([worker, data]) => (
              <div key={worker} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-semibold capitalize">{worker}</div>
                  <Badge variant={
                    data.status === "running" ? "default" :
                    data.status === "stopped" ? "secondary" :
                    "destructive"
                  }>
                    {data.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  Last activity: {data.lastActivity ? new Date(data.lastActivity).toLocaleString() : "Never"}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => restartWorker(worker)}
                  className="w-full"
                >
                  Restart Worker
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Queue Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Discovery Queue</div>
              <div className="text-2xl font-bold text-white mt-1">
                {status?.queueStats.discovery || 0}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Knowledge Queue</div>
              <div className="text-2xl font-bold text-white mt-1">
                {status?.queueStats.knowledge || 0}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Rendering Queue</div>
              <div className="text-2xl font-bold text-white mt-1">
                {status?.queueStats.rendering || 0}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Publishing Queue</div>
              <div className="text-2xl font-bold text-white mt-1">
                {status?.queueStats.publishing || 0}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Failed</div>
              <div className="text-2xl font-bold text-red-500 mt-1">
                {status?.queueStats.failed || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
