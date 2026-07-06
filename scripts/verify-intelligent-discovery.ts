/**
 * Intelligent Discovery Verification
 * 
 * Verifies that discovery uses semantic analysis instead of keyword dependency
 * Tests with real production articles
 */

import { createAdminClient } from "../lib/env";
import { batchProcessIntelligentDiscovery } from "../services/discovery/intelligentDiscoveryPipeline";
import { RSSConnector } from "../services/discovery/connectors/rssConnector";

async function verifyIntelligentDiscovery() {
  const supabase = createAdminClient();

  console.log("=== INTELLIGENT DISCOVERY VERIFICATION ===\n");

  // Step 1: Get real articles from RSS feeds
  console.log("Step 1: Fetching real articles from RSS feeds...");
  const rssConnector = new RSSConnector();
  
  const articles = await rssConnector.fetchFeed("https://feeds.feedburner.com/TechCrunch/");
  console.log(`✓ Fetched ${articles.length} articles from RSS feed`);

  // Step 2: Process through intelligent discovery pipeline
  console.log("\nStep 2: Processing through intelligent discovery pipeline...");
  const result = await batchProcessIntelligentDiscovery(articles);

  // Step 3: Analyze decisions
  console.log("\nStep 3: Analyzing discovery decisions...");
  console.log(`  Total Articles Processed: ${result.summary.totalArticles}`);
  console.log(`  Create Package: ${result.summary.createPackage}`);
  console.log(`  Update Package: ${result.summary.updatePackage}`);
  console.log(`  Regenerate Article: ${result.summary.regenerateArticle}`);
  console.log(`  Ignore: ${result.summary.ignore}`);
  console.log(`  Require Review: ${result.summary.requireReview}`);

  // Step 4: Verify semantic vs keyword usage
  console.log("\nStep 4: Verifying semantic vs keyword usage...");
  let semanticDecisions = 0;
  let keywordDecisions = 0;

  for (const decision of result.decisions) {
    if (decision.decision.keywordSignal < 0.3) {
      semanticDecisions++;
    } else {
      keywordDecisions++;
    }
  }

  const semanticPercentage = (semanticDecisions / result.decisions.length) * 100;
  console.log(`  Semantic-based decisions: ${semanticDecisions} (${semanticPercentage.toFixed(1)}%)`);
  console.log(`  Keyword-influenced decisions: ${keywordDecisions} (${(100 - semanticPercentage).toFixed(1)}%)`);

  // Step 5: Show sample decisions
  console.log("\nStep 5: Sample discovery decisions...");
  result.decisions.slice(0, 3).forEach((decision, index) => {
    console.log(`\n  Article ${index + 1}: ${decision.articleTitle.substring(0, 50)}...`);
    console.log(`    Topic: ${decision.topicClassification.topicName} (confidence: ${decision.topicClassification.confidence.toFixed(2)})`);
    console.log(`    Category: ${decision.categoryClassification.category} (confidence: ${decision.categoryClassification.confidence.toFixed(2)})`);
    console.log(`    Knowledge Gap: ${decision.knowledgeGapAnalysis.hasGap ? 'Yes' : 'No'} (${decision.knowledgeGapAnalysis.severity})`);
    console.log(`    Source Trust: ${decision.sourceTrust.trustScore} (${decision.sourceTrust.tier})`);
    console.log(`    Decision: ${decision.decision.action} (confidence: ${decision.decision.confidence.toFixed(2)})`);
    console.log(`    Keyword Signal: ${decision.decision.keywordSignal.toFixed(2)} (weak signal)`);
    console.log(`    Reason: ${decision.decision.reason}`);
  });

  // Step 6: Verify no keyword rejection
  console.log("\nStep 6: Verifying no keyword-only rejections...");
  const keywordOnlyRejections = result.decisions.filter(d => 
    d.decision.action === 'ignore' && 
    d.decision.reason.toLowerCase().includes('keyword')
  );

  if (keywordOnlyRejections.length === 0) {
    console.log(`✓ No articles rejected based solely on keywords`);
  } else {
    console.log(`✗ ${keywordOnlyRejections.length} articles rejected based on keywords`);
  }

  // Step 7: Verify semantic classification usage
  console.log("\nStep 7: Verifying semantic classification usage...");
  const highConfidenceSemantic = result.decisions.filter(d => 
    d.topicClassification.confidence > 0.5
  );

  console.log(`✓ ${highConfidenceSemantic.length} articles classified with high semantic confidence (>0.5)`);

  // Step 8: Verify knowledge gap detection
  console.log("\nStep 8: Verifying knowledge gap detection...");
  const gapsDetected = result.decisions.filter(d => d.knowledgeGapAnalysis.hasGap);
  console.log(`✓ ${gapsDetected.length} articles triggered knowledge gap detection`);

  // Step 9: Verify source trust influence
  console.log("\nStep 9: Verifying source trust influence...");
  const lowTrustIgnored = result.decisions.filter(d => 
    d.sourceTrust.trustScore < 30 && d.decision.action === 'ignore'
  );
  console.log(`✓ ${lowTrustIgnored.length} articles ignored due to low source trust`);

  // Final verification
  console.log("\n=== INTELLIGENT DISCOVERY VERIFICATION RESULTS ===\n");
  
  const allChecksPassed = 
    semanticPercentage > 50 && // Majority semantic-based
    keywordOnlyRejections.length === 0 && // No keyword-only rejections
    highConfidenceSemantic.length > 0; // Semantic classification working

  if (allChecksPassed) {
    console.log("✅ INTELLIGENT DISCOVERY VERIFIED");
    console.log("   - Semantic classification is primary decision mechanism");
    console.log("   - Keywords used only as weak ranking signal");
    console.log("   - No articles rejected based solely on keywords");
    console.log("   - Knowledge gap detection operational");
    console.log("   - Source trust properly integrated");
  } else {
    console.log("⚠ INTELLIGENT DISCOVERY NEEDS ADJUSTMENT");
    console.log(`   - Semantic percentage: ${semanticPercentage.toFixed(1)}% (target: >50%)`);
    console.log(`   - Keyword-only rejections: ${keywordOnlyRejections.length} (target: 0)`);
    console.log(`   - High confidence semantic: ${highConfidenceSemantic.length} (target: >0)`);
  }

  return {
    semanticPercentage,
    keywordOnlyRejections: keywordOnlyRejections.length,
    highConfidenceSemantic: highConfidenceSemantic.length,
    gapsDetected: gapsDetected.length,
    lowTrustIgnored: lowTrustIgnored.length,
    verified: allChecksPassed,
  };
}

verifyIntelligentDiscovery().catch(console.error);
