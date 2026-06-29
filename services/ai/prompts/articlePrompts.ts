import { GenerateContentInput } from "@/services/ai/aiContentGenerator";

export function buildSEOPrompt(input: GenerateContentInput): string {
  return `Write a comprehensive SEO article in ${input.languageCode} about "${input.title}".

Goal: rank in search engines for the topic and related keywords.

Target audience: ${input.targetAudience ?? "general readers"}.
Tone: ${input.tone ?? "neutral"}.
Max words: ${input.maxWords ?? 1200}.

Keywords to include: ${(input.keywords ?? []).join(", ") || "relevant topic keywords"}.

Instructions:
- Start with a strong introduction that answers the search intent.
- Use H2 and H3 headings for structure.
- Include practical examples, data, or steps where appropriate.
- Add a clear conclusion with next steps.
- Write a meta title and meta description.
- Suggest 3-5 internal links to related topics.

${input.description ? `Context: ${input.description}` : ""}`;
}

export function buildAffiliatePrompt(input: GenerateContentInput): string {
  return `Write a comparison and recommendation article in ${input.languageCode} about "${input.title}".

Goal: help readers choose the best option and include affiliate product recommendations.

Target audience: ${input.targetAudience ?? "buyers researching options"}.
Tone: ${input.tone ?? "professional"}.
Max words: ${input.maxWords ?? 1500}.

Keywords: ${(input.keywords ?? []).join(", ") || "best, review, comparison, top picks"}.

Instructions:
- Compare 3-5 top options honestly.
- Highlight pros and cons for each.
- Recommend a best overall pick and a budget pick.
- Include clear calls to action.
- Add a disclaimer about affiliate links.
- Write a meta title and meta description.

${input.description ? `Context: ${input.description}` : ""}`;
}

export function buildExplainerPrompt(input: GenerateContentInput): string {
  return `Write an educational explainer in ${input.languageCode} about "${input.title}".

Goal: teach the concept clearly and completely.

Target audience: ${input.targetAudience ?? "beginners"}.
Tone: ${input.tone ?? "friendly"}.
Max words: ${input.maxWords ?? 1000}.

Instructions:
- Define the topic in simple terms.
- Use analogies or examples.
- Break down into structured sections.
- Include a FAQ section if helpful.
- Write a meta title and meta description.

${input.description ? `Context: ${input.description}` : ""}`;
}

export function buildComparisonPrompt(input: GenerateContentInput): string {
  return `Write a comparison article in ${input.languageCode} comparing "${input.title}".

Goal: help readers understand the differences and make a decision.

Tone: ${input.tone ?? "neutral"}.
Max words: ${input.maxWords ?? 1200}.

Instructions:
- Use a comparison table when possible.
- Highlight key differences and similarities.
- Give a clear recommendation for different use cases.
- Write a meta title and meta description.

${input.description ? `Context: ${input.description}` : ""}`;
}

export function buildFAQPrompt(input: GenerateContentInput): string {
  return `Write a FAQ article in ${input.languageCode} about "${input.title}".

Instructions:
- Provide 5-10 concise question-and-answer pairs.
- Use schema.org FAQPage structured data format mentally.
- Keep answers direct and useful.
- Include related follow-up questions at the end.
- Write a meta title and meta description.

${input.description ? `Context: ${input.description}` : ""}`;
}
