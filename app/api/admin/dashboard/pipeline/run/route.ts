import { NextResponse } from "next/server";
import { gatherCatalogFuelForWeakTopics } from "@/services/discovery/catalogFuelGatherer";
import { publishOriginalCatalogBatch } from "@/services/discovery/catalogOriginalPublish";
import { clearTopicIndexCache } from "@/services/discovery/topicResolver";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Run canonical Brain publish batch (production-safe). */
export async function POST() {
  try {
    process.env.ALLOW_RENDER = "true";
    const fuel = await gatherCatalogFuelForWeakTopics({ topicLimit: 5 });
    clearTopicIndexCache();
    const pub = await publishOriginalCatalogBatch(5);
    return NextResponse.json({ success: true, fuel, publish: pub });
  } catch (error) {
    console.error("Pipeline run error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run cycle" },
      { status: 500 }
    );
  }
}
