/**
 * Catalog freeze — hide dummy topics, keep flagships public.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreNewsSignals } from "@/services/admission/admissionRules";
import { FLAGSHIP_SLUG_SET } from "@/config/flagshipTopics";

export interface FreezeReport {
  totalPublished: number;
  frozen: number;
  keptFlagship: number;
  deletedJunk: number;
  frozenSlugsSample: string[];
  deletedSlugsSample: string[];
}

const JUNK_SLUG_PATTERN =
  /\b(battlefield|zuckerberg|layoff|hacked|spyware|chevy|startup-battlefield|nobody-is-buying|mark-zuckerberg)\b/i;

function isJunkTopic(slug: string, title: string): boolean {
  const combined = `${slug} ${title}`;
  if (JUNK_SLUG_PATTERN.test(combined)) return true;
  if (scoreNewsSignals(title) >= 0.55) return true;
  if (title.length > 85) return true;
  return false;
}

/** Archive all published non-flagship topics. Delete obvious news/spam slugs. */
export async function freezeNonFlagshipCatalog(): Promise<FreezeReport> {
  const sb = createAdminClient();

  const { data: published } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("status", "published")
    .eq("topic_translations.language_code", "en");

  const report: FreezeReport = {
    totalPublished: published?.length ?? 0,
    frozen: 0,
    keptFlagship: 0,
    deletedJunk: 0,
    frozenSlugsSample: [],
    deletedSlugsSample: [],
  };

  for (const topic of published ?? []) {
    const title = topic.topic_translations?.[0]?.title ?? topic.slug;

    if (FLAGSHIP_SLUG_SET.has(topic.slug)) {
      report.keptFlagship++;
      continue;
    }

    if (isJunkTopic(topic.slug, title)) {
      await sb.from("topics").delete().eq("id", topic.id);
      report.deletedJunk++;
      if (report.deletedSlugsSample.length < 15) {
        report.deletedSlugsSample.push(topic.slug);
      }
      continue;
    }

    await sb
      .from("topics")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", topic.id);

    report.frozen++;
    if (report.frozenSlugsSample.length < 15) {
      report.frozenSlugsSample.push(topic.slug);
    }
  }

  // Ensure flagships are published (in case any were archived earlier)
  await sb
    .from("topics")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .in("slug", [...FLAGSHIP_SLUG_SET]);

  return report;
}

/** Count current catalog state. */
export async function getCatalogVisibilityCounts(): Promise<{
  published: number;
  archived: number;
  draft: number;
  flagshipsPublished: number;
}> {
  const sb = createAdminClient();
  const [pub, arch, draft, flagships] = await Promise.all([
    sb.from("topics").select("*", { count: "exact", head: true }).eq("status", "published"),
    sb.from("topics").select("*", { count: "exact", head: true }).eq("status", "archived"),
    sb.from("topics").select("*", { count: "exact", head: true }).eq("status", "draft"),
    sb
      .from("topics")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .in("slug", [...FLAGSHIP_SLUG_SET]),
  ]);

  return {
    published: pub.count ?? 0,
    archived: arch.count ?? 0,
    draft: draft.count ?? 0,
    flagshipsPublished: flagships.count ?? 0,
  };
}
