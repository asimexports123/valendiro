import { buildMissionControlPayload } from "@/services/admin/missionControlPayload";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const payload = await buildMissionControlPayload();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[MissionControl]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load mission control",
        generatedAt: new Date().toISOString(),
        live: false,
      },
      { status: 500 }
    );
  }
}
