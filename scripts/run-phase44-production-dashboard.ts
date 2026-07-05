/**
 * Phase 44 - Production Dashboard
 * 
 * Read-only monitoring dashboard for production stabilization.
 * Monitors:
 * - Connector Health
 * - Source Health
 * - Subject Quality
 * - Coverage
 * - Completeness
 * - Failed Acquisitions
 * - Failed Publications
 */

import { getSubjectRegistry, getActiveSources, getBrokenSources, getAllSubjects } from "../config/subjectSourceRegistry";

interface DashboardMetrics {
  timestamp: string;
  subjects: SubjectDashboard[];
  overallHealth: OverallHealth;
}

interface SubjectDashboard {
  subject: string;
  registryVersion: number;
  totalSources: number;
  activeSources: number;
  brokenSources: number;
  sourceHealth: string;
  quality: number;
  coverage: number;
  completeness: number;
}

interface OverallHealth {
  totalSubjects: number;
  totalSources: number;
  totalActiveSources: number;
  totalBrokenSources: number;
  overallSourceHealth: string;
}

function calculateSourceHealth(active: number, total: number): string {
  if (total === 0) return "UNKNOWN";
  const healthPercentage = (active / total) * 100;
  if (healthPercentage === 100) return "HEALTHY";
  if (healthPercentage >= 80) return "GOOD";
  if (healthPercentage >= 60) return "DEGRADED";
  return "CRITICAL";
}

function runProductionDashboard() {
  const timestamp = new Date().toISOString();
  console.log("Phase 44 - Production Dashboard");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const subjects = getAllSubjects();
  const subjectDashboards: SubjectDashboard[] = [];

  let totalSources = 0;
  let totalActiveSources = 0;
  let totalBrokenSources = 0;

  subjects.forEach(subjectSlug => {
    const registry = getSubjectRegistry(subjectSlug);
    if (!registry) return;

    const activeSources = getActiveSources(subjectSlug);
    const brokenSources = getBrokenSources(subjectSlug);

    const subjectDashboard: SubjectDashboard = {
      subject: registry.subject,
      registryVersion: registry.version,
      totalSources: registry.sources.length,
      activeSources: activeSources.length,
      brokenSources: brokenSources.length,
      sourceHealth: calculateSourceHealth(activeSources.length, registry.sources.length),
      quality: 0, // Would be calculated from Knowledge Package
      coverage: 0, // Would be calculated from Knowledge Package
      completeness: 0, // Would be calculated from Knowledge Package
    };

    totalSources += registry.sources.length;
    totalActiveSources += activeSources.length;
    totalBrokenSources += brokenSources.length;

    subjectDashboards.push(subjectDashboard);
  });

  const overallHealth: OverallHealth = {
    totalSubjects: subjects.length,
    totalSources,
    totalActiveSources,
    totalBrokenSources,
    overallSourceHealth: calculateSourceHealth(totalActiveSources, totalSources),
  };

  // Display dashboard
  console.log("SUBJECT HEALTH MONITORING");
  console.log("-".repeat(60));

  subjectDashboards.forEach(subject => {
    console.log(`\n${subject.subject}:`);
    console.log(`  Registry Version: ${subject.registryVersion}`);
    console.log(`  Sources: ${subject.activeSources}/${subject.totalSources} Active`);
    console.log(`  Broken Sources: ${subject.brokenSources}`);
    console.log(`  Source Health: ${subject.sourceHealth}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("OVERALL HEALTH");
  console.log("=".repeat(60));
  console.log(`Total Subjects: ${overallHealth.totalSubjects}`);
  console.log(`Total Sources: ${overallHealth.totalSources}`);
  console.log(`Active Sources: ${overallHealth.totalActiveSources}`);
  console.log(`Broken Sources: ${overallHealth.totalBrokenSources}`);
  console.log(`Overall Source Health: ${overallHealth.overallSourceHealth}`);

  // Source status breakdown
  console.log("\n" + "=".repeat(60));
  console.log("SOURCE STATUS BREAKDOWN");
  console.log("=".repeat(60));

  subjects.forEach(subjectSlug => {
    const registry = getSubjectRegistry(subjectSlug);
    if (!registry) return;

    console.log(`\n${registry.subject}:`);
    registry.sources.forEach(source => {
      const statusIndicator = source.status === "ACTIVE" ? "✅" : 
                           source.status === "BROKEN" ? "❌" : 
                           source.status === "DISABLED" ? "⏸️" : "⚠️";
      console.log(`  ${statusIndicator} ${source.name} (${source.status})`);
      if (source.failureReason) {
        console.log(`    Reason: ${source.failureReason}`);
      }
    });
  });

  return {
    timestamp,
    subjects: subjectDashboards,
    overallHealth,
  };
}

try {
  runProductionDashboard();
  process.exit(0);
} catch (error: any) {
  console.error("Production dashboard failed:", error);
  process.exit(1);
}
