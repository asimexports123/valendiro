import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateSip } from "../../lib/tools/sipMath";

describe("sip-calculator-math", () => {
  it("returns zero growth when rate is 0%", () => {
    const r = calculateSip({ monthlyInvestment: 1000, annualReturnPercent: 0, years: 5 });
    assert.equal(r.totalInvested, 60000);
    assert.equal(r.maturityAmount, 60000);
    assert.equal(r.estimatedReturns, 0);
    assert.equal(r.months, 60);
  });

  it("computes positive compounding for typical SIP inputs", () => {
    const r = calculateSip({ monthlyInvestment: 10000, annualReturnPercent: 12, years: 10 });
    assert.equal(r.totalInvested, 1200000);
    assert.ok(r.maturityAmount > r.totalInvested);
    assert.ok(r.estimatedReturns > 0);
  });
});
