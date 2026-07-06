"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { 
  Database,
  Server,
  HardDrive,
  Activity,
  Cpu,
  MemoryStick,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface SystemHealthData {
  database: {
    status: string;
    latency: number;
    connections: number;
  };
  supabase: {
    status: string;
    latency: number;
  };
  storage: {
    status: string;
    used: number;
    total: number;
  };
  workers: {
    status: string;
    active: number;
    total: number;
  };
  queues: {
    discovery: number;
    publishing: number;
    failed: number;
  };
  system: {
    cpu: number;
    memory: number;
    disk: number;
  };
  metrics: {
    apiResponseTime: number;
    errorRate: string;
  };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/system-health");
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error("Failed to fetch system health:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-600">Healthy</Badge>;
      case "unhealthy":
        return <Badge className="bg-red-600">Unhealthy</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-600">Degraded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "unhealthy":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-white">System Health</h1>
          <p className="text-gray-400 mt-1">Monitor platform health and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live Monitoring</span>
        </div>
      </div>

      {/* Core Services */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Database
              </CardTitle>
              {health && getStatusIcon(health.database.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                {health && getStatusBadge(health.database.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Latency</span>
                <span className="text-white">{health?.database.latency}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Connections</span>
                <span className="text-white">{health?.database.connections}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Supabase
              </CardTitle>
              {health && getStatusIcon(health.supabase.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                {health && getStatusBadge(health.supabase.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Latency</span>
                <span className="text-white">{health?.supabase.latency}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Region</span>
                <span className="text-white">US-East</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <HardDrive className="w-5 h-5 mr-2" />
                Storage
              </CardTitle>
              {health && getStatusIcon(health.storage.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                {health && getStatusBadge(health.storage.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Used</span>
                <span className="text-white">{health?.storage.used} GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total</span>
                <span className="text-white">{health?.storage.total} GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Workers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Discovery Worker</span>
                {health && getStatusIcon(health.workers.status)}
              </div>
              <div className="text-sm text-gray-400">
                Active: {health?.workers.active}/{health?.workers.total}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Rendering Worker</span>
                {health && getStatusIcon(health.workers.status)}
              </div>
              <div className="text-sm text-gray-400">
                Active: {health?.workers.active}/{health?.workers.total}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Publishing Worker</span>
                {health && getStatusIcon(health.workers.status)}
              </div>
              <div className="text-sm text-gray-400">
                Active: {health?.workers.active}/{health?.workers.total}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {health?.system.cpu}%
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {health?.system.cpu > 80 ? "High" : health?.system.cpu > 50 ? "Moderate" : "Normal"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center">
              <MemoryStick className="w-5 h-5 mr-2" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {health?.system.memory}%
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {health?.system.memory > 80 ? "High" : health?.system.memory > 50 ? "Moderate" : "Normal"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              API Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {health?.metrics.apiResponseTime}ms
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {health?.metrics.apiResponseTime > 500 ? "Slow" : health?.metrics.apiResponseTime > 200 ? "Moderate" : "Fast"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Health */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Queue Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Discovery Queue</div>
              <div className="text-2xl font-bold text-white mt-1">
                {health?.queues.discovery}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Publishing Queue</div>
              <div className="text-2xl font-bold text-white mt-1">
                {health?.queues.publishing}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Failed Jobs</div>
              <div className="text-2xl font-bold text-red-500 mt-1">
                {health?.queues.failed}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Error Rate</span>
              <span className="text-white font-semibold">{health?.metrics.errorRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
