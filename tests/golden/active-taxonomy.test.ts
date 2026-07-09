import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PHASE_1_ACTIVE_SUBCATEGORY_SLUGS,
  filterNavCategories,
  isActiveSubcategorySlug,
  isTopicInActiveTaxonomy,
} from "../../config/activeTaxonomy";

describe("active-taxonomy-phase1", () => {
  it("locks phase 1 to six subcategories across tech and finance", () => {
    assert.equal(PHASE_1_ACTIVE_SUBCATEGORY_SLUGS.length, 6);
    assert.ok(isActiveSubcategorySlug("programming"));
    assert.ok(isActiveSubcategorySlug("web-development"));
    assert.ok(isActiveSubcategorySlug("artificial-intelligence"));
    assert.ok(isActiveSubcategorySlug("investing"));
    assert.ok(isActiveSubcategorySlug("mutual-funds"));
    assert.ok(isActiveSubcategorySlug("stock-market"));
    assert.ok(!isActiveSubcategorySlug("travel-planning"));
    assert.ok(!isActiveSubcategorySlug("budget-travel"));
  });

  it("filters nav to active categories and subs only", () => {
    const filtered = filterNavCategories([
      {
        slug: "technology",
        subcategories: [
          { slug: "programming", name: "Programming" },
          { slug: "mobile-development", name: "Mobile Development" },
        ],
      },
      {
        slug: "travel",
        subcategories: [{ slug: "destinations", name: "Destinations" }],
      },
    ] as any);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].slug, "technology");
    assert.equal(filtered[0].subcategories.length, 1);
    assert.equal(filtered[0].subcategories[0].slug, "programming");
  });

  it("scopes brain publish to active taxonomy branches", () => {
    assert.ok(isTopicInActiveTaxonomy("technology", "web-development"));
    assert.ok(isTopicInActiveTaxonomy("personal-finance", "mutual-funds"));
    assert.ok(!isTopicInActiveTaxonomy("technology", "cybersecurity"));
    assert.ok(!isTopicInActiveTaxonomy("travel", "destinations"));
    assert.ok(!isTopicInActiveTaxonomy("business", "marketing"));
  });
});
