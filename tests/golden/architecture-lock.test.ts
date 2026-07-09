/**
 * Golden integration tests — permanent architecture guards.
 * Run: npm run test:golden
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ARCHITECTURE_LOCKED,
  DEMAND_PIPELINE_FROZEN,
  FROZEN_DEMAND_ACTIONS,
  isFrozenDemandAction,
} from "../../lib/architecture/frozen";

const ROOT = join(import.meta.dirname, "../..");

describe("golden-00-architecture-lock", () => {
  it("architecture is locked", () => {
    assert.equal(ARCHITECTURE_LOCKED, true);
    assert.equal(DEMAND_PIPELINE_FROZEN, true);
  });

  it("demand actions are frozen", () => {
    assert.ok(isFrozenDemandAction("demand_run"));
    assert.ok(isFrozenDemandAction("publish_queue"));
    assert.ok(!isFrozenDemandAction("quality_audit"));
    assert.equal(FROZEN_DEMAND_ACTIONS.length, 3);
  });

  it("vercel.json has only discovery cron (no autonomous-pipeline)", () => {
    const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as {
      crons: { path: string }[];
    };
    const paths = vercel.crons.map((c) => c.path);
    assert.ok(paths.includes("/api/cron/discovery-pipeline"));
    assert.ok(!paths.includes("/api/cron/autonomous-pipeline"));
  });

  it("autonomous-pipeline route returns 410 guard (source check)", () => {
    const src = readFileSync(
      join(ROOT, "app/api/cron/autonomous-pipeline/route.ts"),
      "utf8"
    );
    assert.match(src, /status: 410/);
    assert.match(src, /DEMAND_PIPELINE_FROZEN|RETIRED/);
    assert.doesNotMatch(src, /batchAutoGenerate/);
  });

  it("canonical writer modules carry frozen headers", () => {
    const files = [
      "services/knowledge/packageService.ts",
      "services/knowledge/graphService.ts",
      "services/render/writers.ts",
      "services/publish/writers.ts",
      "services/discovery/articlePipeline.ts",
    ];
    for (const f of files) {
      const src = readFileSync(join(ROOT, f), "utf8");
      assert.match(src, /@architecture-frozen/, `${f} missing frozen header`);
    }
  });

  it("ARCHITECTURE_FROZEN.md exists", () => {
    const doc = readFileSync(join(ROOT, "docs/ARCHITECTURE_FROZEN.md"), "utf8");
    assert.match(doc, /LOCKED/);
    assert.match(doc, /Golden rule/);
  });
});
