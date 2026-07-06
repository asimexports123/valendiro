"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { 
  Globe, 
  Play, 
  Pause, 
  RefreshCw,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Source {
  id: string;
  name: string;
  url: string;
  source_type: string;
  status: string;
  trust_score: number;
  last_fetch: string;
  next_fetch: string;
  articles_discovered: number;
  articles_accepted: number;
  articles_rejected: number;
  failure_count: number;
}

interface DiscoveryData {
  rssSources: Source[];
  feedlySources: Source[];
  officialSources: Source[];
  governmentSources: Source[];
  universitySources: Source[];
}

export default function DiscoveryPage() {
  const [data, setData] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveryData();
    const interval = setInterval(fetchDiscoveryData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDiscoveryData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/discovery/sources");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error("Failed to fetch discovery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const runSourceNow = async (sourceId: string, sourceType: string) => {
    try {
      await fetch(`/api/admin/dashboard/discovery/sources/${sourceId}/run`, {
        method: "POST",
      });
      fetchDiscoveryData();
    } catch (error) {
      console.error("Failed to run source:", error);
    }
  };

  const toggleSource = async (sourceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      await fetch(`/api/admin/dashboard/discovery/sources/${sourceId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDiscoveryData();
    } catch (error) {
      console.error("Failed to toggle source:", error);
    }
  };

  const deleteSource = async (sourceId: string) => {
    try {
      await fetch(`/api/admin/dashboard/discovery/sources/${sourceId}`, {
        method: "DELETE",
      });
      fetchDiscoveryData();
    } catch (error) {
      console.error("Failed to delete source:", error);
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

  const renderSourceCard = (source: Source, type: string) => (
    <Card key={source.id} className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-base">{source.name}</CardTitle>
            <p className="text-sm text-gray-400 mt-1 truncate">{source.url}</p>
          </div>
          <Badge variant={
            source.status === "active" ? "default" :
            source.status === "paused" ? "secondary" :
            "destructive"
          }>
            {source.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-400">Trust Score</div>
            <div className="text-lg font-bold text-white">{source.trust_score}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Discovered</div>
            <div className="text-lg font-bold text-white">{source.articles_discovered}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Accepted</div>
            <div className="text-lg font-bold text-green-500">{source.articles_accepted}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Rejected</div>
            <div className="text-lg font-bold text-red-500">{source.articles_rejected}</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Last: {new Date(source.last_fetch).toLocaleDateString()}
            </span>
            {source.failure_count > 0 && (
              <span className="flex items-center text-red-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                {source.failure_count} failures
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => runSourceNow(source.id, type)}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Run Now
          </Button>
          <Button
            size="sm"
            variant={source.status === "active" ? "secondary" : "default"}
            onClick={() => toggleSource(source.id, source.status)}
          >
            {source.status === "active" ? (
              <>
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Start
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteSource(source.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Discovery</h1>
          <p className="text-gray-400 mt-1">Manage knowledge discovery sources</p>
        </div>
        <Button>
          <Globe className="w-4 h-4 mr-2" />
          Add Source
        </Button>
      </div>

      <div className="space-y-8">
        {/* RSS Sources */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            RSS Sources
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data?.rssSources.map((source) => renderSourceCard(source, "rss"))}
          </div>
        </div>

        {/* Feedly Sources */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Feedly Sources
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data?.feedlySources.map((source) => renderSourceCard(source, "feedly"))}
          </div>
        </div>

        {/* Official Sources */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Official Documentation Sources
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data?.officialSources.map((source) => renderSourceCard(source, "official"))}
          </div>
        </div>

        {/* Government Sources */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Government Sources
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data?.governmentSources.map((source) => renderSourceCard(source, "government"))}
          </div>
        </div>

        {/* University Sources */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            University Sources
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data?.universitySources.map((source) => renderSourceCard(source, "university"))}
          </div>
        </div>
      </div>
    </div>
  );
}
