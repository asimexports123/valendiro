import { NextResponse } from "next/server";
import { runAutonomousLearner } from "@/services/learning/autonomousLearner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Run one autonomous learning cycle (production-safe). */
export async function POST() {
  try {
    process.env.ALLOW_RENDER = "true";
    const result = await runAutonomousLearner({ topicLimit: 5 });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Pipeline run error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run cycle" },
      { status: 500 }
    );
  }
}
