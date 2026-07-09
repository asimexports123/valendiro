import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCompoundInterest } from "../../lib/tools/compoundInterestMath";
import { calculateBmi } from "../../lib/tools/bmiMath";
import { calculatePositionSize } from "../../lib/tools/positionSizeMath";
import { CATALOG_TOOLS, getToolsForTopic } from "../../config/toolsRegistry";

describe("tools-math-and-registry", () => {
  it("compound interest grows principal", () => {
    const r = calculateCompoundInterest({
      principal: 10000,
      annualReturnPercent: 8,
      years: 10,
      compoundsPerYear: 12,
    });
    assert.ok(r.futureValue > r.principal);
    assert.equal(r.totalInterest, r.futureValue - r.principal);
  });

  it("bmi categorises healthy weight", () => {
    const r = calculateBmi({ weightKg: 70, heightCm: 170 });
    assert.ok(r.bmi > 20 && r.bmi < 25);
    assert.equal(r.category, "Healthy weight");
  });

  it("position size respects risk budget", () => {
    const r = calculatePositionSize({
      portfolioValue: 100000,
      riskPercent: 1,
      entryPrice: 50,
      stopLossPrice: 45,
    });
    assert.equal(r.riskAmount, 1000);
    assert.equal(r.shares, 200);
    assert.equal(r.positionValue, 10000);
  });

  it("getToolsForTopic links subcategory tools and topic pins", () => {
    const indexTools = getToolsForTopic("index-funds", "investing");
    assert.ok(indexTools.some((t) => t.slug === "compound-interest-calculator"));
    const nutritionTools = getToolsForTopic("some-nutrition-topic", "nutrition");
    assert.ok(nutritionTools.some((t) => t.slug === "bmi-calculator"));
    const unrelated = getToolsForTopic("travel-planning", "travel");
    assert.equal(unrelated.length, 0);
  });

  it("every active subcategory has at least one tool", () => {
    const subs = [
      "programming",
      "web-development",
      "artificial-intelligence",
      "investing",
      "mutual-funds",
      "stock-market",
      "nutrition",
      "fitness",
      "mental-health",
    ];
    for (const sub of subs) {
      const count = CATALOG_TOOLS.filter((t) => t.subcategorySlug === sub).length;
      assert.ok(count >= 1, `missing tool for ${sub}`);
    }
  });
});
