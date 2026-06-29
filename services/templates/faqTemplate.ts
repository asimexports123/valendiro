import { TemplateData, TemplatedArticle } from "./articleTemplateEngine";
import { generateMetaTitle, generateMetaDescription, renderProductBlock } from "./articleTemplateEngine";

export function buildFAQArticle(data: TemplateData, generatedAt: string): TemplatedArticle {
  const relatedQuestions = data.relatedQuestions || [];
  const keywords = data.keywords || [data.title.toLowerCase(), "faq"];

  const defaultQuestions = [
    { question_text: `What is ${data.title}?`, answer: "A brief overview and definition of the topic." },
    { question_text: `Why does ${data.title} matter?`, answer: "The importance and practical relevance explained." },
    { question_text: `How do I get started with ${data.title}?`, answer: "Simple first steps for beginners." },
    { question_text: `What are common mistakes related to ${data.title}?`, answer: "Frequent pitfalls and how to avoid them." },
    { question_text: `Where can I learn more about ${data.title}?`, answer: "Links to related topics and resources." },
  ];

  const questions = relatedQuestions.length > 0 ? relatedQuestions : defaultQuestions;

  const sections = [
    `# ${data.title} - Frequently Asked Questions`,
    "",
    data.description ?? `Find answers to the most common questions about ${data.title}.`,
    "",
    ...questions.flatMap((q, index) => [
      `## ${index + 1}. ${q.question_text}`,
      "",
      q.answer ?? "Answer to be added.",
      "",
    ]),
    renderProductBlock(data.products, 2),
    "## Summary",
    `This FAQ covers the essential questions about ${data.title}. If you need more detail, explore the related articles and guides.`,
  ];

  const content = sections.join("\n");
  const excerpt = content.slice(0, 250).trim();

  return {
    title: `${data.title} - FAQ`,
    excerpt,
    content,
    metaTitle: generateMetaTitle(`${data.title} - FAQ`),
    metaDescription: generateMetaDescription(data.title, data.description),
    keywords,
    languageCode: data.languageCode,
    generatedAt,
  };
}
