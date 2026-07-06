/**
 * POST /api/admin/inspect-facts-detail
 *
 * Inspect detailed structure of production knowledge facts
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
    // Get a working knowledge package with facts
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id, slug")
      .limit(1)
      .maybeSingle();

    if (!pkg) {
      return NextResponse.json({ error: "No knowledge package found" }, { status: 404 });
    }

    // Get all facts for this package
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("*")
      .eq("package_id", pkg.id)
      .limit(10);

    // Get citations for this package
    const { data: citations } = await supabase
      .from("knowledge_citations")
      .select("*")
      .eq("package_id", pkg.id)
      .limit(5);

    // Get distinct source_authority values from all citations
    const { data: allCitations } = await supabase
      .from("knowledge_citations")
      .select("source_authority, extraction_method")
      .limit(100);

    const distinctSourceAuthority = [...new Set(allCitations?.map(c => c.source_authority) || [])];
    const distinctExtractionMethod = [...new Set(allCitations?.map(c => c.extraction_method) || [])];

    return NextResponse.json({
      success: true,
      package: pkg,
      facts,
      citations,
      distinct_source_authority: distinctSourceAuthority,
      distinct_extraction_method: distinctExtractionMethod,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
