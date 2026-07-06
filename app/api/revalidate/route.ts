import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { path } = body;

  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revalidation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
