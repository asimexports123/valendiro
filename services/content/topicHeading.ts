/**
 * Topic heading utilities — clean labels and consistent section titles.
 * Prevents "What Is What Is X?" when slug/title already contains a question prefix.
 */

/** Strip leading what-is/what-are and trailing question marks. */
export function cleanTopicLabel(raw: string): string {
  return raw
    .replace(/^(what\s+(is|are)\s+)/i, "")
    .replace(/\?+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Human label from topic slug (drops leading what-is tokens). */
export function topicLabelFromSlug(slug: string): string {
  const raw = slug
    .split("-")
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return cleanTopicLabel(raw);
}

/** Best display name: prefer cleaned DB title, else slug label. */
export function resolveTopicDisplayName(slug: string, title?: string | null): string {
  const fromTitle = title ? cleanTopicLabel(title) : "";
  if (fromTitle.length >= 3) return fromTitle;
  return topicLabelFromSlug(slug);
}

/** Short label for in-body prose — never a question, no what-is prefix. */
export function shortTopicLabel(slug: string, title?: string | null): string {
  const raw = title?.trim() || topicLabelFromSlug(slug);
  return cleanTopicLabel(raw).replace(/\?+$/g, "").trim();
}

/** Standard H2 for definition/overview — never duplicates "What Is". */
export function definitionSectionHeading(label: string): string {
  const clean = cleanTopicLabel(label);
  if (!clean) return "Overview";
  if (/^(what|how|why|when|where)\s/i.test(clean)) {
    return clean.endsWith("?") ? clean : `${clean}?`;
  }
  if (/^(how|why)\s/i.test(clean)) return clean.endsWith("?") ? clean : `${clean}?`;
  return `What Is ${clean}?`;
}

/** Section headings for brain writer — polished, no redundancy. */
export const BRAIN_SECTION_HEADINGS = {
  overview: (name: string) => definitionSectionHeading(name),
  why: "Why It Exists",
  how: "How It Works",
  keyConcepts: "Key Concepts",
  practical: "Practical Applications",
  mistakes: "Common Mistakes to Avoid",
  summary: "Summary",
  learn: "What You'll Learn",
  deeper: "Deeper Understanding",
  nextSteps: "Next Steps",
} as const;
