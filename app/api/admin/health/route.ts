/**
 * API Route: Admin Health
 * Returns system health status
 */

import { NextRequest, NextResponse } from "next/server";
import { runHealthCheck } from "@/services/monitoring/selfMonitoringService";

export async function GET(request: NextRequest) {
  try {
    const health = await runHealthCheck();
    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
