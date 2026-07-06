/**
 * Source Status API Route
 * Manages source status (pause/resume)
 */

import { NextResponse } from "next/server";
import { createSourceManagementService } from "@/services/discovery/sourceManagement";

export async function PATCH(
  request: Request,
  { params }: { params: { sourceId: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;
    const { sourceId } = params;

    if (!status || !["active", "paused"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (active/paused) is required" },
        { status: 400 }
      );
    }

    const sourceManagement = await createSourceManagementService();

    if (status === "active") {
      await sourceManagement.resumeSource(sourceId);
    } else {
      await sourceManagement.pauseSource(sourceId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update source status:", error);
    return NextResponse.json(
      { error: "Failed to update source status" },
      { status: 500 }
    );
  }
}
