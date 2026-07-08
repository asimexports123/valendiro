import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: Promise<{ worker: string }> }) {
  const { worker } = await ctx.params;
  return NextResponse.json({
    restarted: true,
    worker,
    note: "Serverless workers restart on next cron cycle — no persistent process to restart.",
  });
}
