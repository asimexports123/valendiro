import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createAdminClient();

  try {
    // Get current automation status
    const { data: settings } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("key", "autonomous_publishing_enabled")
      .single();

    const currentStatus = settings?.value === "true";
    const newStatus = !currentStatus;

    // Update automation status
    if (settings) {
      await supabase
        .from("automation_settings")
        .update({ value: newStatus ? "true" : "false" })
        .eq("key", "autonomous_publishing_enabled");
    } else {
      await supabase
        .from("automation_settings")
        .insert({
          key: "autonomous_publishing_enabled",
          value: newStatus ? "true" : "false",
        });
    }

    return NextResponse.json({ enabled: newStatus });
  } catch (error) {
    console.error("Error toggling autonomous publishing:", error);
    return NextResponse.json(
      { error: "Failed to toggle autonomous publishing" },
      { status: 500 }
    );
  }
}
