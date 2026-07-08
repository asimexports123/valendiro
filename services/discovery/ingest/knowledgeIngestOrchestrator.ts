/**
 * @architecture-frozen — Discovery ingest orchestrator.
 * Connector.fetch → Adapter.normalize → persist discovered_articles (unchanged schema).
 */

import type { KnowledgeIngestResult, RegisteredKnowledgeSource } from "./types";
import { toRegisteredKnowledgeSource } from "./types";
import { knowledgeSourceRegistry } from "./knowledgeSourceRegistry";
import { persistDiscoveredArticleDrafts } from "./persistDiscoveredArticleDrafts";
import { updateSourceError, updateSourceLastFetched } from "./sourceLifecycle";

export { toRegisteredKnowledgeSource };

export async function runKnowledgeIngestForSource(
  sourceInput: RegisteredKnowledgeSource | Record<string, unknown>
): Promise<KnowledgeIngestResult> {
  const source =
    "source_type" in sourceInput && "id" in sourceInput
      ? (sourceInput as RegisteredKnowledgeSource)
      : toRegisteredKnowledgeSource(sourceInput as Record<string, unknown>);

  const { connector, adapter } = knowledgeSourceRegistry.get(source.source_type);

  if (connector.prepare) {
    await connector.prepare(source);
  }

  const batch = await connector.fetch(source);
  const drafts = batch.items.map((item) => adapter.normalize(item, source));

  const result = await persistDiscoveredArticleDrafts(source.id, drafts);
  await updateSourceLastFetched(source.id);

  return result;
}

export async function runKnowledgeIngestForSourceWithErrorHandling(
  sourceInput: RegisteredKnowledgeSource | Record<string, unknown>
): Promise<KnowledgeIngestResult & { status: "success" | "failed"; error: string | null }> {
  const source =
    "source_type" in sourceInput && "id" in sourceInput
      ? (sourceInput as RegisteredKnowledgeSource)
      : toRegisteredKnowledgeSource(sourceInput as Record<string, unknown>);

  try {
    const result = await runKnowledgeIngestForSource(source);
    return { ...result, status: "success", error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await updateSourceError(source.id, errorMessage);
    return {
      saved: 0,
      duplicates: 0,
      errors: 0,
      failed: 0,
      status: "failed",
      error: errorMessage,
    };
  }
}
