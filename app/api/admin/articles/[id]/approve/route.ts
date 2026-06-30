import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Allow local dev with pipeline test secret
  const body = await request.json().catch(() => ({})) as { secret?: string };
  const isLocalDev = process.env.NODE_ENV === "development" &&
    body.secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test");

  if (!isLocalDev) {
    // Production: require service role key in Authorization header
    const auth = request.headers.get("authorization") ?? "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!serviceKey || !auth.includes(serviceKey.slice(-10))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  const { data: article, error } = await admin
    .from("articles")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft")
    .select("id, slug, status")
    .single();

  if (error || !article) {
    return NextResponse.json({ error: error?.message ?? "Article not found or not a draft" }, { status: 400 });
  }

  return NextResponse.json({ success: true, article });
}
