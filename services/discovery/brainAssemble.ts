/**
 * Brain assemble — fuel → understood candidates for the single brain pipeline.
 *
 * Brain owns: understand external fuel, write original article, hand off to assemble.
 * Raw Wikipedia/source paste is never used as candidate content.
 */

import { v4 as uuidv4 } from "uuid";
import type { CandidateInput } from "@/services/knowledge/types";
import type { CatalogTopicTarget } from "./catalogHierarchy";
import type { ExternalFuelResult } from "./brainExternalFuel";
import { getPhase1SeedTopic } from "@/config/phase1SeedTopics";
import { brainUnderstand, notesFactCount, type BrainNotes } from "./catalogBrainUtils";
import { rankBrainNotes } from "./brainSemanticRank";
import { writeBrainArticleOriginal } from "./brainWriter";
import { filterRelevantCandidates } from "@/services/knowledge/relevanceGate";

const MIN_BRAIN_FACTS = 4;
const MIN_BRAIN_FACTS_SEED = 3;

export interface BrainPrepareResult {
  notes: BrainNotes;
  candidates: CandidateInput[];
  brainMarkdown?: string;
  reason?: string;
}

/** Prose-only text for package facts (no markdown structure). */
function proseFromBrainMarkdown(markdown: string): string {
  return markdown
    .replace(/^#\s+.+$/m, "")
    .replace(/^##\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function articleToCandidates(
  markdown: string,
  title: string,
  sourceUrl: string
): CandidateInput[] {
  const discoveryRunId = uuidv4();
  const prose = proseFromBrainMarkdown(markdown);

  return [
    {
      id: uuidv4(),
      title,
      description: prose,
      sourceUrl: sourceUrl || "https://valendiro.com/brain-writer",
      discoveryRunId,
      adapterName: "brain-writer",
      sourceSlug: "brain",
      sourceAuthority: "official",
      metadata: { brain_writer: true, brain_pipeline: true, brain_markdown: markdown },
    },
  ];
}

/** Brain understands fuel and prepares assembler candidates (no parallel publish path). */
export function prepareBrainCandidates(
  target: CatalogTopicTarget,
  fuel: ExternalFuelResult
): BrainPrepareResult {
  const seed = getPhase1SeedTopic(target.slug);
  const relevanceKey = seed?.primaryKeyword ?? target.title;
  const totalChars = fuel.texts.reduce((s, t) => s + t.length, 0);
  const understandOpts = {
    slug: target.slug,
    primaryKeyword: seed?.primaryKeyword,
  };

  let notes = brainUnderstand(fuel.texts, relevanceKey, understandOpts);
  const minFacts = seed ? MIN_BRAIN_FACTS_SEED : MIN_BRAIN_FACTS;
  const richFuel = totalChars >= 6000;
  // Teaching-shaped fuel must yield enough typed claims for Why/How/Where sections
  const teachingFuel = fuel.teachingCoverage?.pass === true;

  if ((notes.allFacts.length < minFacts && richFuel) || teachingFuel) {
    notes = brainUnderstand(fuel.texts, relevanceKey, { ...understandOpts, relaxed: true });
  }

  notes = rankBrainNotes(notes, target.title, {
    slug: target.slug,
    primaryKeyword: seed?.primaryKeyword,
  });

  if (notes.allFacts.length < minFacts) {
    return {
      notes,
      candidates: [],
      reason: `understand: ${notes.allFacts.length}/${minFacts} facts, typed=${notesFactCount(notes)}, ${totalChars} chars`,
    };
  }

  const written = writeBrainArticleOriginal(notes, target.title, target.slug, fuel.texts);
  if (!written) {
    return {
      notes,
      candidates: [],
      reason: `writer: could not produce original article (${notes.allFacts.length} facts, typed=${notesFactCount(notes)})`,
    };
  }

  const primaryUrl = fuel.blocks[0]?.url ?? "";
  const rawCandidates = articleToCandidates(written.markdown, target.title, primaryUrl);

  if (rawCandidates.length === 0) {
    return {
      notes,
      candidates: [],
      reason: "writer: empty candidate set from article",
    };
  }

  const { kept, dropped } = filterRelevantCandidates(rawCandidates, target.slug, target.title);
  if (kept.length === 0) {
    return {
      notes,
      candidates: [],
      reason: `relevance: 0 kept of ${rawCandidates.length} (${dropped.length} dropped)`,
    };
  }

  return { notes, candidates: kept, brainMarkdown: written.markdown };
}
