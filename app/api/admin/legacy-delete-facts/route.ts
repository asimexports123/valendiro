/**
 * POST /api/admin/legacy-delete-facts
 *
 * Delete legacy migration facts to re-create them
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
    // Get all legacy migration facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("id")
      .contains("tags", ["legacy_migration"]);

    if (!facts || facts.length === 0) {
      return NextResponse.json({ success: true, message: "No legacy facts found", deleted: 0 });
    }

    const factIds = facts.map(f => f.id);
    const { error } = await supabase
      .from("knowledge_facts")
      .delete()
      .in("id", factIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: factIds.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
