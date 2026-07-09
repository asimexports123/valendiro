/**
 * Seed published stub topics for empty Phase-1 subcategories so brain can rewrite them.
 *   npx tsx scripts/seed-phase1-brain-topics.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { PHASE_1_ACTIVE_SUBCATEGORY_SLUGS } from "../config/activeTaxonomy";
import { insertTopic, upsertTopicTranslation } from "../services/publish/writers";

const SEED_BY_SUB: Record<string, { slug: string; title: string; subtitle: string }[]> = {
  "artificial-intelligence": [
    {
      slug: "machine-learning-fundamentals",
      title: "Machine Learning Fundamentals",
      subtitle: "How models learn from data — core concepts for beginners.",
    },
    {
      slug: "what-is-artificial-intelligence",
      title: "What Is Artificial Intelligence?",
      subtitle: "A plain-language introduction to AI, ML, and modern LLMs.",
    },
  ],
  investing: [
    {
      slug: "retirement-planning",
      title: "Retirement Planning",
      subtitle: "401(k), IRAs, and building long-term wealth in the US.",
    },
    {
      slug: "compound-interest-explained",
      title: "Compound Interest Explained",
      subtitle: "Why time in the market beats timing the market.",
    },
  ],
  "stock-market": [
    {
      slug: "stock-market-basics",
      title: "Stock Market Basics",
      subtitle: "Shares, indices, and how public markets work.",
    },
    {
      slug: "portfolio-diversification",
      title: "Portfolio Diversification",
      subtitle: "Spreading risk across assets and sectors.",
    },
  ],
  nutrition: [
    {
      slug: "nutrition-fundamentals",
      title: "Nutrition Fundamentals",
      subtitle: "Macros, calories, and building a balanced diet.",
    },
    {
      slug: "calorie-counting-basics",
      title: "Calorie Counting Basics",
      subtitle: "TDEE, deficits, and sustainable weight management.",
    },
  ],
  fitness: [
    {
      slug: "strength-training-basics",
      title: "Strength Training Basics",
      subtitle: "Progressive overload, reps, and recovery.",
    },
    {
      slug: "cardio-fitness-guide",
      title: "Cardio Fitness Guide",
      subtitle: "Heart rate zones, walking, running, and endurance.",
    },
  ],
  "mental-health": [
    {
      slug: "stress-management-basics",
      title: "Stress Management Basics",
      subtitle: "Practical coping strategies — not a substitute for care.",
    },
    {
      slug: "mental-wellness-fundamentals",
      title: "Mental Wellness Fundamentals",
      subtitle: "Sleep, mindfulness, and when to seek support.",
    },
  ],
};

const STUB =
  "This guide is being expanded with verified, in-depth content. Check back soon for a full learning path.";

async function main() {
  const sb = createAdminClient();
  let created = 0;
  let skipped = 0;

  const { data: categories } = await sb.from("categories").select("id, slug");
  const catBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  for (const subSlug of PHASE_1_ACTIVE_SUBCATEGORY_SLUGS) {
    const seeds = SEED_BY_SUB[subSlug];
    if (!seeds?.length) continue;

    const { data: sub } = await sb
      .from("subcategories")
      .select("id, slug, category_id, categories(slug)")
      .eq("slug", subSlug)
      .maybeSingle();

    if (!sub) {
      console.log(`skip ${subSlug}: subcategory missing in DB`);
      continue;
    }

    const { count } = await sb
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("subcategory_id", sub.id)
      .eq("status", "published");

    if ((count ?? 0) > 0) {
      console.log(`skip ${subSlug}: already has ${count} published topics`);
      skipped++;
      continue;
    }

    const categoryId =
      sub.category_id ?? catBySlug.get((sub.categories as { slug?: string })?.slug ?? "") ?? null;

    for (const seed of seeds) {
      const { data: existing } = await sb.from("topics").select("id").eq("slug", seed.slug).maybeSingle();
      if (existing) {
        console.log(`  exists: ${seed.slug}`);
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

      console.log(`  + ${seed.slug}`);
      created++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} subs skipped (already populated)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
