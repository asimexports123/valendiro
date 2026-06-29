import { TemplateData, TemplatedArticle } from "./articleTemplateEngine";
import { generateMetaTitle, generateMetaDescription, renderProductBlock } from "./articleTemplateEngine";

export function buildInformationalArticle(data: TemplateData, generatedAt: string): TemplatedArticle {
  const relatedTopics = data.relatedTopics || [];
  const relatedQuestions = data.relatedQuestions || [];
  const entities = data.entities || [];
  const keywords = data.keywords || [data.title.toLowerCase()];

  const sections = [
    `# ${data.title}`,
    "",
    `This guide explains ${data.title} in detail. ${data.description ?? ""}`.trim(),
    "",
    "## What You Need to Know",
    `Understanding ${data.title} starts with the core concepts. Below is a clear breakdown of the most important ideas and how they connect to related topics.`,
    "",
    "## Key Details",
    ...(entities.length > 0
      ? entities.map((e) => `- **${e.name}**: ${e.description ?? "A key concept in this topic."}`)
      : ["- The core principles and definitions.\n- How it works in practice.\n- Common questions and answers."]),
    "",
    "## Related Questions",
    ...(relatedQuestions.length > 0
      ? relatedQuestions.map((q) => `### ${q.question_text}\n${q.answer ?? "Answer to be added."}`)
      : ["No related questions available yet."]),
    "",
    "## Related Topics",
    ...(relatedTopics.length > 0
      ? relatedTopics.map((t) => `- ${t.title}`)
      : ["No related topics available yet."]),
    "",
    renderProductBlock(data.products, 3),
    "## Conclusion",
    `We covered the key points about ${data.title}. For further reading, explore the related topics and questions linked above.`,
  ];

  const content = sections.join("\n");
  const excerpt = content.slice(0, 250).trim();

  return {
    title: data.title,
    excerpt,
    content,
    metaTitle: generateMetaTitle(data.title),
    metaDescription: generateMetaDescription(data.title, data.description),
    keywords,
    languageCode: data.languageCode,
    generatedAt,
  };
}
