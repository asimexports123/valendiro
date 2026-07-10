/**
 * Seed Phase-1 topics from config/phase1SeedTopics.ts (missing slugs only).
 *   npx tsx scripts/seed-phase1-brain-topics.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import {
  PHASE_1_SEED_TOPICS,
  validatePhase1SeedTopics,
} from "../config/phase1SeedTopics";
import { insertTopic, upsertTopicTranslation } from "../services/publish/writers";
import { STUB_TOPIC_CONTENT_MARKER } from "../services/public/contentFilters";

const STUB = `${STUB_TOPIC_CONTENT_MARKER}. Check back soon for a full learning path.`;

async function main() {
  const validationErrors = validatePhase1SeedTopics();
  if (validationErrors.length > 0) {
    console.error("Seed config errors:");
    validationErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const sb = createAdminClient();
  let created = 0;
  let exists = 0;
  let reassigned = 0;

  const { data: categories } = await sb.from("categories").select("id, slug");
  const catBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  const { data: subs } = await sb
    .from("subcategories")
    .select("id, slug, category_id, categories(slug)");
  const subBySlug = new Map((subs ?? []).map((s) => [s.slug, s]));

  for (const seed of PHASE_1_SEED_TOPICS) {
    const sub = subBySlug.get(seed.subcategorySlug);
    if (!sub) {
      console.log(`skip ${seed.slug}: subcategory "${seed.subcategorySlug}" missing`);
      continue;
    }

    const categoryId =
      sub.category_id ??
      catBySlug.get((sub.categories as { slug?: string })?.slug ?? "") ??
      null;

    const { data: existing } = await sb
      .from("topics")
      .select("id, subcategory_id, status")
      .eq("slug", seed.slug)
      .maybeSingle();

    if (existing) {
      exists++;
      // Reassign to correct Phase-1 subcategory if misplaced
      if (existing.subcategory_id !== sub.id) {
        await sb
          .from("topics")
          .update({ subcategory_id: sub.id, category_id: categoryId })
          .eq("id", existing.id);
        console.log(`  reassigned: ${seed.slug} → ${seed.subcategorySlug}`);
        reassigned++;
      }
      continue;
    }

    const id = uuidv4();
    await insertTopic({
      id,
      slug: seed.slug,
      canonical_path: `/en/topics/${seed.slug}`,
      category_id: categoryId,
      subcategory_id: sub.id,
      status: "published",
      published_at: new Date().toISOString(),
    });

    await upsertTopicTranslation({
      topic_id: id,
      language_code: "en",
      title: seed.title,
      subtitle: seed.subtitle,
      content: STUB,
      meta_title: `${seed.title} — Valendiro`,
      meta_description: seed.subtitle,
    });

    console.log(`  + ${seed.slug} (${seed.subcategorySlug}) [${seed.primaryKeyword}]`);
    created++;
  }

  console.log(
    `\nDone: ${created} created, ${exists} already exist, ${reassigned} reassigned`
  );
  console.log(`Total Phase-1 seeds in config: ${PHASE_1_SEED_TOPICS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
