import { NextResponse } from "next/server";
import {
  demandPipelineDisabledResponse,
  DEMAND_PIPELINE_FROZEN,
} from "@/lib/architecture/frozen";

/** @deprecated Duplicate of /api/admin/pipeline/run — demand path retired Phase 0 */
export async function POST() {
  if (DEMAND_PIPELINE_FROZEN) {
    return NextResponse.json(demandPipelineDisabledResponse(), { status: 410 });
  }

  try {
    const { runFullPublishingCycle } = await import("@/services/demand/autonomousPublishingEngine");
    const result = await runFullPublishingCycle();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error running pipeline cycle:", error);
    return NextResponse.json(
      { error: "Failed to run pipeline cycle" },
      { status: 500 }
    );
  }
}
