/**
 * POST /api/knowledge/assemble
 *
 * Trigger the Knowledge Assembler for a given slug and set of discovery candidates.
 *
 * Body: { slug: string, candidateIds: string[] }
 *
 * The Knowledge Assembler is the ONLY component allowed to create/modify packages.
 * This endpoint enforces that constraint — it is the single entry point for assembly.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assemble } from "@/services/knowledge/assembler";
import { clearGlossaryCache } from "@/services/knowledge/normalizer";
import type { AssemblyInput, CandidateInput } from "@/services/knowledge/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, candidateIds, slotId, topicId } = body as {
      slug: string;
      candidateIds: string[];
      slotId?: string;
      topicId?: string;
    };

    if (!slug || !candidateIds || candidateIds.length === 0) {
      return NextResponse.json(
        { error: "slug and candidateIds[] are required" },
        { status: 400 }
      );
    }

    // Load candidates from discovery_candidates
    const sb = createAdminClient();
    const { data: candidates, error } = await sb
      .from("discovery_candidates")
      .select("*, discovery_runs!inner(id, discovery_sources!inner(adapter_name, slug, source_authority))")
      .in("id", candidateIds);

    if (error || !candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "No candidates found for the given IDs" },
        { status: 404 }
      );
    }

    // Map to CandidateInput
    const assemblyInput: AssemblyInput = {
      slotId: slotId ?? null,
      topicId: topicId ?? null,
      slug,
      candidates: candidates.map((c: any): CandidateInput => ({
        id: c.id,
        title: c.title,
        description: c.description,
        sourceUrl: c.source_url,
        discoveryRunId: c.discovery_run_id,
        adapterName: c.discovery_runs?.discovery_sources?.adapter_name ?? "unknown",
        sourceSlug: c.discovery_runs?.discovery_sources?.slug ?? "unknown",
        sourceAuthority: c.discovery_runs?.discovery_sources?.source_authority ?? "unknown",
        metadata: c.metadata,
      })),
    };

    // Reset glossary cache for fresh assembly
    clearGlossaryCache();

    const report = await assemble(assemblyInput);

    return NextResponse.json({ report });
  } catch (err: any) {
    console.error("Assembly error:", err);
    return NextResponse.json(
      { error: err.message ?? "Assembly failed" },
      { status: 500 }
    );
  }
}
