import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "../lib/supabase/admin";

const FLAGSHIPS: { requested: string; slug: string }[] = [
  { requested: "nodejs-cluster", slug: "nodejs-cluster" },
  { requested: "javascript-fundamentals", slug: "javascript-fundamentals" },
  { requested: "html-fundamentals", slug: "html-fundamentals" },
  { requested: "css-fundamentals", slug: "css-fundamentals" },
  { requested: "restful-apis", slug: "restful-apis" },
  { requested: "index-funds", slug: "index-funds" },
  { requested: "health-insurance", slug: "health-insurance" },
  { requested: "budgeting", slug: "budgeting" },
  { requested: "travel-planning", slug: "travel-planning" },
  { requested: "git-fundamentals", slug: "git-version-control" },
];

async function main() {
  const sb = createAdminClient();
  const rows = [];

  for (const { requested, slug } of FLAGSHIPS) {
    const { data: topic } = await sb
      .from("topics")
      .select("id, status, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (!topic) {
      rows.push({ requested, slug, status: "missing", gap: "Topic not published" });
      continue;
    }

    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("id, fact_count, last_verified_at, version")
      .eq("topic_id", topic.id)
      .eq("status", "ready")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: trans } = await sb
      .from("topic_translations")
      .select("content, title")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .maybeSingle();

    const words = (trans?.content || "").split(/\s+/).filter(Boolean).length;
    const { count: citations } = await sb
      .from("knowledge_citations")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg?.id ?? "00000000-0000-0000-0000-000000000000");

    const { count: faqs } = await sb
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("topic_id", topic.id);

    let tier = "F";
    if (words >= 2500 && (citations ?? 0) >= 2) tier = "A";
    else if (words >= 1200) tier = "B";
    else if (words >= 600) tier = "C";
    else if (words >= 300) tier = "D";

    rows.push({
      requested,
      slug,
      title: trans?.title,
      published: topic.status === "published",
      words,
      facts: pkg?.fact_count ?? 0,
      citations: citations ?? 0,
      faqs: faqs ?? 0,
      hasPackage: !!pkg,
      lastVerified: pkg?.last_verified_at,
      tier,
      gap:
        words < 600
          ? "Insufficient depth — needs multi-source knowledge acquisition"
          : (citations ?? 0) === 0
            ? "Missing citations"
            : null,
    });
  }

  mkdirSync("temp", { recursive: true });
  writeFileSync("temp/sprint1-flagship-audit.json", JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows, null, 2));
}

main();
