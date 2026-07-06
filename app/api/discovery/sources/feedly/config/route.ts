/**
 * Feedly Configuration API Route
 * Manages Feedly credentials for discovery
 */

import { NextResponse } from "next/server";
import { createSourceManagementService } from "@/services/discovery/sourceManagement";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, userId } = body;

    if (!accessToken || !refreshToken || !userId) {
      return NextResponse.json(
        { error: "Access token, refresh token, and user ID are required" },
        { status: 400 }
      );
    }

    const sourceManagement = await createSourceManagementService();
    const tokenExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour

    await sourceManagement.configureFeedly({
      accessToken,
      refreshToken,
      tokenExpiresAt,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to configure Feedly:", error);
    return NextResponse.json(
      { error: "Failed to configure Feedly" },
      { status: 500 }
    );
  }
}
