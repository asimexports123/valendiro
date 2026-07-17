import { definitionSectionHeading, resolveTopicDisplayName } from "../services/content/topicHeading";

function oldHeading(slug: string): string {
  const subject = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `What Is ${subject}?`;
}

for (const [slug, title] of [
  ["what-is-artificial-intelligence", "What Is Artificial Intelligence?"],
  ["compound-interest-explained", "Compound Interest Explained"],
] as const) {
  const display = resolveTopicDisplayName(slug, title);
  console.log(`\n${slug}`);
  console.log(`  BEFORE: ${oldHeading(slug)}`);
  console.log(`  AFTER:  ${definitionSectionHeading(display)}`);
}
