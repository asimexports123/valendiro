/**
 * Production Hardening - Phase 4
 * Knowledge Package Monitoring
 * 
 * Track:
 * - Packages generated
 * - Packages failed
 * - Validation failures
 * - Coverage trends
 * - Extraction errors
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "../lib/supabase/client";
import { QualityMetricsCalculator } from "../services/qualityMetrics/qualityMetrics";

interface PackageMetrics {
  packagesGenerated: number;
  packagesFailed: number;
  validationFailures: number;
  averageCoverage: number;
  averageCompleteness: number;
  averageAuthority: number;
  averageFreshness: number;
  averageOverallQuality: number;
  extractionErrors: number;
}

async function runKnowledgePackageMonitoring() {
  const timestamp = new Date().toISOString();
  console.log("Knowledge Package Monitoring");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const sb = createClient();
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  const metrics: PackageMetrics = {
    packagesGenerated: 0,
    packagesFailed: 0,
    validationFailures: 0,
    averageCoverage: 0,
    averageCompleteness: 0,
    averageAuthority: 0,
    averageFreshness: 0,
    averageOverallQuality: 0,
    extractionErrors: 0,
  };

  try {
    // Get all knowledge packages
    const { data: packages, error: packagesError } = await sb
      .from("knowledge_packages")
      .select("*");

    if (packagesError) {
      console.error(`Error fetching packages: ${packagesError.message}`);
      return;
    }

    metrics.packagesGenerated = packages?.length || 0;
    console.log(`Total Knowledge Packages: ${metrics.packagesGenerated}`);

    if (!packages || packages.length === 0) {
      console.log("No packages to analyze");
      return;
    }

    // Calculate quality metrics for each package
    const coverageScores: number[] = [];
    const completenessScores: number[] = [];
    const authorityScores: number[] = [];
    const freshnessScores: number[] = [];
    const overallQualityScores: number[] = [];

    for (const pkg of packages) {
      try {
        const qualityMetrics = qualityMetricsCalculator.calculateMetrics(pkg);
        
        coverageScores.push(qualityMetrics.coverageScore);
        completenessScores.push(qualityMetrics.completenessScore);
        authorityScores.push(qualityMetrics.authorityScore);
        freshnessScores.push(qualityMetrics.freshnessScore);
        overallQualityScores.push(qualityMetrics.overallQualityScore);
      } catch (error) {
        console.log(`  ⚠️ Error calculating metrics for package ${pkg.id}`);
      }
    }

    // Calculate averages
    if (coverageScores.length > 0) {
      metrics.averageCoverage = coverageScores.reduce((a, b) => a + b, 0) / coverageScores.length;
      metrics.averageCompleteness = completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length;
      metrics.averageAuthority = authorityScores.reduce((a, b) => a + b, 0) / authorityScores.length;
      metrics.averageFreshness = freshnessScores.reduce((a, b) => a + b, 0) / freshnessScores.length;
      metrics.averageOverallQuality = overallQualityScores.reduce((a, b) => a + b, 0) / overallQualityScores.length;
    }

    // Check for validation failures (packages with low quality)
    const failedPackages = packages.filter(pkg => {
      try {
        const qualityMetrics = qualityMetricsCalculator.calculateMetrics(pkg);
        return qualityMetrics.overallQualityScore < 50;
      } catch {
        return true;
      }
    });

    metrics.validationFailures = failedPackages.length;
    metrics.packagesFailed = failedPackages.length;

    console.log(`Packages Failed: ${metrics.packagesFailed}`);
    console.log(`Average Coverage: ${metrics.averageCoverage.toFixed(1)}`);
    console.log(`Average Completeness: ${metrics.averageCompleteness.toFixed(1)}`);
    console.log(`Average Authority: ${metrics.averageAuthority.toFixed(1)}`);
    console.log(`Average Freshness: ${metrics.averageFreshness.toFixed(1)}`);
    console.log(`Average Overall Quality: ${metrics.averageOverallQuality.toFixed(1)}`);

    // Check for extraction errors (packages with no structured content)
    const emptyPackages = packages.filter((pkg: any) => 
      (!pkg.definitions || pkg.definitions.length === 0) &&
      (!pkg.concepts || pkg.concepts.length === 0) &&
      (!pkg.procedures || pkg.procedures.length === 0)
    );

    metrics.extractionErrors = emptyPackages.length;
    console.log(`Packages with Extraction Errors (empty): ${metrics.extractionErrors}`);

    // Coverage trends by category
    console.log(`\nCoverage by Category:`);
    const categories = [...new Set(packages.map(pkg => pkg.category).filter(Boolean))];
    
    for (const category of categories) {
      const categoryPackages = packages.filter(pkg => pkg.category === category);
      const categoryCoverage = categoryPackages.reduce((sum: number, pkg: any) => {
        try {
          const qualityMetrics = qualityMetricsCalculator.calculateMetrics(pkg);
          return sum + qualityMetrics.coverageScore;
        } catch {
          return sum;
        }
      }, 0) / categoryPackages.length;
      
      console.log(`  ${category}: ${categoryCoverage.toFixed(1)}%`);
    }

    // Recent activity
    console.log(`\nRecent Activity (last 7 days):`);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPackages = packages.filter((pkg: any) => 
      new Date(pkg.metadata?.lastUpdated || pkg.created_at || 0) > sevenDaysAgo
    );

    console.log(`  Packages created/updated: ${recentPackages.length}`);

  } catch (error: any) {
    console.error(`Monitoring failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("MONITORING SUMMARY");
  console.log("=".repeat(60));
  console.log(`Packages Generated: ${metrics.packagesGenerated}`);
  console.log(`Packages Failed: ${metrics.packagesFailed}`);
  console.log(`Validation Failures: ${metrics.validationFailures}`);
  console.log(`Extraction Errors: ${metrics.extractionErrors}`);
  console.log(`Average Coverage: ${metrics.averageCoverage.toFixed(1)}%`);
  console.log(`Average Completeness: ${metrics.averageCompleteness.toFixed(1)}%`);
  console.log(`Average Authority: ${metrics.averageAuthority.toFixed(1)}%`);
  console.log(`Average Freshness: ${metrics.averageFreshness.toFixed(1)}%`);
  console.log(`Average Overall Quality: ${metrics.averageOverallQuality.toFixed(1)}%`);

  return metrics;
}

runKnowledgePackageMonitoring()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Knowledge package monitoring failed:", error);
    process.exit(1);
  });
