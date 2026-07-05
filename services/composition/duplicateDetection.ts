/**
 * Phase 34: Duplicate Knowledge Detection
 * 
 * Identifies duplicate knowledge across Knowledge Packages
 * Detects repeated definitions, concepts, procedures, warnings, best practices
 */

import type { KnowledgePackage } from "../renderer/types";

export interface DuplicateReport {
  duplicateDefinitions: Array<{ term: string; count: number; packageIds: string[] }>;
  duplicateConcepts: Array<{ name: string; count: number; packageIds: string[] }>;
  duplicateProcedures: Array<{ name: string; count: number; packageIds: string[] }>;
  duplicateWarnings: Array<{ title: string; count: number; packageIds: string[] }>;
  duplicateBestPractices: Array<{ title: string; count: number; packageIds: string[] }>;
  totalDuplicates: number;
}

export class DuplicateDetector {
  detectDuplicates(packages: KnowledgePackage[]): DuplicateReport {
    const report: DuplicateReport = {
      duplicateDefinitions: [],
      duplicateConcepts: [],
      duplicateProcedures: [],
      duplicateWarnings: [],
      duplicateBestPractices: [],
      totalDuplicates: 0,
    };

    // Detect duplicate definitions
    const definitionMap = new Map<string, { packageIds: string[] }>();
    for (const pkg of packages) {
      for (const def of pkg.definitions) {
        const normalizedTerm = def.term.toLowerCase().trim();
        if (!definitionMap.has(normalizedTerm)) {
          definitionMap.set(normalizedTerm, { packageIds: [] });
        }
        definitionMap.get(normalizedTerm)!.packageIds.push(pkg.id);
      }
    }

    for (const [term, data] of definitionMap.entries()) {
      if (data.packageIds.length > 1) {
        report.duplicateDefinitions.push({
          term,
          count: data.packageIds.length,
          packageIds: data.packageIds,
        });
        report.totalDuplicates += data.packageIds.length - 1;
      }
    }

    // Detect duplicate concepts
    const conceptMap = new Map<string, { packageIds: string[] }>();
    for (const pkg of packages) {
      for (const concept of pkg.concepts) {
        const normalizedName = concept.name.toLowerCase().trim();
        if (!conceptMap.has(normalizedName)) {
          conceptMap.set(normalizedName, { packageIds: [] });
        }
        conceptMap.get(normalizedName)!.packageIds.push(pkg.id);
      }
    }

    for (const [name, data] of conceptMap.entries()) {
      if (data.packageIds.length > 1) {
        report.duplicateConcepts.push({
          name,
          count: data.packageIds.length,
          packageIds: data.packageIds,
        });
        report.totalDuplicates += data.packageIds.length - 1;
      }
    }

    // Detect duplicate procedures
    const procedureMap = new Map<string, { packageIds: string[] }>();
    for (const pkg of packages) {
      for (const proc of pkg.procedures) {
        const normalizedSteps = proc.steps.join(" ").toLowerCase().trim();
        const key = `${proc.name.toLowerCase().trim()}:${normalizedSteps.substring(0, 50)}`;
        if (!procedureMap.has(key)) {
          procedureMap.set(key, { packageIds: [] });
        }
        procedureMap.get(key)!.packageIds.push(pkg.id);
      }
    }

    for (const [key, data] of procedureMap.entries()) {
      if (data.packageIds.length > 1) {
        report.duplicateProcedures.push({
          name: key.split(":")[0],
          count: data.packageIds.length,
          packageIds: data.packageIds,
        });
        report.totalDuplicates += data.packageIds.length - 1;
      }
    }

    // Detect duplicate warnings
    const warningMap = new Map<string, { packageIds: string[] }>();
    for (const pkg of packages) {
      for (const warning of pkg.warnings) {
        const normalizedTitle = warning.title.toLowerCase().trim();
        const normalizedDesc = warning.description.toLowerCase().trim().substring(0, 50);
        const key = `${normalizedTitle}:${normalizedDesc}`;
        if (!warningMap.has(key)) {
          warningMap.set(key, { packageIds: [] });
        }
        warningMap.get(key)!.packageIds.push(pkg.id);
      }
    }

    for (const [key, data] of warningMap.entries()) {
      if (data.packageIds.length > 1) {
        report.duplicateWarnings.push({
          title: key.split(":")[0],
          count: data.packageIds.length,
          packageIds: data.packageIds,
        });
        report.totalDuplicates += data.packageIds.length - 1;
      }
    }

    // Detect duplicate best practices
    const bestPracticeMap = new Map<string, { packageIds: string[] }>();
    for (const pkg of packages) {
      for (const bp of pkg.bestPractices) {
        const normalizedTitle = bp.title.toLowerCase().trim();
        const normalizedDesc = bp.description.toLowerCase().trim().substring(0, 50);
        const key = `${normalizedTitle}:${normalizedDesc}`;
        if (!bestPracticeMap.has(key)) {
          bestPracticeMap.set(key, { packageIds: [] });
        }
        bestPracticeMap.get(key)!.packageIds.push(pkg.id);
      }
    }

    for (const [key, data] of bestPracticeMap.entries()) {
      if (data.packageIds.length > 1) {
        report.duplicateBestPractices.push({
          title: key.split(":")[0],
          count: data.packageIds.length,
          packageIds: data.packageIds,
        });
        report.totalDuplicates += data.packageIds.length - 1;
      }
    }

    return report;
  }
}
