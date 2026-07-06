import { runFullPublishingCycle } from "@/services/demand/autonomousPublishingEngine";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await runFullPublishingCycle();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error running pipeline cycle:", error);
    return NextResponse.json(
      { error: "Failed to run pipeline cycle" },
      { status: 500 }
    );
  }
}
