/**
 * Web Knowledge Seeker — purpose-driven internet acquisition.
 *
 * Every crawl answers a known knowledge gap.
 * Catalog drives discovery; the web supplies evidence.
 */

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import type { CandidateInput } from "@/services/knowledge/types";
import { getSubjectRegistry } from "@/config/subjectSourceRegistry";
import { ProductionAcquisitionService } from "@/services/acquisition/productionAcquisitionService";
import type { PackageGapReport } from "./packageGapAnalyzer";
import { getStructuredDocCandidate } from "@/services/knowledge/structuredDocCandidates";

/** Known high-authority URLs keyed by topic slug — purpose-built acquisition. */
const AUTHORITY_URLS: Record<string, { url: string; name: string; authority: CandidateInput["sourceAuthority"] }[]> = {
  "java-lambdas": [
    { url: "https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html", name: "Oracle Java Tutorial", authority: "official" },
    { url: "https://en.wikipedia.org/wiki/Anonymous_function", name: "Wikipedia Lambda", authority: "encyclopedic" },
  ],
  "rust-ownership": [
    { url: "https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html", name: "The Rust Book", authority: "official" },
    { url: "https://en.wikipedia.org/wiki/Rust_(programming_language)", name: "Wikipedia Rust", authority: "encyclopedic" },
  ],
  "rust-traits": [
    { url: "https://doc.rust-lang.org/book/ch10-02-traits.html", name: "The Rust Book Traits", authority: "official" },
  ],
  "aws-ec2": [
    { url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html", name: "AWS EC2 Docs", authority: "official" },
    { url: "https://en.wikipedia.org/wiki/Amazon_Elastic_Compute_Cloud", name: "Wikipedia EC2", authority: "encyclopedic" },
  ],
  "aws-s3": [
    { url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html", name: "AWS S3 Docs", authority: "official" },
  ],
  "aws-eks": [
    { url: "https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html", name: "AWS EKS Docs", authority: "official" },
  ],
  "azure-functions": [
    { url: "https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview", name: "Azure Functions Docs", authority: "official" },
  ],
  "ci-cd-github-actions": [
    { url: "https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions", name: "GitHub Actions Docs", authority: "official" },
  ],
  "javascript-promises": [
    { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises", name: "MDN Promises", authority: "official" },
  ],
  "javascript-fundamentals": [
    { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", name: "MDN JS Guide", authority: "official" },
  ],
  "html-fundamentals": [
    { url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", name: "MDN HTML", authority: "official" },
  ],
  "css-fundamentals": [
    { url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics", name: "MDN CSS", authority: "official" },
  ],
  "restful-apis": [
    { url: "https://developer.mozilla.org/en-US/docs/Glossary/REST", name: "MDN REST", authority: "official" },
  ],
  "nodejs-cluster": [
    { url: "https://nodejs.org/api/cluster.html", name: "Node.js Cluster Docs", authority: "official" },
  ],
  "design-patterns": [
    { url: "https://en.wikipedia.org/wiki/Software_design_pattern", name: "Wikipedia Design Patterns", authority: "encyclopedic" },
    { url: "https://refactoring.guru/design-patterns/what-is-pattern", name: "Refactoring Guru", authority: "official" },
  ],
  "git-version-control": [
    { url: "https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control", name: "Pro Git Book", authority: "official" },
  ],
  "index-funds": [
    { url: "https://www.investopedia.com/terms/i/indexfund.asp", name: "Investopedia Index Funds", authority: "encyclopedic" },
    { url: "https://en.wikipedia.org/wiki/Index_fund", name: "Wikipedia Index Fund", authority: "encyclopedic" },
  ],
  "mutual-fund-fundamentals": [
    { url: "https://www.investopedia.com/terms/m/mutualfund.asp", name: "Investopedia Mutual Fund", authority: "encyclopedic" },
    { url: "https://en.wikipedia.org/wiki/Mutual_fund", name: "Wikipedia Mutual Fund", authority: "encyclopedic" },
    { url: "https://www.investopedia.com/terms/n/nav.asp", name: "Investopedia NAV", authority: "encyclopedic" },
  ],
  "retirement-planning": [
    { url: "https://www.investopedia.com/terms/r/retirement-planning.asp", name: "Investopedia Retirement Planning", authority: "encyclopedic" },
    { url: "https://en.wikipedia.org/wiki/Retirement_planning", name: "Wikipedia Retirement Planning", authority: "encyclopedic" },
  ],
  "emergency-fund": [
    { url: "https://www.investopedia.com/terms/e/emergency_fund.asp", name: "Investopedia Emergency Fund", authority: "encyclopedic" },
  ],
  "credit-score": [
    { url: "https://www.investopedia.com/terms/c/credit_score.asp", name: "Investopedia Credit Score", authority: "encyclopedic" },
    { url: "https://en.wikipedia.org/wiki/Credit_score", name: "Wikipedia Credit Score", authority: "encyclopedic" },
  ],
  budgeting: [
    { url: "https://www.investopedia.com/terms/b/budget.asp", name: "Investopedia Budget", authority: "encyclopedic" },
    { url: "https://en.wikipedia.org/wiki/Budget", name: "Wikipedia Budget", authority: "encyclopedic" },
  ],
  "health-insurance": [
    { url: "https://en.wikipedia.org/wiki/Health_insurance", name: "Wikipedia Health Insurance", authority: "encyclopedic" },
  ],
  "travel-planning": [
    { url: "https://en.wikivoyage.org/wiki/Tips_for_travel_in_developing_countries", name: "Wikivoyage Travel Tips", authority: "encyclopedic" },
  ],
  "project-management": [
    { url: "https://en.wikipedia.org/wiki/Project_management", name: "Wikipedia Project Management", authority: "encyclopedic" },
  ],
  "data-structures": [
    { url: "https://en.wikipedia.org/wiki/Data_structure", name: "Wikipedia Data Structures", authority: "encyclopedic" },
  ],
  "algorithms-fundamentals": [
    { url: "https://en.wikipedia.org/wiki/Algorithm", name: "Wikipedia Algorithm", authority: "encyclopedic" },
  ],
  "machine-learning-fundamentals": [
    { url: "https://en.wikipedia.org/wiki/Machine_learning", name: "Wikipedia Machine Learning", authority: "encyclopedic" },
  ],
  "business-process-automation": [
    { url: "https://en.wikipedia.org/wiki/Business_process_automation", name: "Wikipedia BPA", authority: "encyclopedic" },
  ],
  "docker-containers": [
    { url: "https://docs.docker.com/get-started/overview/", name: "Docker Overview", authority: "official" },
    { url: "https://en.wikipedia.org/wiki/Docker_(software)", name: "Wikipedia Docker", authority: "encyclopedic" },
  ],
  "nextjs-framework": [
    { url: "https://nextjs.org/docs", name: "Next.js Docs", authority: "official" },
  ],
  "typescript-language": [
    { url: "https://www.typescriptlang.org/docs/handbook/intro.html", name: "TypeScript Handbook", authority: "official" },
  ],
  "react-library": [
    { url: "https://react.dev/learn", name: "React Learn", authority: "official" },
  ],
  "sql-fundamentals": [
    { url: "https://developer.mozilla.org/en-US/docs/Glossary/SQL", name: "MDN SQL", authority: "official" },
    { url: "https://en.wikipedia.org/wiki/SQL", name: "Wikipedia SQL", authority: "encyclopedic" },
  ],
  "software-testing": [
    { url: "https://en.wikipedia.org/wiki/Software_testing", name: "Wikipedia Software Testing", authority: "encyclopedic" },
  ],
  nutrition: [
    { url: "https://en.wikipedia.org/wiki/Nutrition", name: "Wikipedia Nutrition", authority: "encyclopedic" },
  ],
  "mental-health": [
    { url: "https://en.wikipedia.org/wiki/Mental_health", name: "Wikipedia Mental Health", authority: "encyclopedic" },
  ],
};

const CATEGORY_AUTHORITY_DOMAINS: Record<string, string[]> = {
  technology: ["developer.mozilla.org", "docs.python.org", "nodejs.org", "git-scm.com", "wikipedia.org", "doc.rust-lang.org", "docs.aws.amazon.com", "docs.github.com"],
  "personal-finance": ["investopedia.com", "nerdwallet.com", "wikipedia.org"],
  "health-wellness": ["nih.gov", "cdc.gov", "wikipedia.org"],
  business: ["wikipedia.org", "hbr.org"],
  education: ["wikipedia.org"],
  travel: ["wikivoyage.org", "wikipedia.org"],
};

function toCandidate(
  title: string,
  content: string,
  sourceUrl: string,
  adapterName: string,
  sourceAuthority: CandidateInput["sourceAuthority"],
  meta: Record<string, unknown> = {}
): CandidateInput {
  return {
    id: uuidv4(),
    title,
    description: content,
    sourceUrl,
    discoveryRunId: uuidv4(),
    adapterName,
    sourceSlug: new URL(sourceUrl).hostname.replace("www.", ""),
    sourceAuthority,
    metadata: meta,
  };
}

async function extractPageText(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ValendiroKnowledgeBot/1.0 (+https://valendiro.com; educational knowledge acquisition)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
    if (!response.ok) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article?.textContent && article.textContent.trim().length > 300) {
      return {
        title: article.title ?? url,
        content: article.textContent.trim().slice(0, 25000),
      };
    }

    const body = dom.window.document.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (body.length > 300) {
      return { title: dom.window.document.title ?? url, content: body.slice(0, 25000) };
    }
    return null;
  } catch {
    return null;
  }
}

/** Wikipedia open search → full plain-text extract (not just summary). */
async function fetchWikipediaFull(query: string): Promise<CandidateInput | null> {
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as [string, string[], string[], string[]];
    const titles = searchData[1] ?? [];
    if (titles.length === 0) return null;

    const title = titles[0];
    const extractRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=false&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!extractRes.ok) return null;
    const extractData = (await extractRes.json()) as {
      query?: { pages?: Record<string, { title?: string; extract?: string }> };
    };
    const pages = Object.values(extractData.query?.pages ?? {});
    const page = pages[0];
    if (!page?.extract || page.extract.length < 200) return null;

    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title ?? title)}`;
    return toCandidate(
      page.title ?? title,
      page.extract.slice(0, 20000),
      url,
      "wikipedia-api",
      "encyclopedic",
      { gapQuery: query, wikiSearch: titles }
    );
  } catch {
    return null;
  }
}

async function searchWeb(query: string, preferredDomains: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const domain of preferredDomains.slice(0, 2)) {
    try {
      const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${query} site:${domain}`)}`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ValendiroKnowledgeBot/1.0)" },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) continue;
      const html = await res.text();
      const linkRegex = /uddg=([^&"]+)/g;
      let match;
      while ((match = linkRegex.exec(html)) !== null && urls.length < 4) {
        try {
          const decoded = decodeURIComponent(match[1]);
          if (decoded.startsWith("http") && !urls.includes(decoded)) urls.push(decoded);
        } catch {
          /* skip */
        }
      }
    } catch {
      /* next */
    }
  }
  return urls.slice(0, 3);
}

function knowledgePackageToCandidates(
  knowledge: Record<string, unknown[]>,
  sourceName: string,
  sourceUrl: string
): CandidateInput[] {
  const parts: string[] = [];
  for (const [key, items] of Object.entries(knowledge)) {
    if (key === "metadata" || !Array.isArray(items)) continue;
    for (const item of items) {
      if (typeof item === "object" && item !== null) {
        const text =
          (item as { definition?: string }).definition ??
          (item as { description?: string }).description ??
          (item as { title?: string }).title ??
          (item as { name?: string }).name ??
          "";
        if (typeof text === "string" && text.length > 20) parts.push(text);
      }
    }
  }
  if (parts.length === 0) return [];
  return [
    toCandidate(sourceName, parts.join(". "), sourceUrl, "doc-connector", "official", {
      acquiredForGap: true,
    }),
  ];
}

/**
 * Seek knowledge on the internet to fill known gaps for a topic.
 */
export async function seekKnowledgeForGaps(gapReport: PackageGapReport): Promise<CandidateInput[]> {
  const candidates: CandidateInput[] = [];
  const seenUrls = new Set<string>();

  const push = (c: CandidateInput | null) => {
    if (!c?.sourceUrl || seenUrls.has(c.sourceUrl)) return;
    if (!c.description || c.description.length < 100) return;
    seenUrls.add(c.sourceUrl);
    candidates.push(c);
  };

  // 0. Curated structured docs (highest quality, no scrape noise)
  const structured = getStructuredDocCandidate(gapReport.slug, gapReport.title);
  if (structured) {
    push(structured);
  }

  // 1. Known authority URLs for this exact slug (highest leverage)
  for (const src of AUTHORITY_URLS[gapReport.slug] ?? []) {
    const extracted = await extractPageText(src.url);
    if (extracted) {
      push(toCandidate(extracted.title || src.name, extracted.content, src.url, "authority-map", src.authority));
    }
  }

  // 2. Subject source registry connectors
  const registry = getSubjectRegistry(gapReport.slug);
  if (registry) {
    try {
      const acquisition = new ProductionAcquisitionService();
      const result = await acquisition.acquireKnowledgePackage(gapReport.slug);
      if (result.success && result.knowledgePackage) {
        for (const source of registry.sources.filter((s) => s.status === "ACTIVE")) {
          for (const c of knowledgePackageToCandidates(result.knowledgePackage, source.name, source.url)) {
            push(c);
          }
        }
      }
    } catch {
      /* continue */
    }

    // Direct fetch registry URLs if connector path was thin
    if (candidates.length < 2) {
      for (const source of registry.sources.filter((s) => s.status === "ACTIVE").slice(0, 2)) {
        const extracted = await extractPageText(source.url);
        if (extracted) {
          push(toCandidate(extracted.title || source.name, extracted.content, source.url, "registry-fetch", "official"));
        }
      }
    }
  }

  // 3. Wikipedia full articles via search (works for almost any topic)
  const wikiQueries = [
    gapReport.title,
    gapReport.slug.replace(/-/g, " "),
    gapReport.slug.replace(/-fundamentals$/, "").replace(/-/g, " "),
    ...gapReport.searchQueries.slice(0, 2),
  ];
  for (const q of [...new Set(wikiQueries)]) {
    const wiki = await fetchWikipediaFull(q);
    push(wiki);
    if (candidates.length >= 3) break;
  }

  // 4. Gap-driven site-restricted search
  const domains =
    CATEGORY_AUTHORITY_DOMAINS[gapReport.categorySlug ?? ""] ?? CATEGORY_AUTHORITY_DOMAINS.technology;

  for (const query of gapReport.searchQueries.slice(0, 2)) {
    if (candidates.length >= 5) break;
    const urls = await searchWeb(query, domains);
    for (const url of urls) {
      if (seenUrls.has(url)) continue;
      const extracted = await extractPageText(url);
      if (!extracted) continue;
      const host = new URL(url).hostname.replace("www.", "");
      push(
        toCandidate(extracted.title, extracted.content, url, "gap-driven-search", domains.some((d) => host.includes(d)) ? "official" : "encyclopedic", {
          gapQuery: query,
        })
      );
    }
  }

  return candidates;
}
