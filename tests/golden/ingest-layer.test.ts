/**
 * Golden tests — Phase 1 ingest layer (connector / adapter / registry).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { knowledgeSourceRegistry } from "../../services/discovery/ingest/knowledgeSourceRegistry";
import { rssKnowledgeSourceAdapter } from "../../services/discovery/ingest/adapters/rssKnowledgeSourceAdapter";
import type { RSSArticle } from "../../services/discovery/ingest/connectors/rssKnowledgeConnector";

const ROOT = join(import.meta.dirname, "../..");

describe("golden-01-ingest-layer", () => {
  it("registry registers rss and feedly", () => {
    assert.ok(knowledgeSourceRegistry.has("rss"));
    assert.ok(knowledgeSourceRegistry.has("feedly"));
    const types = knowledgeSourceRegistry.listSourceTypes();
    assert.deepEqual(types.sort(), ["feedly", "rss"]);
  });

  it("RSS adapter normalize matches legacy normalizeArticle shape", () => {
    const sample: RSSArticle = {
      guid: "guid-1",
      title: "Test Article",
      content: "<p>Full content</p>",
      contentSnippet: "Snippet",
      link: "https://example.com/a",
      pubDate: "Mon, 01 Jan 2024 00:00:00 GMT",
      author: "Author",
      isoDate: "2024-01-01T00:00:00.000Z",
    };

    const legacy = new (class {
      normalizeArticle(a: RSSArticle) {
        return rssKnowledgeSourceAdapter.normalizeArticle(a);
      }
    })().normalizeArticle(sample);

    const draft = rssKnowledgeSourceAdapter.normalize(
      { external_id: sample.guid, raw: sample, fetched_at: "2024-01-01T00:00:00.000Z" },
      {
        id: "src-1",
        source_type: "rss",
        name: "test",
        url: "https://example.com/feed",
        config: {},
        status: "active",
      }
    );

    assert.equal(draft.external_id, legacy.external_id);
    assert.equal(draft.title, legacy.title);
    assert.equal(draft.content, legacy.content);
    assert.equal(draft.summary, legacy.summary);
    assert.equal(draft.url, legacy.url);
    assert.equal(draft.published_at, legacy.published_at);
    assert.equal(draft.author, legacy.author);
    assert.deepEqual(draft.metadata, legacy.metadata);
    assert.equal(draft.schema_version, "1.0");
  });

  it("discovery scheduler delegates to ingest orchestrator", () => {
    const src = readFileSync(join(ROOT, "jobs/schedulers/discoveryScheduler.ts"), "utf8");
    assert.match(src, /runKnowledgeIngestForSourceWithErrorHandling/);
    assert.doesNotMatch(src, /new RSSConnector/);
    assert.doesNotMatch(src, /new FeedlyConnector/);
  });

  it("legacy RSSConnector delegates to ingest layer", () => {
    const src = readFileSync(join(ROOT, "services/discovery/connectors/rssConnector.ts"), "utf8");
    assert.match(src, /persistDiscoveredArticleDrafts/);
    assert.match(src, /rssKnowledgeConnector/);
    assert.doesNotMatch(src, /rss-parser/);
  });
});
