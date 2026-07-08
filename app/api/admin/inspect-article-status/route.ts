/**
 * POST /api/admin/inspect-article-status
 *
 * Inspect valid status values for articles table
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
    const { data: articles } = await supabase
      .from("articles")
      .select("status")
      .limit(1000);

    const distinctStatus = [...new Set(articles?.map(a => a.status) || [])];

    return NextResponse.json({
      success: true,
      distinct_status: distinctStatus,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
