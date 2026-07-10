/**
 * Paragraph quality gate — reject keyword-dump and template-hook prose.
 */

const KEYWORD_DUMP_PATTERNS = [
  /\bbest understood through\b/i,
  /\btied to\b[^.]{0,80}\bplus\b/i,
  /\bconnected to\b[^.]{0,80}\bplus\b/i,
  /\blinked to\b[^.]{0,80}\bplus\b/i,
  /\brevolves around\b[^.]{0,60},/i,
  /\bthemes such as\b/i,
  /\bideas like\b/i,
  /\bthrough\s+[A-Z][a-z]+,\s+[A-Z][a-z]+,\s+[A-Z][a-z]+/,
  /\bReaders frequently connect\b/i,
  /\bReaders often connect\b/i,
  /\bA useful place to start\b/i,
  /\bTo grasp\b[^.]{0,40}\bstart with\b/i,
  /\bAt its core\b[^.]{0,60}\btied to\b/i,
  /\bIn plain terms\b[^.]{0,60}\babout\b/i,
  /\bcharacterized by\b[^.]{0,80}\bplus\b/i,
  /\bmarked by\b[^.]{0,80}\bplus\b/i,
  /\bassociated with\b[^.]{0,80}\bplus\b/i,
  /\bshaped by\b[^.]{0,80}\bplus\b/i,
  /\bThe details here matter most\b/i,
  /\bMany learners find it useful to pause\b/i,
  /\bThis section sets up the practical\b/i,
  /\balso relates to\b/i,
  /\bThis point about\b/i,
];

const FRAGMENT_PATTERNS = [
  /\b(rese|trunc|abbr)\.$/i,
  /\b[A-Z][a-z]+ rese\./,
  /\b;\s+and\b/i,
  /\b[a-z]{1,2}\.$/i,
];

const GRAMMAR_GLITCH_PATTERNS = [
  /\baI\b/,
  /\bthis field development\b/i,
  /\bthis field systems\b/i,
  /\bit programs\b/i,
  /\bin it,\b/i,
  /\bmade it widely\b/i,
];

const TITLE_CASE_LIST =
  /\b([A-Z][a-z]+),\s+([A-Z][a-z]+),\s+(?:and\s+)?([A-Z][a-z]+)(?:,\s+(?:and\s+)?([A-Z][a-z]+))?/;

function countTitleCaseListItems(sentence: string): number {
  const m = sentence.match(TITLE_CASE_LIST);
  if (!m) return 0;
  return [m[1], m[2], m[3], m[4]].filter(Boolean).length;
}

/** True when paragraph reads like a keyword dump rather than an idea. */
export function isKeywordDumpParagraph(text: string): boolean {
  if (!text.trim()) return false;
  for (const re of KEYWORD_DUMP_PATTERNS) {
    if (re.test(text)) return true;
  }

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let dumpSentences = 0;
  for (const s of sentences) {
    if (countTitleCaseListItems(s) >= 3) dumpSentences++;
    if (/\b(and|plus|along with)\s+[A-Z][a-z]+\s*\.?$/i.test(s) && countTitleCaseListItems(s) >= 2) {
      dumpSentences++;
    }
  }
  return dumpSentences >= 1 && dumpSentences / Math.max(sentences.length, 1) >= 0.5;
}

