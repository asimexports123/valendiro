/**
 * Golden tests — Phase 2 knowledge_assets migration.
 * Run: npm run test:golden
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  draftToKnowledgeAssetInsert,
  rowToDiscoveredArticleLogical,
  validateKnowledgeAssetBeforeSave,
  KNOWLEDGE_ASSET_TABLE,
  type KnowledgeAssetRow,
} from "../../services/discovery/ingest/knowledgeAssetCompat";
import type { KnowledgeAssetDraft } from "../../services/discovery/ingest/types";

const ROOT = join(import.meta.dirname, "../..");

const SAMPLE_DRAFT: KnowledgeAssetDraft = {
  schema_version: "1.0",
  external_id: "ext-123",
  title: "Sample Article Title",
  content: "<p>Full article body</p>",
  summary: "Short summary",
  url: "https://example.com/article",
  published_at: "2024-06-01T12:00:00.000Z",
  author: "Jane Doe",
  metadata: { feed: "test-feed", category: "tech" },
  provenance: {
    connector_type: "rss",
    connector_version: "1.0.0",
    adapter_type: "rss",
    adapter_version: "1.0.0",
  },
};

describe("golden-02-knowledge-assets-phase2", () => {
  it("draftToKnowledgeAssetInsert preserves logical fields for pipeline", () => {
    const row = draftToKnowledgeAssetInsert("source-uuid", SAMPLE_DRAFT);

    assert.equal(row.source_id, "source-uuid");
    assert.equal(row.external_id, SAMPLE_DRAFT.external_id);
    assert.equal(row.schema_version, "1.0");
    assert.equal(row.asset_kind, "text");
    assert.equal(row.title, SAMPLE_DRAFT.title);
    assert.equal(row.content, SAMPLE_DRAFT.content);
    assert.equal(row.summary, SAMPLE_DRAFT.summary);
    assert.equal(row.url, SAMPLE_DRAFT.url);
    assert.equal(row.published_at, SAMPLE_DRAFT.published_at);
    assert.equal(row.author, SAMPLE_DRAFT.author);
    assert.equal(row.status, "pending");
    assert.deepEqual(row.metadata, SAMPLE_DRAFT.metadata);
    assert.deepEqual(row.provenance, SAMPLE_DRAFT.provenance);
    assert.equal(row.payload.text, SAMPLE_DRAFT.content);
    assert.equal(row.payload.uri, SAMPLE_DRAFT.url);
    assert.ok(Array.isArray(row.payload.referenced_sources));
    assert.equal(row.payload.referenced_sources.length, 1);
    assert.equal(row.labels.title, SAMPLE_DRAFT.title);
    assert.equal(row.labels.description, SAMPLE_DRAFT.summary);
  });

  it("rowToDiscoveredArticleLogical round-trips denormalized columns", () => {
    const insert = draftToKnowledgeAssetInsert("source-uuid", SAMPLE_DRAFT);
    const row: KnowledgeAssetRow = {
      id: "asset-uuid-1",
      ...insert,
    };

    const logical = rowToDiscoveredArticleLogical(row);

    assert.equal(logical.id, "asset-uuid-1");
    assert.equal(logical.source_id, "source-uuid");
    assert.equal(logical.title, SAMPLE_DRAFT.title);
    assert.equal(logical.content, SAMPLE_DRAFT.content);
    assert.equal(logical.summary, SAMPLE_DRAFT.summary);
    assert.equal(logical.url, SAMPLE_DRAFT.url);
    assert.equal(logical.status, "pending");
    assert.equal(logical.processing_started_at, null);
    assert.deepEqual(logical.metadata, SAMPLE_DRAFT.metadata);
  });

  it("rowToDiscoveredArticleLogical falls back to payload and labels", () => {
    const row: KnowledgeAssetRow = {
      id: "asset-uuid-2",
      source_id: "source-uuid",
      external_id: null,
      schema_version: "1.0",
      asset_kind: "text",
      payload: { text: "Payload body", uri: "https://example.com/payload" },
      labels: { title: "Label Title", description: "Label summary" },
      provenance: {},
      title: "",
      content: null,
      summary: null,
      url: "",
      published_at: null,
      author: null,
      metadata: { source: "payload-only" },
      status: "pending",
    };

    const logical = rowToDiscoveredArticleLogical(row);

    assert.equal(logical.title, "Label Title");
    assert.equal(logical.content, "Payload body");
    assert.equal(logical.summary, "Label summary");
    assert.equal(logical.url, "https://example.com/payload");
  });

  it("validateKnowledgeAssetBeforeSave rejects empty text or missing sources", () => {
    const valid = draftToKnowledgeAssetInsert("source-uuid", SAMPLE_DRAFT);
    assert.equal(validateKnowledgeAssetBeforeSave(valid).valid, true);

    const emptyText = {
      ...valid,
      payload: { ...valid.payload, text: "   ", referenced_sources: valid.payload.referenced_sources },
    };
    assert.equal(validateKnowledgeAssetBeforeSave(emptyText).valid, false);
    assert.match(validateKnowledgeAssetBeforeSave(emptyText).reason ?? "", /payload\.text is empty/);

    const noSources = {
      ...valid,
      payload: { ...valid.payload, referenced_sources: [] },
    };
    assert.equal(validateKnowledgeAssetBeforeSave(noSources).valid, false);
    assert.match(validateKnowledgeAssetBeforeSave(noSources).reason ?? "", /referenced_sources array is empty/);
  });

  it("migration SQL exists with key Phase 2 elements", () => {
    const migrationPath = join(
      ROOT,
      "supabase/migrations/20260708140000_knowledge_assets_phase2.sql"
    );
    assert.ok(existsSync(migrationPath), "Phase 2 migration file must exist");

    const sql = readFileSync(migrationPath, "utf8");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS knowledge_assets/);
    assert.match(sql, /schema_version/);
    assert.match(sql, /asset_kind/);
    assert.match(sql, /provenance/);
    assert.match(sql, /INSERT INTO knowledge_assets/);
    assert.match(sql, /DROP TABLE discovered_articles/);
    assert.match(sql, /CREATE OR REPLACE VIEW discovered_articles/);
    assert.match(sql, /REFERENCES knowledge_assets\(id\)/);
  });

  it("runtime services use KNOWLEDGE_ASSET_TABLE not raw discovered_articles writes", () => {
    const runtimeFiles = [
      "services/discovery/articlePipeline.ts",
      "jobs/workers/discoveryWorker.ts",
      "services/discovery/monitoring.ts",
      "services/discovery/topicDetection.ts",
      "services/discovery/incrementalRegeneration.ts",
      "services/discovery/ingest/persistDiscoveredArticleDrafts.ts",
    ];

    for (const rel of runtimeFiles) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      assert.match(
        src,
        /KNOWLEDGE_ASSET_TABLE/,
        `${rel} must reference KNOWLEDGE_ASSET_TABLE`
      );
      assert.doesNotMatch(
        src,
        /\.from\(["']discovered_articles["']\)/,
        `${rel} must not use .from("discovered_articles")`
      );
    }

    assert.equal(KNOWLEDGE_ASSET_TABLE, "knowledge_assets");
  });

  it("incrementalRegeneration joins knowledge_assets not discovered_articles", () => {
    const src = readFileSync(
      join(ROOT, "services/discovery/incrementalRegeneration.ts"),
      "utf8"
    );
    assert.match(src, /knowledge_assets\(status, created_at\)/);
    assert.doesNotMatch(src, /discovered_articles\(status/);
  });

  it("ingest index exports compat helpers", () => {
    const src = readFileSync(join(ROOT, "services/discovery/ingest/index.ts"), "utf8");
    assert.match(src, /draftToKnowledgeAssetInsert/);
    assert.match(src, /rowToDiscoveredArticleLogical/);
    assert.match(src, /KNOWLEDGE_ASSET_TABLE/);
  });
});
