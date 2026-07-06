/**
 * POST /api/admin/improve-knowledge-package
 *
 * Improve knowledge package for pillar pages
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrSecret } from "@/lib/api/admin-auth";
import { errorResponse } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createAdminClient();
  const body = await request.json().catch(() => ({})) as { secret?: string; topic_id?: string; improvements?: any };

  const denied = await requireAdminOrSecret(body, supabase);
  if (denied) return denied;

  if (!body.topic_id) {
    return NextResponse.json({ error: "topic_id required" }, { status: 400 });
  }

  try {
    // Delete existing facts for the package
    const { data: existingPackage } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", body.topic_id)
      .single();

    if (!existingPackage) {
      return NextResponse.json({ error: "Knowledge package not found" }, { status: 404 });
    }

    await supabase
      .from("knowledge_facts")
      .delete()
      .eq("package_id", existingPackage.id);

    const factIds = (await supabase.from("knowledge_facts").select("id").eq("package_id", existingPackage.id)).data?.map((f: any) => f.id) || [];
    if (factIds.length > 0) {
      await supabase
        .from("knowledge_relationships")
        .delete()
        .in("source_id", factIds);
    }

    // Add improved facts
    const improvedFacts = body.improvements.facts || [];
    
    for (const fact of improvedFacts) {
      const { data: newFact } = await supabase
        .from("knowledge_facts")
        .insert({
          package_id: existingPackage.id,
          statement: fact.statement,
          fact_type: fact.fact_type,
          confidence: fact.confidence,
          domain: fact.domain,
          scope: fact.scope,
          tags: fact.tags,
          source_authority: "official",
          extraction_method: "direct_seed",
        })
        .select()
        .single();

      // Add relationships
      if (fact.relationships) {
        for (const rel of fact.relationships) {
          await supabase
            .from("knowledge_relationships")
            .insert({
              source_id: newFact.id,
              target_id: rel.target_id,
              relationship_type: rel.relationship_type,
              strength: rel.strength,
              explanation: rel.explanation,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Knowledge package improved successfully",
      facts_added: improvedFacts.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
