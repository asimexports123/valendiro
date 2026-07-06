/**
 * Configure Category/Keyword Mapping for Valendiro RSS Feed
 */

import { createAdminClient } from "../lib/env";

async function configureValendiroKeywords() {
  const supabase = createAdminClient();

  console.log("=== Configuring Valendiro Category/Keyword Mapping ===\n");

  // Get the Valendiro RSS source
  const { data: sourceData } = await supabase
    .from("discovery_system_sources")
    .select("*")
    .eq("url", "https://rss.app/feeds/ttkOFf3GgYwCzcQU.xml")
    .single();

  if (!sourceData) {
    console.error("Valendiro RSS source not found");
    return;
  }

  console.log(`Found source: ${sourceData.name} (ID: ${sourceData.id})`);

  // Configure enhanced keyword mapping
  const enhancedConfig = {
    category: "valendiro",
    keyword_based: true,
    fetch_interval_minutes: 60,
    keyword_mapping: {
      finance: ["personal finance", "budgeting", "investment", "savings", "financial planning", "money management"],
      business: ["business innovation", "entrepreneurship", "startup", "company", "corporate", "business strategy"],
      technology: ["tech", "innovation", "digital", "software", "AI", "automation"],
      health: ["health", "wellness", "medical", "fitness", "nutrition"],
      lifestyle: ["lifestyle", "productivity", "self-improvement", "career", "education"],
    },
    priority_keywords: ["innovation", "award", "best", "top", "guide", "tutorial", "how to"],
    exclude_keywords: ["advertisement", "sponsored", "promo"],
    content_requirements: {
      min_content_length: 200,
      preferred_content_length: 1000,
      require_summary: true,
    },
  };

  // Update the source with enhanced configuration
  const { data: updatedSource, error } = await supabase
    .from("discovery_system_sources")
    .update({
      config: enhancedConfig,
      metadata: {
        ...sourceData.metadata,
        configured_at: new Date().toISOString(),
        keyword_categories: Object.keys(enhancedConfig.keyword_mapping).length,
        total_keywords: Object.values(enhancedConfig.keyword_mapping).flat().length,
      },
    })
    .eq("id", sourceData.id)
    .select("*")
    .single();

  if (error) {
    console.error(`Failed to update source: ${error.message}`);
    return;
  }

  console.log(`\n✓ Category/Keyword mapping configured successfully`);
  console.log(`  Categories: ${Object.keys(enhancedConfig.keyword_mapping).join(", ")}`);
  console.log(`  Total keywords: ${Object.values(enhancedConfig.keyword_mapping).flat().length}`);
  console.log(`  Priority keywords: ${enhancedConfig.priority_keywords.length}`);
  console.log(`  Content requirements: min ${enhancedConfig.content_requirements.min_content_length} chars`);

  // Display the configuration
  console.log(`\nKeyword Mapping:`);
  Object.entries(enhancedConfig.keyword_mapping).forEach(([category, keywords]) => {
    console.log(`  ${category}: ${keywords.slice(0, 3).join(", ")}${keywords.length > 3 ? "..." : ""}`);
  });

  console.log(`\nPriority Keywords: ${enhancedConfig.priority_keywords.join(", ")}`);
  console.log(`Exclude Keywords: ${enhancedConfig.exclude_keywords.join(", ")}`);

  console.log("\n=== Configuration Complete ===");
  console.log(`✅ Valendiro RSS feed is now configured with category-based keyword mapping for targeted discovery`);
}

configureValendiroKeywords().catch(console.error);
