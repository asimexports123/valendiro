/**
 * POST /api/admin/legacy-delete-facts
 *
 * Delete legacy migration facts to re-create them
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
  const body = await request.json().catch(() => ({})) as { secret?: string };

  const isAuthorized = body.secret === process.env.RENDER_SECRET || 
                       body.secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test");

  if (!isAuthorized) {
    const auth = await requireAdmin(supabase);
    if (!auth.allowed) return auth.response!;
  }

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
