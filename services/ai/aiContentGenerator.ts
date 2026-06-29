import { SupportedLanguage } from "@/lib/types";

export type ContentFormat = "seo_article" | "affiliate_article" | "faq" | "explainer" | "comparison";

export interface GenerateContentInput {
  title: string;
  description?: string | null;
  format: ContentFormat;
  languageCode: SupportedLanguage;
  keywords?: string[];
  targetAudience?: string;
  tone?: "neutral" | "professional" | "friendly" | "technical";
  maxWords?: number;
  metadata?: Record<string, unknown>;
}

export interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  languageCode: SupportedLanguage;
  generatedAt: string;
}

export interface AIContentGenerator {
  generate(input: GenerateContentInput): Promise<GeneratedContent>;
  isAvailable(): boolean;
}

// Placeholder deterministic generator used until external AI is wired in.
export class PlaceholderAIContentGenerator implements AIContentGenerator {
  isAvailable(): boolean {
    return true;
  }

  async generate(input: GenerateContentInput): Promise<GeneratedContent> {
    const { title, description, languageCode, keywords = [] } = input;

    const intro = `This is a structured draft for "${title}". ${description ?? ""}`.trim();
    const sections = [
      "## Introduction",
      "Provide a clear, concise overview of the topic and why it matters to the reader.",
      "## Key Points",
      "- Define the core concept or answer the main question.\n- Explain the benefits or implications.\n- Include practical examples or step-by-step guidance when applicable.",
      "## Detailed Explanation",
      "Expand on the topic with structured paragraphs, examples, and supporting evidence. Use internal links to related content where relevant.",
      "## Conclusion",
      "Summarize the key takeaways and suggest next steps or related content to read.",
    ];

    const content = [intro, ...sections].join("\n\n");
    const metaDescription = `Learn about ${title}. ${description ?? ""}`.slice(0, 160).trim();

    return {
      title,
      excerpt: intro.slice(0, 250),
      content,
      metaTitle: title,
      metaDescription,
      keywords,
      languageCode,
      generatedAt: new Date().toISOString(),
    };
  }
}

let activeGenerator: AIContentGenerator = new PlaceholderAIContentGenerator();

export function setAIContentGenerator(generator: AIContentGenerator) {
  activeGenerator = generator;
}

export function getAIContentGenerator(): AIContentGenerator {
  return activeGenerator;
}
