/**
 * Knowledge Assembler — Entity Extraction (Phase 5)
 *
 * Identifies entities within fact statements for tagging and relationship building.
 * Deterministic pattern-based extraction — no LLM.
 */

import { STOP_WORDS, VERB_JUNK } from "@/services/discovery/languageSystem/lexicon";

export type ExtractedEntityType =
  | "company"
  | "person"
  | "technology"
  | "product"
  | "standard"
  | "place"
  | "concept"
  | "framework"
  | "language";

export interface ExtractedEntity {
  name: string;
  slug: string;
  type: ExtractedEntityType;
  confidence: number;
}

const ENTITY_RULES: { type: ExtractedEntityType; patterns: RegExp[]; confidence: number }[] = [
  {
    type: "company",
    confidence: 0.9,
    patterns: [
      /\b(?:Google|Microsoft|Apple|Amazon|Meta|OpenAI|Anthropic|Stripe|Vercel|GitHub|Mozilla|BlackRock|Vanguard|Fidelity|WHO|CDC|FDA)\b/g,
      /\b[A-Z][a-z]+ (?:Inc|Corp|Corporation|Labs|Technologies|Systems|Group|Holdings)\b/g,
    ],
  },
  {
    type: "person",
    confidence: 0.85,
    patterns: [
      /\b(?:created|founded|invented|developed|authored|designed)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:created|founded|invented|developed)\b/g,
    ],
  },
  {
    type: "standard",
    confidence: 0.9,
    patterns: [
      /\b(?:ISO\s+\d+|RFC\s+\d+|ECMAScript|GDPR|CCPA|HIPAA|PCI-DSS|REST|GraphQL|OAuth\s*2\.?0?)\b/gi,
    ],
  },
  {
    type: "framework",
    confidence: 0.9,
    patterns: [
      /\b(?:React|Angular|Vue|Svelte|Next\.js|Express|Django|Flask|Rails|Spring|Laravel|FastAPI|NestJS|TensorFlow|PyTorch)\b/g,
    ],
  },
  {
    type: "language",
    confidence: 0.95,
    patterns: [
      /\b(?:JavaScript|TypeScript|Python|Java|Rust|Go|Swift|Kotlin|Ruby|PHP|C\+\+|C#|SQL|HTML|CSS)\b/g,
    ],
  },
  {
    type: "technology",
    confidence: 0.85,
    patterns: [
      /\b(?:Machine Learning|Artificial Intelligence|Blockchain|Cloud Computing|Kubernetes|Docker|Node\.js|PostgreSQL|MongoDB|Redis|Index Fund|ETF|Mutual Fund|Vaccination|Antibiotic)\b/gi,
    ],
  },
  {
    type: "product",
    confidence: 0.85,
    patterns: [
      /\b(?:iPhone|Android|Windows|Linux|macOS|Chrome|Firefox|Safari|VS Code|Git|npm|yarn|pnpm)\b/g,
    ],
  },
  {
    type: "place",
    confidence: 0.9,
    patterns: [
      /\b(?:United States|European Union|India|California|New York|London|Tokyo|Paris|Singapore|Thailand|Japan|Germany|France|Canada|Australia)\b/g,
    ],
  },
];

const CONCEPT_INDICATORS =
  /\b(?:algorithm|architecture|protocol|paradigm|pattern|principle|methodology|framework|strategy|risk|portfolio|diversification|immunity|symptom|diagnosis|itinerary|visa|budget)\b/gi;

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const ENTITY_SLUG_BLOCKLIST = new Set([
  "the", "for", "given", "before", "down", "one", "readers", "building", "summary",
  "getting", "problems-given", "mathematics-computer", "science-methods", "methods-software",
  "systems-tasks", "tasks-reasoning", "capability-computational", "experience-combinatorial",
  "goals-problem", "problem-subproblems", "problems-judgments", "what-is-artificial-intelligence",
]);

function isJunkEntityName(name: string): boolean {
  const slug = toSlug(name);
  if (ENTITY_SLUG_BLOCKLIST.has(slug)) return true;
  const words = name.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 1 && (STOP_WORDS.has(words[0]) || VERB_JUNK.has(words[0]))) return true;
  if (words.length >= 2 && words.every((w) => STOP_WORDS.has(w) || VERB_JUNK.has(w))) return true;
  if (words.length === 2 && (VERB_JUNK.has(words[1]) || words[1] === "given")) return true;
  return false;
}

function addEntity(
  map: Map<string, ExtractedEntity>,
  name: string,
  type: ExtractedEntityType,
  confidence: number
): void {
  const trimmed = name.trim().replace(/\.$/, "");
  if (trimmed.length < 2) return;
  if (isJunkEntityName(trimmed)) return;
  const slug = toSlug(trimmed);
  if (!slug) return;

  const existing = map.get(slug);
  if (!existing || existing.confidence < confidence) {
    map.set(slug, { name: trimmed, slug, type, confidence });
  }
}

/** Extract entities from a block of text. */
export function extractEntitiesFromText(text: string): ExtractedEntity[] {
  const map = new Map<string, ExtractedEntity>();

  for (const rule of ENTITY_RULES) {
    for (const pattern of rule.patterns) {
      const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
      const re = new RegExp(pattern.source, flags);
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        const captured = match[1] ?? match[0];
        addEntity(map, captured, rule.type, rule.confidence);
      }
    }
  }

  // Concept nouns from significant phrases
  const conceptMatches = text.match(CONCEPT_INDICATORS) ?? [];
  for (const concept of conceptMatches) {
    addEntity(map, concept, "concept", 0.7);
  }

  // Proper noun sequences (2+ words or known single tokens)
  const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) ?? [];
  for (const noun of properNouns) {
    if (isJunkEntityName(noun)) continue;
    if (!map.has(toSlug(noun))) {
      addEntity(map, noun, "concept", 0.65);
    }
  }

  return Array.from(map.values());
}

/** Extract entities referenced in a single fact statement. */
export function extractEntitiesFromStatement(statement: string): ExtractedEntity[] {
  return extractEntitiesFromText(statement);
}

/** Merge entity slugs into fact tags (deduplicated, capped). */
export function entitySlugsAsTags(entities: ExtractedEntity[], max = 8): string[] {
  return entities
    .sort((a, b) => b.confidence - a.confidence)
    .map((e) => e.slug)
    .filter((slug, i, arr) => arr.indexOf(slug) === i)
    .slice(0, max);
}
