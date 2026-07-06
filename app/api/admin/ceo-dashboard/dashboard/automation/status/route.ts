import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  try {
    const { data: settings } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("key", "autonomous_publishing_enabled")
      .single();

    const enabled = settings?.value === "true";

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("Error fetching automation status:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation status" },
      { status: 500 }
    );
  }
}
