/**
 * Rebuild a single topic — redirects to canonical Brain publish path.
 * Legacy assemble/render/publish direct path is retired.
 */

import { publishOriginalTopicBySlug } from "@/services/discovery/catalogOriginalPublish";
import { createAdminClient } from "@/lib/supabase/admin";
import { countWords } from "@/services/knowledge/contentQualityGate";

export interface RebuildResult {
  slug: string;
  success: boolean;
  wordsBefore: number;
  wordsAfter: number;
  published: boolean;
  error?: string;
}

export async function rebuildTopicFromAuthority(slug: string): Promise<RebuildResult> {
  console.warn(
    `[rebuildTopicFromAuthority] LEGACY REDIRECT — routing "${slug}" to canonical Brain publish (publishOriginalTopicBySlug)`
  );

  const sb = createAdminClient();
  const { data: topic } = await sb
    .from("topics")
    .select("id, slug, topic_translations(content)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();

  if (!topic) {
    return { slug, success: false, wordsBefore: 0, wordsAfter: 0, published: false, error: "Topic not found" };
  }

  const beforeContent = topic.topic_translations?.[0]?.content ?? "";
  const wordsBefore = countWords(beforeContent);

  const result = await publishOriginalTopicBySlug(slug);

  if (result.status === "published") {
    return {
      slug,
      success: true,
      wordsBefore,
      wordsAfter: result.wordCount ?? wordsBefore,
      published: true,
    };
  }

  return {
    slug,
    success: false,
    wordsBefore,
    wordsAfter: result.wordCount ?? wordsBefore,
    published: false,
    error: result.reason ?? result.status,
  };
}
