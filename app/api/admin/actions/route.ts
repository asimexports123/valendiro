import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFullPublishingCycle, publishApprovedTopics, publishApprovedArticles } from "@/services/demand/autonomousPublishingEngine";
import { runDuplicateContentScan } from "@/services/seo/duplicateContentDetector";
import {
  buildHierarchicalLinksForTopic,
  buildHierarchicalLinksForArticle,
} from "@/services/intelligence/hierarchicalLinkingEngine";
import { setSystemSetting } from "@/services/system/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { allowed: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { allowed: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { allowed: true };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { action } = body;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in. Please log in to the admin panel first." }, { status: 401 });
  }
  let result: Record<string, unknown>;

  try {
    switch (action) {
      case "demand_run":
        result = await runFullPublishingCycle() as unknown as Record<string, unknown>;
        break;
      case "generate_articles":
        result = await publishApprovedArticles(10) as unknown as Record<string, unknown>;
        break;
      case "quality_audit":
        result = await runDuplicateContentScan(50) as unknown as Record<string, unknown>;
        break;
      case "rebuild_links": {
        const { data: topics } = await supabase.from("topics").select("id");
        const { data: articles } = await supabase.from("articles").select("id");
        for (const topic of topics || []) await buildHierarchicalLinksForTopic(topic.id);
        for (const article of articles || []) await buildHierarchicalLinksForArticle(article.id);
        result = { topicsProcessed: topics?.length ?? 0, articlesProcessed: articles?.length ?? 0 };
        break;
      }
      case "publish_queue": {
        const topicResult = await publishApprovedTopics(10);
        const articleResult = await publishApprovedArticles(10);
        result = { topicsPublished: topicResult.topicsPublished, articlesPublished: articleResult.articlesPublished };
        break;
      }
      case "pause_automation":
        await setSystemSetting("AUTOMATION_ENABLED", "false");
        result = { automationEnabled: false };
        break;
      case "resume_automation":
        await setSystemSetting("AUTOMATION_ENABLED", "true");
        result = { automationEnabled: true };
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true, result });
}
