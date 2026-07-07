/**
 * API Route: Content Regeneration
 * 
 * Triggers regeneration for a topic when knowledge package is updated
 * This is the canonical entry point for all regeneration operations
 */

import { NextRequest, NextResponse } from "next/server";
import { queueRegeneration, processRegenerationQueue, getQueueStats, getAllJobs } from "@/services/regeneration/contentRegenerationQueue";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicSlug, reason } = body;

    if (!topicSlug) {
      return NextResponse.json({ error: "topicSlug is required" }, { status: 400 });
    }

    console.log(`[RegenerationAPI] Triggering regeneration for: ${topicSlug}`);

    // Queue the regeneration
    const jobId = await queueRegeneration(topicSlug, reason || "Manual trigger");

    // Process the queue immediately
    await processRegenerationQueue();

    return NextResponse.json({
      success: true,
      jobId,
      topicSlug,
      message: "Regeneration queued and processing started",
    });
  } catch (error: any) {
    console.error("[RegenerationAPI] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      // Get queue statistics
      const stats = await getQueueStats();
      return NextResponse.json(stats);
    }

    if (action === "jobs") {
      // Get all jobs
      const jobs = await getAllJobs(50);
      return NextResponse.json({ jobs });
    }

    // Default: return stats
    const stats = await getQueueStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[RegenerationAPI] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
