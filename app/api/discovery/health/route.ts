/**
 * Discovery Health API Route
 * Returns system health status for the admin interface
 */

import { NextResponse } from "next/server";
import { createDiscoveryMonitoringService } from "@/services/discovery/monitoring";

export async function GET() {
  try {
    const monitoring = await createDiscoveryMonitoringService();
    const health = await monitoring.getSystemHealth();
    
    return NextResponse.json(health);
  } catch (error) {
    console.error("Failed to fetch discovery health:", error);
    return NextResponse.json(
      { error: "Failed to fetch health status" },
      { status: 500 }
    );
  }
}
