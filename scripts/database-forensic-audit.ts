/**
 * Database Forensic Audit
 * Run exact SQL queries and return raw evidence
 */

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();

  console.log("=== QUERY 1: SELECT id, slug FROM categories ORDER BY sort_order ===");
  const { data: q1, error: e1, status: s1, statusText: st1 } = await sb
    .from("categories")
    .select("id, slug")
    .order("sort_order");
  console.log("data:", JSON.stringify(q1, null, 2));
  console.log("error:", e1);
  console.log("status:", s1);
  console.log("statusText:", st1);

  console.log("\n=== QUERY 2: SELECT id, slug, category_id FROM topics WHERE slug IN (...) ===");
  const { data: q2, error: e2, status: s2, statusText: st2 } = await sb
    .from("topics")
    .select("id, slug, category_id")
    .in("slug", ["nodejs-cluster", "family-vacations", "vendor-management"]);
  console.log("data:", JSON.stringify(q2, null, 2));
  console.log("error:", e2);
  console.log("status:", s2);
  console.log("statusText:", st2);

  console.log("\n=== QUERY 3: LEFT JOIN topics and categories ===");
  const { data: q3, error: e3, status: s3, statusText: st3 } = await sb
    .from("topics")
    .select(`
      slug,
      category_id,
      categories!inner(id, slug)
    `)
    .in("slug", ["nodejs-cluster", "family-vacations", "vendor-management"]);
  console.log("data:", JSON.stringify(q3, null, 2));
  console.log("error:", e3);
  console.log("status:", s3);
  console.log("statusText:", st3);

  console.log("\n=== QUERY 4: Category lookup for nodejs-cluster (exact code from knowledgePackageLoader) ===");
  const topicSlug = "nodejs-cluster";
  const { data: topic } = await sb
    .from("topics")
    .select("id")
    .eq("slug", topicSlug)
    .maybeSingle();
  console.log("topic lookup result:", topic);

  if (topic?.id) {
    const { data: tsub } = await sb
      .from("topic_subcategories")
      .select("subcategory_id")
      .eq("topic_id", topic.id)
      .limit(1)
      .maybeSingle();
    console.log("topic_subcategories lookup result:", tsub);

    if (tsub?.subcategory_id) {
      const { data: sub } = await sb
        .from("subcategories")
        .select("category_id")
        .eq("id", tsub.subcategory_id)
        .maybeSingle();
      console.log("subcategories lookup result:", sub);

      if (sub?.category_id) {
        const { data: cat, error: catError, status: catStatus, statusText: catStatusText } = await sb
          .from("categories")
          .select("id, slug")
          .eq("id", sub.category_id)
          .maybeSingle();
        console.log("categories lookup result:", cat);
        console.log("error:", catError);
        console.log("status:", catStatus);
        console.log("statusText:", catStatusText);
      }
    }
  }
}

main().catch(console.error);
