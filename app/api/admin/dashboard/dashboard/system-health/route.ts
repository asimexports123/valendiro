import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  try {
    // Database health check
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from("topics").select("id").limit(1);
    const dbLatency = Date.now() - dbStart;
    const dbHealthy = !dbError;

    // Queue health checks
    const { count: discoveryQueue } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("object_type", "topic")
      .in("status", ["pending", "pending_llm"]);

    const { count: publishingQueue } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("object_type", "article")
      .in("status", ["pending", "pending_llm"]);

    const { count: failedJobs } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    // Worker health (simulated based on recent activity)
    const { data: recentActivity } = await supabase
      .from("articles")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    const workerHealthy = recentActivity && recentActivity.length > 0
      ? Date.now() - new Date(recentActivity[0].updated_at).getTime() < 3600000 // Active within last hour
      : false;

    // Storage health (check if we can access a table)
    const storageHealthy = dbHealthy;

    // Error rate calculation (failed jobs vs total)
    const { count: totalJobs } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true });

    const errorRate = totalJobs && totalJobs > 0
      ? ((failedJobs || 0) / totalJobs) * 100
      : 0;

    const healthData = {
      database: {
        status: dbHealthy ? "healthy" : "unhealthy",
        latency: dbLatency,
        connections: 1, // Simplified
      },
      supabase: {
        status: dbHealthy ? "healthy" : "unhealthy",
        latency: dbLatency,
      },
      storage: {
        status: storageHealthy ? "healthy" : "unhealthy",
        used: 0, // Would need actual storage metrics
        total: 0,
      },
      workers: {
        status: workerHealthy ? "healthy" : "unhealthy",
        active: 4, // Simplified
        total: 4,
      },
      queues: {
        discovery: discoveryQueue || 0,
        publishing: publishingQueue || 0,
        failed: failedJobs || 0,
      },
      system: {
        cpu: 0, // Would need system metrics
        memory: 0, // Would need system metrics
        disk: 0, // Would need system metrics
      },
      metrics: {
        apiResponseTime: dbLatency,
        errorRate: errorRate.toFixed(2),
      },
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error("Error fetching system health:", error);
    return NextResponse.json(
      { error: "Failed to fetch system health" },
      { status: 500 }
    );
  }
}
