/**
 * POST /api/admin/list-all-topics
 *
 * List all topics with their categories
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
    // Get topics with translations
    const { data: topics, error } = await supabase
      .from("topics")
      .select(`
        *,
        topic_translations (*)
      `)
      .order("slug");

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      total_topics: topics?.length || 0,
      all_topics: topics,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
