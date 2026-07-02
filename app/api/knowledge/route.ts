/**
 * GET /api/knowledge
 *
 * Returns all Knowledge Packages (list view).
 * Read-only — downstream consumers use this to discover available packages.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest) {
  const sb = createAdminClient();

  const { data: packages, error } = await sb
    .from("knowledge_packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packages: packages ?? [] });
}
