/**
 * Coverage Engine
 * 
 * Compares expected coverage vs existing topics
 * Detects missing topics
 * Calculates coverage percentage
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";
import { getCoverageTemplate, CoverageTemplate } from "./coverageTemplate";

const supabase = getAdminClient();

export interface CoverageAnalysis {
  domainId: string;
  domainName: string;
  expectedTopics: number;
  existingTopics: number;
  missingTopics: string[];
  coveragePercentage: number;
  modules: ModuleCoverage[];
}

export interface ModuleCoverage {
  moduleName: string;
  expectedTopics: number;
  existingTopics: number;
  missingTopics: string[];
  coveragePercentage: number;
}

/**
 * Analyze coverage for a domain
 */
export async function analyzeCoverage(domainId: string): Promise<CoverageAnalysis> {
  const template = getCoverageTemplate(domainId);
  if (!template) {
    throw new Error(`No coverage template found for domain: ${domainId}`);
  }

  // Get all existing topics
  const { data: topics } = await supabase
    .from("topics")
    .select("slug, title")
    .eq("status", "published");

  const existingTopicSlugs = new Set(topics?.map(t => t.slug) || []);

  // Analyze each module
  const modules: ModuleCoverage[] = [];
  let totalExpected = 0;
  let totalExisting = 0;
  const allMissingTopics: string[] = [];

  for (const module of template.modules) {
    const moduleExpected = module.expectedTopics;
    const moduleMissing: string[] = [];

    for (const pattern of module.topicPatterns) {
      if (!existingTopicSlugs.has(pattern)) {
        moduleMissing.push(pattern);
        allMissingTopics.push(pattern);
      }
    }

    const moduleExisting = moduleExpected - moduleMissing.length;
    const moduleCoverage = (moduleExisting / moduleExpected) * 100;

    modules.push({
      moduleName: module.moduleName,
      expectedTopics: moduleExpected,
      existingTopics: moduleExisting,
      missingTopics: moduleMissing,
      coveragePercentage: moduleCoverage
    });

    totalExpected += moduleExpected;
    totalExisting += moduleExisting;
  }

  const coveragePercentage = (totalExisting / totalExpected) * 100;

  return {
    domainId: template.domainId,
    domainName: template.domainName,
    expectedTopics: totalExpected,
    existingTopics: totalExisting,
    missingTopics: allMissingTopics,
    coveragePercentage,
    modules
  };
}

/**
 * Analyze coverage for all domains
 */
export async function analyzeAllDomainsCoverage(): Promise<CoverageAnalysis[]> {
  const { getAllCoverageTemplates } = await import("./coverageTemplate");
  const templates = getAllCoverageTemplates();

  const analyses: CoverageAnalysis[] = [];

  for (const template of templates) {
    try {
      const analysis = await analyzeCoverage(template.domainId);
      analyses.push(analysis);
    } catch (error) {
      console.error(`Error analyzing coverage for ${template.domainId}:`, error);
    }
  }

  return analyses;
}

/**
 * Check if domain has significant gaps
 * Significant gap = coverage < 80%
 */
export function hasSignificantGaps(analysis: CoverageAnalysis): boolean {
  return analysis.coveragePercentage < 80;
}

/**
 * Get domains with significant gaps
 */
export async function getDomainsWithGaps(): Promise<CoverageAnalysis[]> {
  const analyses = await analyzeAllDomainsCoverage();
  return analyses.filter(analysis => hasSignificantGaps(analysis));
}
