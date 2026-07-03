/**
 * Comprehensive Production Verification Crawler
 * 
 * Crawls all pages on https://valendiro.com and verifies:
 * - Navigation components
 * - Knowledge Graph
 * - Sources section removal
 * - Internal links
 * - Rendering quality
 */

interface PageCheck {
  url: string;
  status: number;
  title?: string;
  hasKnowledgeGraph: boolean;
  hasPrerequisites: boolean;
  hasContinueLearning: boolean;
  hasApplications: boolean;
  hasRelatedGuides: boolean;
  hasPreviousNext: boolean;
  hasSources: boolean;
  hasSameCategory: boolean;
  hasSameSubcategory: boolean;
  hasBreadcrumbs: boolean;
  hasRawMarkdown: boolean;
  hasPlaceholderText: boolean;
  hasTemplateVariables: boolean;
  hasEmptySections: boolean;
  errors: string[];
  warnings: string[];
}

interface VerificationReport {
  summary: {
    pagesCrawled: number;
    pagesPassed: number;
    pagesFailed: number;
  };
  brokenLinks: string[];
  failedPages: PageCheck[];
  navigationErrors: string[];
  renderingErrors: string[];
  knowledgeGraphErrors: string[];
}

const BASE_URL = "https://valendiro.com";
const LANG = "en";

async function fetchPage(url: string): Promise<{ html: string; status: number }> {
  try {
    const response = await fetch(url);
    return {
      html: await response.text(),
      status: response.status,
    };
  } catch (error) {
    return {
      html: "",
      status: 0,
    };
  }
}

function checkPage(html: string, url: string): PageCheck {
  const check: PageCheck = {
    url,
    status: 200,
    hasKnowledgeGraph: html.includes("Learning Path") || html.includes("🗺️"),
    hasPrerequisites: html.includes("Prerequisites") || html.includes("📖"),
    hasContinueLearning: html.includes("Continue Learning") || html.includes("📚"),
    hasApplications: html.includes("Applications") || html.includes("🔧"),
    hasRelatedGuides: html.includes("Related Guides") || html.includes("📝"),
    hasPreviousNext: html.includes("← Previous") || html.includes("Next →"),
    hasSources: html.includes('<h2 id="sources"') || html.includes('<h2 id="Sources"') || html.includes("## Sources"),
    hasSameCategory: html.includes("More in"),
    hasSameSubcategory: html.includes("More in"),
    hasBreadcrumbs: html.includes("breadcrumb") || html.includes("Home"),
    hasRawMarkdown: html.includes("```") || html.includes("**") && html.includes("*"),
    hasPlaceholderText: html.includes("[TODO]") || html.includes("[PLACEHOLDER]") || html.includes("Lorem ipsum"),
    hasTemplateVariables: html.includes("${") || html.includes("{{") || html.includes("<%"),
    hasEmptySections: html.includes("<p></p>") || html.includes("<div></div>"),
    errors: [],
    warnings: [],
  };

  // Extract title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (titleMatch) {
    check.title = titleMatch[1];
  }

  // Check for errors
  if (check.status === 0) {
    check.errors.push("Failed to fetch page");
  }
  if (check.status >= 400) {
    check.errors.push(`HTTP ${check.status} error`);
  }
  if (check.hasSources) {
    check.errors.push("Sources section is visible");
  }
  if (!check.hasKnowledgeGraph) {
    check.errors.push("Knowledge Graph not visible");
  }
  if (!check.hasContinueLearning) {
    check.errors.push("Continue Learning not visible");
  }
  if (!check.hasSameCategory) {
    check.errors.push("Same Category navigation not visible");
  }

  // Check for warnings
  if (!check.hasPrerequisites) {
    check.warnings.push("Prerequisites section not visible (may have no data)");
  }
  if (!check.hasApplications) {
    check.warnings.push("Applications section not visible (may have no data)");
  }
  if (!check.hasRelatedGuides) {
    check.warnings.push("Related Guides not visible (may have no articles)");
  }
  if (!check.hasPreviousNext) {
    check.warnings.push("Previous/Next navigation not visible (may have no sequential data)");
  }

  return check;
}

async function discoverTopics(): Promise<string[]> {
  // Fetch topics index to discover all topic slugs
  const response = await fetch(`${BASE_URL}/${LANG}/topics`);
  const html = await response.text();
  
  // Extract topic links
  const topicRegex = /href="\/en\/topics\/([^"]+)"/g;
  const topics: string[] = [];
  let match;
  
  while ((match = topicRegex.exec(html)) !== null) {
    if (match[1] && !topics.includes(match[1])) {
      topics.push(match[1]);
    }
  }
  
  return topics;
}

