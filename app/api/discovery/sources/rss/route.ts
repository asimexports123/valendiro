/**
 * RSS Sources API Route
 * Manages RSS feed sources for discovery
 */

import { NextResponse } from "next/server";
import { createSourceManagementService } from "@/services/discovery/sourceManagement";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    const sourceManagement = await createSourceManagementService();
    const source = await sourceManagement.addRSSSource({ name, url });

    return NextResponse.json(source);
  } catch (error) {
    console.error("Failed to add RSS source:", error);
    return NextResponse.json(
      { error: "Failed to add RSS source" },
      { status: 500 }
    );
  }
}
