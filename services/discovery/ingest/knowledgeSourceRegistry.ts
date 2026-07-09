/**
 * @architecture-frozen — Knowledge source registry (connector + adapter pairs).
 */

import type { KnowledgeConnector, KnowledgeSourceAdapter } from "./types";
import { rssKnowledgeConnector } from "./connectors/rssKnowledgeConnector";
import { rssKnowledgeSourceAdapter } from "./adapters/rssKnowledgeSourceAdapter";
import { feedlyKnowledgeConnector } from "./connectors/feedlyKnowledgeConnector";
import { feedlyKnowledgeSourceAdapter } from "./adapters/feedlyKnowledgeSourceAdapter";

export interface RegisteredSourcePair {
  connector: KnowledgeConnector;
  adapter: KnowledgeSourceAdapter;
}

class KnowledgeSourceRegistry {
  private pairs = new Map<string, RegisteredSourcePair>();

  register(sourceType: string, pair: RegisteredSourcePair): void {
    this.pairs.set(sourceType, pair);
  }

  get(sourceType: string): RegisteredSourcePair {
    const pair = this.pairs.get(sourceType);
    if (!pair) {
      throw new Error(`Unsupported source type: ${sourceType}`);
    }
    return pair;
  }

  has(sourceType: string): boolean {
    return this.pairs.has(sourceType);
  }

  listSourceTypes(): string[] {
    return [...this.pairs.keys()];
  }
}

export const knowledgeSourceRegistry = new KnowledgeSourceRegistry();

knowledgeSourceRegistry.register("rss", {
  connector: rssKnowledgeConnector,
  adapter: rssKnowledgeSourceAdapter,
});

knowledgeSourceRegistry.register("feedly", {
  connector: feedlyKnowledgeConnector,
  adapter: feedlyKnowledgeSourceAdapter,
});