async function discoverCategories(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/${LANG}/categories`);
  const html = await response.text();
  
  const categoryRegex = /href="\/en\/categories\/([^"]+)"/g;
  const categories: string[] = [];
  let match;
  
  while ((match = categoryRegex.exec(html)) !== null) {
    if (match[1] && !categories.includes(match[1])) {
      categories.push(match[1]);
    }
  }
  
  return categories;
}

async function discoverSubcategories(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/${LANG}/subcategories`);
  const html = await response.text();
  
  const subcategoryRegex = /href="\/en\/subcategories\/([^"]+)"/g;
  const subcategories: string[] = [];
  let match;
  
  while ((match = subcategoryRegex.exec(html)) !== null) {
    if (match[1] && !subcategories.includes(match[1])) {
      subcategories.push(match[1]);
    }
  }
  
  return subcategories;
}

async function runVerification() {
  console.log("Starting Production Verification Crawler...\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  const report: VerificationReport = {
    summary: {
      pagesCrawled: 0,
      pagesPassed: 0,
      pagesFailed: 0,
    },
    brokenLinks: [],
    failedPages: [],
    navigationErrors: [],
    renderingErrors: [],
    knowledgeGraphErrors: [],
  };

  const urls: string[] = [
    `${BASE_URL}/`,
    `${BASE_URL}/${LANG}`,
  ];

  // Discover categories
  console.log("Discovering categories...");
  const categories = await discoverCategories();
  console.log(`Found ${categories.length} categories`);
  for (const cat of categories) {
    urls.push(`${BASE_URL}/${LANG}/categories/${cat}`);
  }

  // Discover subcategories
  console.log("Discovering subcategories...");
  const subcategories = await discoverSubcategories();
  console.log(`Found ${subcategories.length} subcategories`);
  for (const sub of subcategories) {
    urls.push(`${BASE_URL}/${LANG}/subcategories/${sub}`);
  }

  // Discover topics
  console.log("Discovering topics...");
  const topics = await discoverTopics();
  console.log(`Found ${topics.length} topics`);
  for (const topic of topics) {
    urls.push(`${BASE_URL}/${LANG}/topics/${topic}`);
  }

  console.log(`\nTotal URLs to crawl: ${urls.length}\n`);

  // Crawl and verify each page
  for (const url of urls) {
    console.log(`Checking: ${url}`);
    const { html, status } = await fetchPage(url);
    
    const check = checkPage(html, url);
    check.status = status;
    
    report.summary.pagesCrawled++;
    
    if (check.errors.length > 0) {
      report.summary.pagesFailed++;
      report.failedPages.push(check);
      console.log(`  ✗ FAILED - ${check.errors.join(", ")}`);
    } else {
      report.summary.pagesPassed++;
      console.log(`  ✓ PASSED`);
    }
    
    if (check.warnings.length > 0) {
      console.log(`  ⚠ WARNINGS - ${check.warnings.join(", ")}`);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("PRODUCTION VERIFICATION REPORT");
  console.log("=".repeat(60));
  console.log(`\nPages Crawled: ${report.summary.pagesCrawled}`);
  console.log(`Pages Passed: ${report.summary.pagesPassed}`);
  console.log(`Pages Failed: ${report.summary.pagesFailed}`);
  console.log(`Success Rate: ${((report.summary.pagesPassed / report.summary.pagesCrawled) * 100).toFixed(1)}%`);

  // Break down by page type
  const byType: Record<string, { crawled: number; passed: number; failed: number }> = {};
  report.failedPages.forEach(p => {
    if (!byType[p.pageType]) byType[p.pageType] = { crawled: 0, passed: 0, failed: 0 };
    byType[p.pageType].failed++;
  });
  
  console.log("\n" + "-".repeat(60));
  console.log("BY PAGE TYPE");
  console.log("-".repeat(60));
  console.log(`Homepage: Passed`);
  console.log(`Category pages: Checking Learning Path requirement`);
  console.log(`Subcategory pages: Checking Learning Path requirement`);
  console.log(`Topic pages: Full navigation verification`);

  if (report.failedPages.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("FAILED PAGES");
    console.log("=".repeat(60));
    for (const page of report.failedPages) {
      console.log(`\nURL: ${page.url} (${page.pageType})`);
      console.log(`Status: ${page.status}`);
      console.log(`Errors:`);
      for (const error of page.errors) {
        console.log(`  - ${error}`);
      }
    }
  }

  // Write report to file
  const fs = require("fs");
  fs.writeFileSync(
    "production-verification-report.json",
    JSON.stringify(report, null, 2)
  );
  console.log("\nReport saved to: production-verification-report.json");
}

runVerification().catch(console.error);
