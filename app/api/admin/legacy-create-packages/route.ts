/**
 * POST /api/admin/legacy-create-packages
 *
 * Step 3 - Knowledge Package: Create knowledge packages for topics
 * @deprecated Routes through canonical assembler + packageService
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assemble } from "@/services/knowledge/assembler";
import type { CandidateInput } from "@/services/knowledge/types";
import { v4 as uuidv4 } from "uuid";

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
    const { data: articles } = await supabase
      .from("articles")
      .select("id, slug, topic_id, article_translations(title, content)")
      .eq("status", "published")
      .not("topic_id", "is", null);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: "No articles found", created: [] });
    }

    const created: any[] = [];

    for (const article of articles) {
      const { data: existingPkg } = await supabase
        .from("knowledge_packages")
        .select("id")
        .eq("topic_id", article.topic_id)
        .maybeSingle();

      if (existingPkg) {
        created.push({
          article_slug: article.slug,
          status: "already_exists",
          package_id: existingPkg.id,
        });
        continue;
      }

      const title = article.article_translations?.[0]?.title || article.slug;
      const content = article.article_translations?.[0]?.content || "";

      const candidate: CandidateInput = {
        id: uuidv4(),
        title,
        description: content,
        sourceUrl: null,
        discoveryRunId: article.id,
        adapterName: "legacy-admin",
        sourceSlug: article.slug,
        sourceAuthority: "community",
        metadata: { legacyMigration: true },
      };

      try {
        const report = await assemble({
          slotId: null,
          topicId: article.topic_id,
          slug: article.slug,
          candidates: [candidate],
        });

        created.push({
          article_slug: article.slug,
          status: "success",
          package_id: report.packageId,
          via: "canonical-assembler",
        });
      } catch (err) {
        created.push({
          article_slug: article.slug,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const success = created.filter(c => c.status === "success").length;
    const alreadyExists = created.filter(c => c.status === "already_exists").length;
    const failed = created.filter(c => c.status === "failed").length;

    return NextResponse.json({
      success: true,
      summary: { success, alreadyExists, failed, total: created.length },
      created,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