/** True when a sentence expresses one complete thought. */
export function isCompleteIdeaSentence(sentence: string): boolean {
  const s = sentence.trim();
  if (!s) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;
  if (countTitleCaseListItems(s) >= 3) return false;
  if (KEYWORD_DUMP_PATTERNS.some((re) => re.test(s))) return false;
  if (!/[.!?]$/.test(s)) return false;
  if (words.length >= 8) return true;
  const verbs =
    /\b(is|are|was|were|has|have|had|includes?|involves?|can|could|requires|means|refers|measures|avoids|helps|allows|enables|supports|uses?|used|works|performs|designed|built|focuses|aims|solve|solves|include|allow|provides|arises|watch|rely|relies|expect|expects|display|displays|show|shows|become|becomes|grow|grows|remain|remains|emerged|emerges|received|prompted|reshaped|use|rarely|trained|type|available|generate|studies|develops|broken|consist|perceive|take|sits|stack|connect|trace|catch|succeed|matter|keeps|understand|rank|weigh|evaluate|stores|observes|pursues|maps|represents|divide|sets|made|let|gives|turn|lowered|depends|powers|governs|chains|catches|combines|encodes|exposes|feeds|tracks|moves|treat|state|draws|draw|meet|build|built|touch|keeps|kept|answer|answers|infer|infers|formalizes|improves|prefer|prefers|made|shift|shifted|access|accessible|rooted|combines|relies)\b/i;
  return verbs.test(s);
}

export interface ParagraphQualityResult {
  pass: boolean;
  failures: string[];
}

/** True when paragraph is coherent discourse around one idea. */
export function isCoherentDiscourse(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (!trimmed) return false;
  if (KEYWORD_DUMP_PATTERNS.some((re) => re.test(trimmed))) return false;
  if (FRAGMENT_PATTERNS.some((re) => re.test(trimmed))) return false;

  const sentences = trimmed
    .replace(/^\*\*[^*]+\?\*\*\s*/i, "")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 12);

  if (sentences.length === 0 || sentences.length > 4) return false;

  for (const s of sentences) {
    if (!isCompleteIdeaSentence(s)) return false;
    if (/^[a-z]/.test(s.trim())) return false;
    if (FRAGMENT_PATTERNS.some((re) => re.test(s))) return false;
  }

  return true;
}

/** @deprecated use isCoherentDiscourse */
export function answersOneQuestion(paragraph: string): boolean {
  return isCoherentDiscourse(paragraph);
}

/** True when adjacent paragraphs flow without abrupt repetition. */
export function hasAbruptTopicSwitch(prev: string, next: string): boolean {
  if (paragraphsTooSimilar(prev, next)) return true;
  const prevLead = prev.split(/(?<=[.!?])\s+/)[0]?.toLowerCase() ?? "";
  const nextLead = next.split(/(?<=[.!?])\s+/)[0]?.toLowerCase() ?? "";
  if (prevLead && prevLead === nextLead) return true;
  return false;
}

function paragraphsTooSimilar(a: string, b: string): boolean {
  const ka = a.toLowerCase().replace(/[^\w\s]/g, "").slice(0, 100);
  const kb = b.toLowerCase().replace(/[^\w\s]/g, "").slice(0, 100);
  return ka.length > 20 && ka === kb;
}

/** Audit paragraph or section body for template/keyword-dump failures. */
export function auditParagraphQuality(content: string): ParagraphQualityResult {
  const failures: string[] = [];
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.replace(/^##\s+.+$/m, "").replace(/^\d+\.\s+/gm, "").trim())
    .filter((p) => p.length > 20);

  if (isKeywordDumpParagraph(content)) {
    failures.push("keyword-dump paragraph detected");
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (!isCoherentDiscourse(para)) {
      failures.push(`incoherent discourse: "${para.slice(0, 50)}…"`);
    }
    for (const re of GRAMMAR_GLITCH_PATTERNS) {
      if (re.test(para)) {
        failures.push(`grammar glitch: ${re.source}`);
      }
    }
    const sentences = para.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
    for (const s of sentences) {
      if (!isCompleteIdeaSentence(s)) {
        failures.push(`incomplete idea: "${s.slice(0, 60)}…"`);
      }
      for (const re of KEYWORD_DUMP_PATTERNS) {
        if (re.test(s)) {
          failures.push(`template pattern: ${re.source.slice(0, 40)}`);
          break;
        }
      }
    }
    if (i > 0 && hasAbruptTopicSwitch(paragraphs[i - 1], para)) {
      failures.push(`abrupt topic switch or repeat after: "${para.slice(0, 40)}…"`);
    }
  }

  const unique = [...new Set(failures)];
  return { pass: unique.length === 0, failures: unique };
}
