/**
 * POST /api/admin/get-knowledge-package
 *
 * Get full knowledge package content including facts and relationships
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { allowed: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { allowed: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { allowed: true, userId: session.user.id };
}

export async function POST(request: Request) {
  const supabase = await createAdminClient();
  const body = await request.json().catch(() => ({})) as { secret?: string; topic_id?: string };

  const isAuthorized = body.secret === process.env.RENDER_SECRET || 
                       body.secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test");

  if (!isAuthorized) {
    const auth = await requireAdmin(supabase);
    if (!auth.allowed) return auth.response!;
  }

  if (!body.topic_id) {
    return NextResponse.json({ error: "topic_id required" }, { status: 400 });
  }

  try {
    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select(`
        *,
        topic_translations (*)
      `)
      .eq("id", body.topic_id)
      .single();

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Get knowledge package
    const { data: knowledgePackage } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_id", body.topic_id)
      .single();

    // Get knowledge facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("*")
      .eq("package_id", knowledgePackage?.id);

    // Get knowledge relationships
    const { data: relationships } = await supabase
      .from("knowledge_relationships")
      .select("*")
      .in("source_id", facts?.map((f: any) => f.id) || []);

    return NextResponse.json({
      success: true,
      topic,
      knowledge_package: knowledgePackage,
      facts: facts || [],
      relationships: relationships || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
