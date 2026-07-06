/**
 * Auto-Recover API Route
 * Automatically recovers failed sources
 */

import { NextResponse } from "next/server";
import { createDiscoveryMonitoringService } from "@/services/discovery/monitoring";

export async function POST() {
  try {
    const monitoring = await createDiscoveryMonitoringService();
    const result = await monitoring.autoRecoverFailedSources();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to recover sources:", error);
    return NextResponse.json(
      { error: "Failed to recover sources" },
      { status: 500 }
    );
  }
}
