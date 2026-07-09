/**
 * Original Valendiro content writer — understand internal fuel, rewrite apna article.
 * Source text never published; encyclopedia sources may show separately via policy.
 */

import "@/services/llm";
import { getActiveLLMProvider } from "@/services/llm/llmProvider";
import type { CatalogTopicTarget } from "./catalogHierarchy";

export interface UnderstoodNotes {
  definitions: string[];
  keyConcepts: string[];
  facts: string[];
  practicalTips: string[];
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export function isLlmAvailable(): boolean {
  return getActiveLLMProvider().name !== "deterministic";
}

export const LLM_REQUIRED_MESSAGE =
  "LLM not configured — fuel accumulates only; set LLM_PROVIDER + API key to publish original articles";

function truncate(text: string, max = 2800): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

/** Internal only — paraphrased notes from fuel, not for publish. */
export async function understandFuelForTopic(
  target: CatalogTopicTarget,
  fuelTexts: string[]
): Promise<UnderstoodNotes> {
  const provider = getActiveLLMProvider();
  const research = fuelTexts.map((t, i) => `Note ${i + 1}:\n${truncate(t)}`).join("\n\n");

  const response = await provider.complete({
    systemPrompt: `You extract learning notes for Valendiro editors. Paraphrase everything. No quotes. Output JSON only.`,
    userPrompt: `Category: ${target.categoryTitle ?? "General"}
Subcategory: ${target.subcategoryTitle ?? "General"}
Topic: ${target.title}

Internal research (never publish verbatim):
${research}

Return JSON:
{"definitions":[],"keyConcepts":[],"facts":[],"practicalTips":[]}`,
    temperature: 0.25,
    maxTokens: 4096,
  });

  const parsed = parseJsonObject(response.content);
  if (!parsed) throw new Error("Understand step failed — invalid JSON");

  return {
    definitions: asStrings(parsed.definitions),
    keyConcepts: asStrings(parsed.keyConcepts),
    facts: asStrings(parsed.facts),
    practicalTips: asStrings(parsed.practicalTips),
  };
}

/** Original Valendiro article — notes only, no source URLs or copied phrases. */
export async function rewriteOriginalArticle(
  target: CatalogTopicTarget,
  notes: UnderstoodNotes
): Promise<string> {
  const provider = getActiveLLMProvider();

  const response = await provider.complete({
    systemPrompt: `You write original educational articles for Valendiro.com.
Rules:
- 100% original wording — Valendiro's own content
- Do NOT cite or name external websites
- Do NOT copy phrases from any source
- Clear, helpful, human tone
- Markdown output only`,
    userPrompt: `Write for: ${target.categoryTitle ?? "Knowledge"} › ${target.subcategoryTitle ?? "Guide"} › ${target.title}

Use ONLY these paraphrased notes:
Definitions: ${notes.definitions.join(" | ")}
Concepts: ${notes.keyConcepts.join(" | ")}
Facts: ${notes.facts.join(" | ")}
Tips: ${notes.practicalTips.join(" | ")}

Sections (markdown ## headings):
What it is
Why it matters
How it works
Key points
Practical tips
What to remember

900–1400 words. Original Valendiro voice.`,
    temperature: 0.5,
    maxTokens: 8192,
  });

  const markdown = response.content.trim();
  const words = markdown.split(/\s+/).filter(Boolean).length;
  if (words < 600) throw new Error(`Rewrite too short (${words} words)`);
  return markdown;
}
