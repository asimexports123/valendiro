/**
 * POST /api/admin/inspect-schema
 *
 * Inspect production knowledge_facts table structure and existing data
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrSecret } from "@/lib/api/admin-auth";
import { errorResponse } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createAdminClient();
  const body = await request.json().catch(() => ({})) as { secret?: string };

  const denied = await requireAdminOrSecret(body, supabase);
  if (denied) return denied;

  try {
    // Get sample knowledge facts to understand structure
    const { data: sampleFacts } = await supabase
      .from("knowledge_facts")
      .select("*")
      .limit(5);

    // Get distinct fact_type values
    const { data: factTypes } = await supabase
      .from("knowledge_facts")
      .select("fact_type")
      .not("fact_type", "is", null);

    // Get distinct confidence values
    const { data: confidenceValues } = await supabase
      .from("knowledge_facts")
      .select("confidence")
      .not("confidence", "is", null);

    // Get distinct scope values
    const { data: scopeValues } = await supabase
      .from("knowledge_facts")
      .select("scope")
      .not("scope", "is", null);

    // Count total facts
    const { count: totalFacts } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact", head: true });

    // Get distinct fact types
    const distinctFactTypes = [...new Set(factTypes?.map(f => f.fact_type) || [])];
    const distinctConfidence = [...new Set(confidenceValues?.map(f => f.confidence) || [])];
    const distinctScopes = [...new Set(scopeValues?.map(f => f.scope) || [])];

    return NextResponse.json({
      success: true,
      total_facts: totalFacts,
      distinct_fact_types: distinctFactTypes,
      distinct_confidence_values: distinctConfidence,
      distinct_scopes: distinctScopes,
      sample_facts: sampleFacts,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
