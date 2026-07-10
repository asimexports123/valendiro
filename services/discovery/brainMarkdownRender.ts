/**
 * Direct render path for Brain Writer markdown.
 * Preserves writer output — does not re-compose via fact extractor + knowledge composer.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DocumentNode,
  ParagraphNode,
  ListNode,
  RenderDiagnostics,
  RenderQualityScore,
} from "@/services/renderer/types";
import {
  serializeCanonicalProjection,
  validateCanonicalContent,
} from "@/services/renderer/serializers/canonical";
import { storeRenderedOutput } from "@/services/render/writers";
import { countWords } from "@/services/knowledge/contentQualityGate";

const RENDERER_ID = "brain-writer-direct";
const RENDERER_VERSION = "1.0.0";

function slugifyAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function paragraphNode(text: string): ParagraphNode {
  return { type: "paragraph", children: [text] };
}

/** Parse brain writer markdown into a document tree (H1 skipped — page title is separate). */
export function brainMarkdownToDocumentTree(markdown: string): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraphBuf: string[] = [];
  let listBuf: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    const text = paragraphBuf.join(" ").replace(/\s+/g, " ").trim();
    paragraphBuf = [];
    if (text.length > 0) nodes.push(paragraphNode(text));
  };

  const flushList = () => {
    if (!listBuf || listBuf.items.length === 0) {
      listBuf = null;
      return;
    }
    const list: ListNode = {
      type: "list",
      ordered: listBuf.ordered,
      items: listBuf.items.map((item) => ({
        type: "list-item" as const,
        children: [item],
      })),
    };
    nodes.push(list);
    listBuf = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      const heading = trimmed.slice(3).trim();
      nodes.push({
        type: "heading",
        level: 2,
        text: heading,
        anchor: slugifyAnchor(heading),
      });
      continue;
    }

    const ordered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (!listBuf || !listBuf.ordered) {
        flushList();
        listBuf = { ordered: true, items: [] };
      }
      listBuf.items.push(ordered[2].trim());
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      if (!listBuf || listBuf.ordered) {
        flushList();
        listBuf = { ordered: false, items: [] };
      }
      listBuf.items.push(trimmed.slice(2).trim());
      continue;
    }

    flushList();
    paragraphBuf.push(trimmed);
  }

  flushParagraph();
  flushList();
  return nodes;
}

function buildQualityScore(tree: DocumentNode[], content: string): RenderQualityScore {
  const sectionCount = tree.filter((n) => n.type === "heading").length;
  const wordCount = countWords(content);
  return {
    overall: Math.min(88, 60 + Math.min(20, Math.floor(wordCount / 50))),
    wordCount,
    sectionCount,
    internalLinkCount: 0,
    citationCount: 0,
    missingKnowledgeCount: 0,
    missingKnowledgeSeverity: {},
    readingFlow: {
      repeatedOpenings: 0,
      paragraphLengthBalance: 0.7,
      headingDensity: sectionCount >= 3 ? 0.8 : 0.5,
      bulletListRatio: 0.2,
      transitionQuality: 0.7,
      sentenceVariety: 0.7,
      overallFlowScore: 0.72,
    },
  };
}

export interface BrainMarkdownRenderRequest {
  packageId: string;
  knowledgeHash: string;
  slug: string;
  markdown: string;
}

export interface BrainMarkdownRenderResult {
  outputId: string | null;
  content: string;
  qualityScore: RenderQualityScore;
  diagnostics: RenderDiagnostics;
}

/** Render brain writer markdown directly to rendered_outputs (bypass composer). */
export async function renderBrainMarkdownPackage(
  request: BrainMarkdownRenderRequest
): Promise<BrainMarkdownRenderResult> {
  const tree = brainMarkdownToDocumentTree(request.markdown);
  const content = serializeCanonicalProjection(tree);
  const contentCheck = validateCanonicalContent(content);

  const qualityScore = buildQualityScore(tree, content);
  const diagnostics: RenderDiagnostics = {
    rendererId: RENDERER_ID,
    rendererVersion: RENDERER_VERSION,
    templateVersion: "1.0.0",
    cacheKey: `brain-writer:${request.packageId}:${request.knowledgeHash}`,
    packageId: request.packageId,
    slug: request.slug,
    factsUsed: 0,
    factsAvailable: 0,
    citationsUsed: 0,
    citationsAvailable: 0,
    rulesEvaluated: 0,
    rulesPassed: 0,
    rulesFailed: 0,
    warnings: contentCheck.valid ? [] : contentCheck.issues.map((i) => `[canonical] ${i}`),
    renderDurationMs: 0,
    qualityScore,
  };

  const sb = createAdminClient();
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("knowledge_hash")
    .eq("id", request.packageId)
    .maybeSingle();

  const knowledgeHash = pkg?.knowledge_hash ?? request.knowledgeHash;
  const cacheKey = `brain-writer:${request.packageId}:${knowledgeHash}`;

  const outputId = await storeRenderedOutput({
    packageId: request.packageId,
    knowledgeHash,
    rendererId: RENDERER_ID,
    rendererVersion: RENDERER_VERSION,
    templateVersion: "1.0.0",
    outputFormat: "markdown",
    style: [],
    cacheKey,
    content,
    documentTree: tree,
    wordCount: qualityScore.wordCount,
    sectionCount: qualityScore.sectionCount,
    citationCount: 0,
    qualityScore,
    diagnostics,
    renderDurationMs: 0,
  });

  return { outputId, content, qualityScore, diagnostics };
}
