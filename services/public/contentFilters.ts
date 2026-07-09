/** Marker text used by seed-phase1-brain-topics.ts for placeholder topics. */
export const STUB_TOPIC_CONTENT_MARKER =
  "This guide is being expanded with verified, in-depth content";

/** Minimum words for a topic/article to appear in public discovery surfaces. */
export const MIN_PUBLIC_CONTENT_WORDS = 100;

export function countContentWords(content: string | null | undefined): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function isStubTopicContent(content: string | null | undefined): boolean {
  if (!content?.trim()) return true;
  if (content.includes(STUB_TOPIC_CONTENT_MARKER)) return true;
  return countContentWords(content) < MIN_PUBLIC_CONTENT_WORDS;
}

export function hasSubstantialPublicContent(
  content: string | null | undefined,
  excerpt?: string | null
): boolean {
  const primary = content?.trim();
  if (primary && !isStubTopicContent(primary)) return true;
  const fallback = excerpt?.trim();
  if (fallback && !isStubTopicContent(fallback)) return true;
  return false;
}
