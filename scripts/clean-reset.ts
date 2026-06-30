/**
 * Clean Reset Script — Full pipeline reset before production
 *
 * Step 1: Backup all existing data to JSON files
 * Step 2: Delete articles, article_translations, topics, topic_translations
 * Step 3: Delete old/random collections (keep curated ones)
 * Step 4: Clear all queues
 * Step 5: Setup curated V1 collections with correct slugs
 *
 * Usage: npx tsx scripts/clean-reset.ts
 * Dry run: npx tsx scripts/clean-reset.ts --dry-run
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes("--dry-run");
const BACKUP_DIR = resolve(process.cwd(), "scripts", "backup-" + new Date().toISOString().slice(0, 10));

// ─── V1 Curated Collections ───────────────────────────────────────────────────
// These are the ONLY collections that should exist after reset.
// Format: { slug, name, categorySlug }
const V1_COLLECTIONS = [
  // Technology
  { slug: "docker",           name: "Docker",           categorySlug: "technology" },
  { slug: "python",           name: "Python",           categorySlug: "technology" },
  { slug: "javascript",       name: "JavaScript",       categorySlug: "technology" },
  { slug: "react",            name: "React",            categorySlug: "technology" },
  { slug: "kubernetes",       name: "Kubernetes",       categorySlug: "technology" },
  { slug: "devops",           name: "DevOps",           categorySlug: "technology" },
  // Business
  { slug: "entrepreneurship", name: "Entrepreneurship", categorySlug: "business" },
  { slug: "marketing-basics", name: "Marketing Basics", categorySlug: "business" },
  // Personal Finance
  { slug: "investing-basics", name: "Investing Basics", categorySlug: "personal-finance" },
  // Education
  { slug: "study-skills",     name: "Study Skills",     categorySlug: "education" },
  // Health
  { slug: "nutrition-basics", name: "Nutrition Basics", categorySlug: "health-wellness" },
  // Home & Lifestyle
  { slug: "home-organization",name: "Home Organization",categorySlug: "home-lifestyle" },
  // Travel
  { slug: "travel-planning",  name: "Travel Planning",  categorySlug: "travel" },
];

function log(msg: string) { console.log(msg); }
function section(s: string) { console.log("\n" + "═".repeat(60) + "\n" + s + "\n" + "═".repeat(60)); }

// ─── Step 1: Backup ───────────────────────────────────────────────────────────
async function backup() {
  section("STEP 1: Backup");

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const tables = [
    "articles", "article_translations",
    "topics", "topic_translations",
    "collections", "collection_translations",
    "content_generation_queue",
    "demand_topic_queue",
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) { log(`  ⚠ Could not backup ${table}: ${error.message}`); continue; }
    const path = resolve(BACKUP_DIR, `${table}.json`);
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    log(`  ✓ ${table}: ${data?.length ?? 0} rows → ${path}`);
  }

  log(`\n  Backup complete: ${BACKUP_DIR}`);
}

// ─── Step 2: Delete articles + translations ───────────────────────────────────
async function deleteArticles() {
  section("STEP 2: Delete Articles");

  const { data: articles } = await supabase.from("articles").select("id");
  log(`  Found ${articles?.length ?? 0} articles`);

  if (DRY_RUN) { log("  [DRY RUN] Skipping delete"); return; }

  if (articles && articles.length > 0) {
    const ids = articles.map((a) => a.id);

    // Delete translations first (FK constraint)
    const { error: tErr } = await supabase.from("article_translations").delete().in("article_id", ids);
    if (tErr) log(`  ⚠ article_translations delete: ${tErr.message}`);
    else log(`  ✓ article_translations deleted`);

    const { error: aErr } = await supabase.from("articles").delete().in("id", ids);
    if (aErr) log(`  ⚠ articles delete: ${aErr.message}`);
    else log(`  ✓ articles deleted (${ids.length})`);
  }
}

// ─── Step 3: Delete topics + translations ────────────────────────────────────
async function deleteTopics() {
  section("STEP 3: Delete Topics");

  const { data: topics } = await supabase.from("topics").select("id");
  log(`  Found ${topics?.length ?? 0} topics`);

  if (DRY_RUN) { log("  [DRY RUN] Skipping delete"); return; }

  if (topics && topics.length > 0) {
    const ids = topics.map((t) => t.id);

    const { error: tErr } = await supabase.from("topic_translations").delete().in("topic_id", ids);
    if (tErr) log(`  ⚠ topic_translations delete: ${tErr.message}`);
    else log(`  ✓ topic_translations deleted`);

    const { error: topErr } = await supabase.from("topics").delete().in("id", ids);
    if (topErr) log(`  ⚠ topics delete: ${topErr.message}`);
    else log(`  ✓ topics deleted (${ids.length})`);
  }
}

// ─── Step 4: Delete old collections (keep curated slugs) ─────────────────────
async function resetCollections() {
  section("STEP 4: Reset Collections");

  const curatedSlugs = V1_COLLECTIONS.map((c) => c.slug);
  const { data: allCols } = await supabase.from("collections").select("id, slug");
  const oldCols = (allCols ?? []).filter((c) => !curatedSlugs.includes(c.slug));

  log(`  Total collections: ${allCols?.length ?? 0}`);
  log(`  Curated (keep): ${curatedSlugs.length}`);
  log(`  Old/random (delete): ${oldCols.length}`);

  if (DRY_RUN) {
    log("  [DRY RUN] Would delete: " + oldCols.map((c) => c.slug).join(", "));
    return;
  }

  if (oldCols.length > 0) {
    const oldIds = oldCols.map((c) => c.id);

    // Delete collection_translations first
    const { error: ctErr } = await supabase.from("collection_translations").delete().in("collection_id", oldIds);
    if (ctErr) log(`  ⚠ collection_translations: ${ctErr.message}`);

    const { error: cErr } = await supabase.from("collections").delete().in("id", oldIds);
    if (cErr) log(`  ⚠ collections delete: ${cErr.message}`);
    else log(`  ✓ Old collections deleted: ${oldCols.map((c) => c.slug).join(", ")}`);
  }

  // Now ensure all curated collections exist with correct category linkage
  const { data: categories } = await supabase.from("categories").select("id, slug");
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.slug, c.id]));

  log("\n  Ensuring curated collections exist:");
  for (const col of V1_COLLECTIONS) {
    const categoryId = catMap[col.categorySlug];
    if (!categoryId) {
      log(`  ⚠ Category not found: ${col.categorySlug} — skipping ${col.slug}`);
      continue;
    }

    // Upsert by slug
    const { data: existing } = await supabase.from("collections").select("id").eq("slug", col.slug).maybeSingle();

    if (existing) {
      // Update category_id if needed
      await supabase.from("collections").update({ category_id: categoryId }).eq("id", existing.id);
      log(`  ✓ Exists: ${col.slug} (updated category)`);
    } else {
      const { data: newCol, error } = await supabase
        .from("collections")
        .insert({ slug: col.slug, category_id: categoryId, sort_order: 0 })
        .select()
        .single();

      if (error) { log(`  ✗ Failed to create ${col.slug}: ${error.message}`); continue; }

      // Insert English translation
      await supabase.from("collection_translations").insert({
        collection_id: newCol.id,
        language_code: "en",
        title: col.name,
        description: `${col.name} — curated knowledge collection`,
      });
      log(`  ✓ Created: ${col.slug} → ${col.categorySlug}`);
    }
  }
}

// ─── Step 5: Clear all queues ─────────────────────────────────────────────────
async function clearQueues() {
  section("STEP 5: Clear Queues");

  if (DRY_RUN) { log("  [DRY RUN] Skipping queue clear"); return; }

  const { error: cqErr, count: cqCount } = await supabase
    .from("content_generation_queue")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  if (cqErr) log(`  ⚠ content_generation_queue: ${cqErr.message}`);
  else log(`  ✓ content_generation_queue cleared`);

  const { error: dtqErr } = await supabase
    .from("demand_topic_queue")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (dtqErr) log(`  ⚠ demand_topic_queue: ${dtqErr.message}`);
  else log(`  ✓ demand_topic_queue cleared`);
}

// ─── Step 6: Verify final state ───────────────────────────────────────────────
async function verifyState() {
  section("STEP 6: Verify Final State");

  const [articles, topics, collections, categories, queue] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("topics").select("id", { count: "exact", head: true }),
    supabase.from("collections").select("id, slug, category_id"),
    supabase.from("categories").select("id, slug"),
    supabase.from("content_generation_queue").select("id", { count: "exact", head: true }),
  ]);

  const catMap = Object.fromEntries((categories.data ?? []).map((c) => [c.id, c.slug]));

  log(`  Articles:    ${articles.count ?? 0}  (expected: 0)`);
  log(`  Topics:      ${topics.count ?? 0}  (expected: 0)`);
  log(`  Queue items: ${queue.count ?? 0}  (expected: 0)`);
  log(`  Categories:  ${categories.data?.length ?? 0}`);
  log(`  Collections: ${collections.data?.length ?? 0}`);

  log("\n  Collections:");
  for (const col of collections.data ?? []) {
    const catSlug = catMap[col.category_id] ?? "???";
    log(`    • ${col.slug} → ${catSlug}`);
  }

  const missingCurated = V1_COLLECTIONS.filter(
    (v) => !collections.data?.find((c) => c.slug === v.slug)
  );
  if (missingCurated.length > 0) {
    log(`\n  ⚠ Missing curated collections: ${missingCurated.map((c) => c.slug).join(", ")}`);
  } else {
    log(`\n  ✓ All ${V1_COLLECTIONS.length} curated collections present`);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Clean Reset Script — " + new Date().toISOString());
  if (DRY_RUN) console.log("*** DRY RUN MODE — no changes will be made ***\n");

  await backup();
  await deleteArticles();
  await deleteTopics();
  await resetCollections();
  await clearQueues();
  await verifyState();

  section("DONE");
  if (DRY_RUN) {
    log("Dry run complete. Run without --dry-run to execute.");
  } else {
    log("Clean reset complete.");
    log("Next step: Run 'Start' in admin dashboard to begin knowledge-first generation.");
    log("Or run: npx tsx scripts/validate-pipeline.ts to validate LLM stages first.");
  }
}

main().catch(console.error);
