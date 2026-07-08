import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createAdminClient();
  try {
    await supabase
      .from("automation_settings")
      .upsert({ key: "autonomous_publishing_enabled", value: "false" }, { onConflict: "key" });
    return NextResponse.json({ stopped: true, enabled: false });
  } catch (error) {
    return NextResponse.json({ error: "Failed to emergency stop" }, { status: 500 });
  }
}
