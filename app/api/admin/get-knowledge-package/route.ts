/**
 * POST /api/admin/get-knowledge-package
 *
 * Get full knowledge package content including facts and relationships
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrSecret } from "@/lib/api/admin-auth";
import { errorResponse } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createAdminClient();
  const body = await request.json().catch(() => ({})) as { secret?: string; topic_id?: string };

  const denied = await requireAdminOrSecret(body, supabase);
  if (denied) return denied;

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
  } catch (error) {
    return errorResponse(error);
  }
}
