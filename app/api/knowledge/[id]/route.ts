/**
 * GET /api/knowledge/:id
 *
 * Returns the full Knowledge Package with facts, citations, evidence,
 * provenance, and relationships.
 *
 * Read-only. Renderers and downstream consumers use this endpoint.
 * No mutations allowed — only the Assembler modifies packages.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = createAdminClient();

  // Fetch package
  const { data: pkg, error: pkgErr } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("id", id)
    .single();

  if (pkgErr || !pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  // Fetch facts with evidence + provenance
  const { data: facts } = await sb
    .from("knowledge_facts")
    .select("*, knowledge_evidence(*), knowledge_provenance(*)")
    .eq("package_id", id)
    .order("created_at");

  // Fetch citations
  const { data: citations } = await sb
    .from("knowledge_citations")
    .select("*")
    .eq("package_id", id);

  // Fetch relationships
  const factIds = (facts ?? []).map((f: any) => f.id);
  let relationships: any[] = [];
  if (factIds.length > 0) {
    const { data } = await sb
      .from("knowledge_relationships")
      .select("*")
      .or(`source_id.in.(${factIds.join(",")}),target_id.in.(${factIds.join(",")})`);
    relationships = data ?? [];
  }

  return NextResponse.json({
    package: pkg,
    facts: facts ?? [],
    citations: citations ?? [],
    relationships,
  });
}
