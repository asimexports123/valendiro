import { createAdminClient } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const interval = String(body.interval ?? "3hours");
    await supabase
      .from("automation_settings")
      .upsert({ key: "scheduler_interval", value: interval }, { onConflict: "key" });
    return NextResponse.json({ interval });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update scheduler" }, { status: 500 });
  }
}
