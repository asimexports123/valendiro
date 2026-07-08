/**
 * Knowledge Admission Engine
 *
 * Decides before any asset becomes topic, entity, package, or published page:
 * - enrich existing catalog topic
 * - permanent evergreen knowledge
 * - archive transient news
 * - reject low-value content
 */

import {
  detectContentClass,
  findEnrichmentTopicHints,
  scoreEvergreenSignals,
  scoreNewsSignals,
  shouldReject,
  type ContentClass,
} from "./admissionRules";

export type AdmissionAction =
  | "enrich_existing"      // Match catalog — add facts silently, no headline takeover
  | "permanent_knowledge"  // Evergreen — full enrich + publish path if matched
  | "archive_news"         // Transient — store archived, never publish as topic page
  | "reject";              // Discard — no permanent knowledge effect

export interface AdmissionInput {
  title: string;
  content?: string | null;
  summary?: string | null;
  url?: string;
}

export interface AdmissionDecision {
  action: AdmissionAction;
  contentClass: ContentClass;
  evergreenScore: number;
  newsScore: number;
  reason: string;
  allowPublish: boolean;
  allowGraphProjection: boolean;
  enrichOnly: boolean;
  enrichmentTopicHints: string[];
}

export function evaluateAdmission(input: AdmissionInput): AdmissionDecision {
  const title = (input.title ?? "").trim();
  const body = [input.summary, input.content].filter(Boolean).join("\n").slice(0, 4000);

  const rejectCheck = shouldReject(title);
  if (rejectCheck.reject) {
    return {
      action: "reject",
      contentClass: "unknown",
      evergreenScore: 0,
      newsScore: 0,
      reason: rejectCheck.reason ?? "Rejected by admission rules",
      allowPublish: false,
      allowGraphProjection: false,
      enrichOnly: false,
      enrichmentTopicHints: [],
    };
  }

  const newsScore = scoreNewsSignals(title);
  const evergreenScore = scoreEvergreenSignals(title);
  const contentClass = detectContentClass(title, body);
  const enrichmentTopicHints = findEnrichmentTopicHints(title, body);

  // CEO examples: "Java Lambdas", "Index Funds" → permanent
  if (evergreenScore >= 0.45 && newsScore < 0.35) {
    return {
      action: "permanent_knowledge",
      contentClass: contentClass === "unknown" ? "evergreen" : contentClass,
      evergreenScore,
      newsScore,
      reason: "Evergreen concept — eligible for permanent catalog enrichment",
      allowPublish: true,
      allowGraphProjection: true,
      enrichOnly: false,
      enrichmentTopicHints,
    };
  }

  // Product updates: "GitHub releases Copilot update" → enrich only
  if (contentClass === "product_update" || (newsScore >= 0.3 && enrichmentTopicHints.length > 0)) {
    return {
      action: "enrich_existing",
      contentClass: contentClass === "unknown" ? "product_update" : contentClass,
      evergreenScore,
      newsScore,
      reason: "Product/event update — enrich existing topic, do not create permanent news page",
      allowPublish: false,
      allowGraphProjection: false,
      enrichOnly: true,
      enrichmentTopicHints,
    };
  }

  // Transient news: "Chevy built EV truck", "Startup Battlefield closes July 6"
  if (newsScore >= 0.4 || contentClass === "transient_news" || contentClass === "event_announcement") {
    return {
      action: "archive_news",
      contentClass,
      evergreenScore,
      newsScore,
      reason: "Transient news/event — archive fuel only, not a permanent knowledge topic",
      allowPublish: false,
      allowGraphProjection: false,
      enrichOnly: enrichmentTopicHints.length > 0,
      enrichmentTopicHints,
    };
  }

  // Unknown — conservative: defer as fuel, don't publish headline as page
  if (newsScore > evergreenScore) {
    return {
      action: "archive_news",
      contentClass: "unknown",
      evergreenScore,
      newsScore,
      reason: "Ambiguous content skews news — archived to protect catalog quality",
      allowPublish: false,
      allowGraphProjection: false,
      enrichOnly: false,
      enrichmentTopicHints,
    };
  }

  return {
    action: "permanent_knowledge",
    contentClass: "evergreen",
    evergreenScore,
    newsScore,
    reason: "Default evergreen admission — catalog match required for publish",
    allowPublish: true,
    allowGraphProjection: true,
    enrichOnly: false,
    enrichmentTopicHints,
  };
}

/** Returns true if asset metadata marks it as archived news (exclude from enrichment). */
export function isArchivedNewsAsset(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  return metadata.admission_action === "archive_news" || metadata.archived_news === true;
}

/** Returns true if asset was rejected by admission. */
export function isRejectedAsset(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  return metadata.admission_action === "reject";
}
