/**
 * Phase 19 Step 5: Production Verification (30+ topics on live site)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const topics = JSON.parse(readFileSync(resolve(__dirname, "phase19-published-topics.json"), "utf-8"));

const BASE_URL = "https://valendiro.com";

interface PageCheck {
  url: string;
  slug: string;
  title: string;
  status: number;
  navigationWorks: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  hasContinueLearning: boolean;
  hasRelatedTopics: boolean;
  hasKnowledgeGraph: boolean;
  hasDeadEnd: boolean;
  hasBrokenLinks: boolean;
  hasEmptyRecommendations: boolean;
  errors: string[];
}

async function checkPage(url: string, slug: string, title: string): Promise<PageCheck> {
  const check: PageCheck = {
    url,
    slug,
    title,
    status: 0,
    navigationWorks: false,
    hasPrevious: false,
    hasNext: false,
    hasContinueLearning: false,
    hasRelatedTopics: false,
    hasKnowledgeGraph: false,
    hasDeadEnd: false,
    hasBrokenLinks: false,
    hasEmptyRecommendations: false,
    errors: [],
  };

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    check.status = response.status;

    if (!response.ok) {
      check.errors.push(`HTTP ${response.status}`);
      return check;
    }

    const html = await response.text();

    // Check for navigation elements
    check.navigationWorks = html.includes('Previous') || html.includes('Next') || html.includes('Continue Learning');
    check.hasPrevious = html.includes('Previous');
    check.hasNext = html.includes('Next');
    check.hasContinueLearning = html.includes('Continue Learning');
    check.hasRelatedTopics = html.includes('Related Topics') || html.includes('Related');
    check.hasKnowledgeGraph = html.includes('Knowledge Graph') || html.includes('knowledge-graph');
    
    // Check for dead ends (no navigation at all)
    check.hasDeadEnd = !check.hasPrevious && !check.hasNext && !check.hasContinueLearning && !check.hasRelatedTopics;
    
    // Check for broken links (404 links in content)
    check.hasBrokenLinks = html.includes('404') || html.includes('Not Found');
    
    // Check for empty recommendation sections
    check.hasEmptyRecommendations = html.includes('No related topics') || html.includes('No recommendations');

    if (check.hasDeadEnd) {
      check.errors.push('Dead end - no navigation');
    }
    if (check.hasBrokenLinks) {
      check.errors.push('Potential broken links');
    }
    if (check.hasEmptyRecommendations) {
      check.errors.push('Empty recommendation sections');
    }

  } catch (error: any) {
    check.errors.push(`Fetch error: ${error.message}`);
  }

  return check;
}

async function runProductionVerification() {
  console.log("=== Phase 19: Production Verification (Live Site) ===\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Topics to check: ${topics.length}\n`);

  const checks: PageCheck[] = [];
  const topicsToCheck = topics; // Check all 47 topics

  for (let i = 0; i < topicsToCheck.length; i++) {
    const topic = topicsToCheck[i];
    const url = `${BASE_URL}/topics/${topic.slug}`;
    
    console.log(`Checking ${i + 1}/${topicsToCheck.length}: ${topic.slug}`);
    
    const check = await checkPage(url, topic.slug, topic.slug);
    checks.push(check);
    
    if (check.errors.length > 0) {
      console.log(`  ✗ Errors: ${check.errors.join(', ')}`);
    } else {
      console.log(`  ✓ OK`);
    }
  }

  // Statistics
  const successful = checks.filter(c => c.status === 200);
  const withNavigation = checks.filter(c => c.navigationWorks);
  const withPrevious = checks.filter(c => c.hasPrevious);
  const withNext = checks.filter(c => c.hasNext);
  const withContinue = checks.filter(c => c.hasContinueLearning);
  const withRelated = checks.filter(c => c.hasRelatedTopics);
  const withKnowledgeGraph = checks.filter(c => c.hasKnowledgeGraph);
  const deadEnds = checks.filter(c => c.hasDeadEnd);
  const withBrokenLinks = checks.filter(c => c.hasBrokenLinks);
  const withEmptyRecs = checks.filter(c => c.hasEmptyRecommendations);

  console.log(`\n=== PRODUCTION VERIFICATION RESULTS ===`);
  console.log(`Total pages checked: ${checks.length}`);
  console.log(`Successful (200): ${successful.length}/${checks.length}`);
  console.log(`Navigation works: ${withNavigation.length}/${checks.length} (${((withNavigation.length/checks.length)*100).toFixed(1)}%)`);
  console.log(`Has Previous: ${withPrevious.length}/${checks.length}`);
  console.log(`Has Next: ${withNext.length}/${checks.length}`);
  console.log(`Has Continue Learning: ${withContinue.length}/${checks.length}`);
  console.log(`Has Related Topics: ${withRelated.length}/${checks.length}`);
  console.log(`Has Knowledge Graph: ${withKnowledgeGraph.length}/${checks.length}`);
  console.log(`Dead ends: ${deadEnds.length}/${checks.length}`);
  console.log(`Potential broken links: ${withBrokenLinks.length}/${checks.length}`);
  console.log(`Empty recommendations: ${withEmptyRecs.length}/${checks.length}`);

  console.log(`\n=== PAGES WITH ISSUES ===`);
  const issues = checks.filter(c => c.errors.length > 0);
  if (issues.length === 0) {
    console.log("None ✓");
  } else {
    issues.forEach(issue => {
      console.log(`- ${issue.slug}`);
      console.log(`  ${issue.errors.join(', ')}`);
    });
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalChecked: checks.length,
    statistics: {
      successful: successful.length,
      withNavigation: withNavigation.length,
      withPrevious: withPrevious.length,
      withNext: withNext.length,
      withContinue: withContinue.length,
      withRelated: withRelated.length,
      withKnowledgeGraph: withKnowledgeGraph.length,
      deadEnds: deadEnds.length,
      withBrokenLinks: withBrokenLinks.length,
      withEmptyRecs: withEmptyRecs.length,
    },
    urls: checks.map(c => ({
      url: c.url,
      slug: c.slug,
      status: c.status,
      navigationWorks: c.navigationWorks,
      hasPrevious: c.hasPrevious,
      hasNext: c.hasNext,
      hasContinueLearning: c.hasContinueLearning,
      hasRelatedTopics: c.hasRelatedTopics,
      hasKnowledgeGraph: c.hasKnowledgeGraph,
      hasDeadEnd: c.hasDeadEnd,
      hasBrokenLinks: c.hasBrokenLinks,
      hasEmptyRecommendations: c.hasEmptyRecommendations,
      errors: c.errors,
    })),
  };

  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase19-production-verification.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(`\nDetailed report saved to: phase19-production-verification.json`);
}

runProductionVerification().catch(console.error);
runProductionVerification().catch(console.error);
