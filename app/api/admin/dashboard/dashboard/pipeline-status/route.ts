import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  try {
    // Get queue sizes and last execution times for each pipeline stage
    const now = new Date().toISOString();

    // Discovery stage
    const { count: discoveryQueue } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("object_type", "topic")
      .in("status", ["pending", "pending_llm"]);

    const { data: discoveryCompleted } = await supabase
      .from("content_generation_queue")
      .select("completed_at")
      .eq("object_type", "topic")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1);

    // Knowledge Extraction stage
    const { count: knowledgeQueue } = await supabase
      .from("knowledge_packages")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued");

    const { data: knowledgeCompleted } = await supabase
      .from("knowledge_packages")
      .select("updated_at")
      .eq("status", "ready")
      .order("updated_at", { ascending: false })
      .limit(1);

    // Knowledge Package stage
    const { count: packageQueue } = await supabase
      .from("knowledge_packages")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing");

    // Knowledge Validation stage
    const { count: validationQueue } = await supabase
      .from("knowledge_packages")
      .select("*", { count: "exact", head: true })
      .eq("status", "validating");

    // Rendering stage
    const { count: renderingQueue } = await supabase
      .from("rendered_outputs")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { data: renderingCompleted } = await supabase
      .from("rendered_outputs")
      .select("updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(1);

    // Editorial QA stage
    const { count: qaQueue } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "review");

    const { data: qaCompleted } = await supabase
      .from("articles")
      .select("updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(1);

    // Publishing stage
    const { count: publishingQueue } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("object_type", "article")
      .in("status", ["pending", "pending_llm"]);

    const { data: publishingCompleted } = await supabase
      .from("articles")
      .select("published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1);

    // Indexing stage (simulated based on recent publishes)
    const indexingQueue = 0;
    const indexingLast = publishingCompleted?.[0]?.published_at || now;

    // Monitoring stage
    const monitoringQueue = 0;
    const monitoringLast = now;

    // Determine status based on queue sizes and recent activity
    const getStatus = (queueSize: number, lastExecution: string) => {
      if (queueSize > 0) return "running";
      const timeSince = Date.now() - new Date(lastExecution).getTime();
      if (timeSince > 3600000) return "waiting"; // 1 hour
      return "completed";
    };

    const pipelineStatus = {
      discovery: {
        status: getStatus(discoveryQueue || 0, discoveryCompleted?.[0]?.completed_at || now),
        queueSize: discoveryQueue || 0,
        lastExecution: discoveryCompleted?.[0]?.completed_at || now,
      },
      knowledgeExtraction: {
        status: getStatus(knowledgeQueue || 0, knowledgeCompleted?.[0]?.updated_at || now),
        queueSize: knowledgeQueue || 0,
        lastExecution: knowledgeCompleted?.[0]?.updated_at || now,
      },
      knowledgePackage: {
        status: getStatus(packageQueue || 0, knowledgeCompleted?.[0]?.updated_at || now),
        queueSize: packageQueue || 0,
        lastExecution: knowledgeCompleted?.[0]?.updated_at || now,
      },
      knowledgeValidation: {
        status: getStatus(validationQueue || 0, knowledgeCompleted?.[0]?.updated_at || now),
        queueSize: validationQueue || 0,
        lastExecution: knowledgeCompleted?.[0]?.updated_at || now,
      },
      rendering: {
        status: getStatus(renderingQueue || 0, renderingCompleted?.[0]?.updated_at || now),
        queueSize: renderingQueue || 0,
        lastExecution: renderingCompleted?.[0]?.updated_at || now,
      },
      editorialQA: {
        status: getStatus(qaQueue || 0, qaCompleted?.[0]?.updated_at || now),
        queueSize: qaQueue || 0,
        lastExecution: qaCompleted?.[0]?.updated_at || now,
      },
      publishing: {
        status: getStatus(publishingQueue || 0, publishingCompleted?.[0]?.published_at || now),
        queueSize: publishingQueue || 0,
        lastExecution: publishingCompleted?.[0]?.published_at || now,
      },
      indexing: {
        status: getStatus(indexingQueue, indexingLast),
        queueSize: indexingQueue,
        lastExecution: indexingLast,
      },
      monitoring: {
        status: getStatus(monitoringQueue, monitoringLast),
        queueSize: monitoringQueue,
        lastExecution: monitoringLast,
      },
    };

    return NextResponse.json(pipelineStatus);
  } catch (error) {
    console.error("Error fetching pipeline status:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline status" },
      { status: 500 }
    );
  }
}
