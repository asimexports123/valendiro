/**
 * Comprehensive Production Verification Crawler
 */

interface PageCheck {
  url: string;
  pageType: "homepage" | "category" | "subcategory" | "topic";
  status: number;
  hasKnowledgeGraph: boolean;
  hasContinueLearning: boolean;
  hasSources: boolean;
  hasSameCategory: boolean;
  hasLearningPath: boolean;
  errors: string[];
  warnings: string[];
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

function getPageType(url: string): "homepage" | "category" | "subcategory" | "topic" {
  if (url === `${BASE_URL}/` || url === `${BASE_URL}/${LANG}`) return "homepage";
  if (url.includes("/categories/")) return "category";
  if (url.includes("/subcategories/")) return "subcategory";
  return "topic";
}

function checkPage(html: string, url: string): PageCheck {
  const pageType = getPageType(url);
  
  const check: PageCheck = {
    url,
    pageType,
    status: 200,
    hasKnowledgeGraph: html.includes("Learning Path") || html.includes("🗺️"),
    hasContinueLearning: html.includes("Continue Learning") || html.includes("📚"),
    hasSources: html.includes('<h2 id="sources"') || html.includes('<h2 id="Sources"') || html.includes("## Sources"),
    hasSameCategory: html.includes("More in"),
    hasLearningPath: html.includes("Learning Path") || html.includes("Recommended Learning Journey"),
    errors: [],
    warnings: [],
  };

  if (check.status === 0) check.errors.push("Failed to fetch page");
  if (check.status >= 400) check.errors.push(`HTTP ${check.status} error`);
  if (check.hasSources) check.errors.push("Sources section is visible");

  if (pageType === "topic") {
    if (!check.hasKnowledgeGraph) check.errors.push("Knowledge Graph not visible");
    if (!check.hasContinueLearning) check.errors.push("Continue Learning not visible");
    if (!check.hasSameCategory) check.errors.push("Same Category navigation not visible");
  } else if (pageType === "category" || pageType === "subcategory") {
    if (!check.hasLearningPath) check.errors.push("Learning Path not visible");
  }

  return check;
}

async function discoverTopics(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/${LANG}/topics`);
  const html = await response.text();
  const topicRegex = /href="\/en\/topics\/([^"]+)"/g;
  const topics: string[] = [];
  let match;
  while ((match = topicRegex.exec(html)) !== null) {
    if (match[1] && !topics.includes(match[1])) topics.push(match[1]);
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
    if (match[1] && !categories.includes(match[1])) categories.push(match[1]);
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
    if (match[1] && !subcategories.includes(match[1])) subcategories.push(match[1]);
  }
  return subcategories;
}

async function runVerification() {
  console.log("Starting Production Verification Crawler...\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  const report = {
    summary: { pagesCrawled: 0, pagesPassed: 0, pagesFailed: 0 },
    failedPages: [] as PageCheck[],
  };

  const urls: string[] = [`${BASE_URL}/`, `${BASE_URL}/${LANG}`];

  const categories = await discoverCategories();
  console.log(`Found ${categories.length} categories`);
  for (const cat of categories) urls.push(`${BASE_URL}/${LANG}/categories/${cat}`);

  const subcategories = await discoverSubcategories();
  console.log(`Found ${subcategories.length} subcategories`);
  for (const sub of subcategories) urls.push(`${BASE_URL}/${LANG}/subcategories/${sub}`);

  const topics = await discoverTopics();
  console.log(`Found ${topics.length} topics`);
  for (const topic of topics) urls.push(`${BASE_URL}/${LANG}/topics/${topic}`);

  console.log(`\nTotal URLs to crawl: ${urls.length}\n`);

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
  }

  console.log("\n" + "=".repeat(60));
  console.log("PRODUCTION VERIFICATION REPORT");
  console.log("=".repeat(60));
  console.log(`\nPages Crawled: ${report.summary.pagesCrawled}`);
  console.log(`Pages Passed: ${report.summary.pagesPassed}`);
  console.log(`Pages Failed: ${report.summary.pagesFailed}`);
  console.log(`Success Rate: ${((report.summary.pagesPassed / report.summary.pagesCrawled) * 100).toFixed(1)}%`);

  if (report.failedPages.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("FAILED PAGES");
    console.log("=".repeat(60));
    for (const page of report.failedPages) {
      console.log(`\nURL: ${page.url} (${page.pageType})`);
      console.log(`Status: ${page.status}`);
      console.log(`Errors:`);
      for (const error of page.errors) console.log(`  - ${error}`);
    }
  }

  const fs = require("fs");
  fs.writeFileSync("production-verification-report.json", JSON.stringify(report, null, 2));
  console.log("\nReport saved to: production-verification-report.json");
}

runVerification().catch(console.error);
