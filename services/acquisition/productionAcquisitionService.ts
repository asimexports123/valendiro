/**
 * Canonical Production Acquisition Service
 * 
 * Single Source of Truth for Knowledge Package acquisition.
 * All scripts must use this service instead of implementing custom acquisition logic.
 */

import { PythonDocumentationConnector } from "../acquisition/connectors/pythonDocumentationConnector";
import { GitDocumentationConnector } from "../acquisition/connectors/gitDocumentationConnector";
import { MDNConnector } from "../acquisition/connectors/mdnConnector";
import { HTMLDocumentationExtractor } from "../acquisition/extractors/htmlDocumentationExtractor";
import { getSubjectRegistry } from "../../config/subjectSourceRegistry";
import { createHash } from "crypto";

export interface AcquisitionResult {
  success: boolean;
  knowledgePackage: any;
  error?: string;
  sourcesConsulted: string[];
  collectionsAcquired: string[];
}

export class ProductionAcquisitionService {
  private extractor: HTMLDocumentationExtractor;

  constructor() {
    this.extractor = new HTMLDocumentationExtractor();
  }

  async acquireKnowledgePackage(subjectSlug: string): Promise<AcquisitionResult> {
    const registry = getSubjectRegistry(subjectSlug);
    if (!registry) {
      return {
        success: false,
        knowledgePackage: null,
        error: `No registry found for subject: ${subjectSlug}`,
        sourcesConsulted: [],
        collectionsAcquired: [],
      };
    }

    const knowledgeArrays: any[] = [];
    const sourcesConsulted: string[] = [];

    for (const source of registry.sources) {
      if (source.status !== "ACTIVE") {
        continue;
      }

      let connector: any;
      switch (source.connector) {
        case "PythonDocumentationConnector":
          connector = new PythonDocumentationConnector();
          break;
        case "GitDocumentationConnector":
          connector = new GitDocumentationConnector();
          break;
        case "MDNConnector":
          connector = new MDNConnector();
          break;
        default:
          console.log(`  ⚠️  Unknown connector: ${source.connector}`);
          continue;
      }

      const connectorResult = await connector.connect({
        sourceType: connector.sourceType as any,
        sourceUrl: source.url,
      });

      if (!connectorResult.error && connectorResult.data) {
        const extractionResult = await this.extractor.extract(connectorResult.data, { sourceUrl: source.url });
        if (extractionResult.success) {
          knowledgeArrays.push(extractionResult.knowledge);
          sourcesConsulted.push(source.name);
          console.log(`  ✅ Acquired: ${source.url}`);
        }
      } else {
        console.log(`  ❌ Failed: ${source.url} - ${connectorResult.error}`);
      }
    }

    if (knowledgeArrays.length === 0) {
      return {
        success: false,
        knowledgePackage: null,
        error: "No knowledge acquired from sources",
        sourcesConsulted,
        collectionsAcquired: [],
      };
    }

    const mergedKnowledge = this.mergeKnowledge(knowledgeArrays);
    const collectionsAcquired = this.getNonEmptyCollections(mergedKnowledge);

    return {
      success: true,
      knowledgePackage: mergedKnowledge,
      sourcesConsulted,
      collectionsAcquired,
    };
  }

  private mergeKnowledge(knowledgeArrays: any[]): any {
    const merged = {
      definitions: [],
      concepts: [],
      procedures: [],
      examples: [],
      comparisons: [],
      commands: [],
      formulae: [],
      warnings: [],
      bestPractices: [],
      commonMistakes: [],
      faqs: [],
      references: [],
      metadata: {
        sourceUrl: "",
        extractedAt: new Date().toISOString(),
        confidence: "high",
      },
    };

    const seenTerms = new Set<string>();
    const seenNames = new Set<string>();
    const seenUrls = new Set<string>();

    knowledgeArrays.forEach((knowledge) => {
      knowledge.definitions?.forEach((d: any) => {
        const key = d.term?.toLowerCase() || d.id;
        if (!seenTerms.has(key)) {
          seenTerms.add(key);
          (merged.definitions as any[]).push(d);
        }
      });

      knowledge.concepts?.forEach((c: any) => {
        const key = c.name?.toLowerCase() || c.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.concepts as any[]).push(c);
        }
      });

      knowledge.procedures?.forEach((p: any) => {
        const key = p.name?.toLowerCase() || p.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.procedures as any[]).push(p);
        }
      });

      knowledge.examples?.forEach((e: any) => {
        const key = e.title?.toLowerCase() || e.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.examples as any[]).push(e);
        }
      });

      knowledge.comparisons?.forEach((c: any) => {
        const key = c.subject1?.toLowerCase() || c.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.comparisons as any[]).push(c);
        }
      });

      knowledge.commands?.forEach((cmd: any) => {
        const key = cmd.command?.toLowerCase() || cmd.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.commands as any[]).push(cmd);
        }
      });

      knowledge.formulae?.forEach((f: any) => {
        const key = f.name?.toLowerCase() || f.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.formulae as any[]).push(f);
        }
      });

      knowledge.warnings?.forEach((w: any) => {
        const key = w.title?.toLowerCase() || w.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.warnings as any[]).push(w);
        }
      });

      knowledge.bestPractices?.forEach((bp: any) => {
        const key = bp.title?.toLowerCase() || bp.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.bestPractices as any[]).push(bp);
        }
      });

      knowledge.commonMistakes?.forEach((cm: any) => {
        const key = cm.mistake?.toLowerCase() || cm.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.commonMistakes as any[]).push(cm);
        }
      });

      knowledge.faqs?.forEach((faq: any) => {
        const key = faq.question?.toLowerCase() || faq.id;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          (merged.faqs as any[]).push(faq);
        }
      });

      knowledge.references?.forEach((r: any) => {
        const key = r.url?.toLowerCase() || r.id;
        if (!seenUrls.has(key)) {
          seenUrls.add(key);
          (merged.references as any[]).push(r);
        }
      });
    });

    return merged;
  }

  private getNonEmptyCollections(knowledge: any): string[] {
    const collections: string[] = [];
    const collectionNames = [
      "definitions", "concepts", "procedures", "examples", "comparisons",
      "commands", "formulae", "warnings", "bestPractices", "commonMistakes", "faqs", "references"
    ];

    collectionNames.forEach(name => {
      if (knowledge[name] && Array.isArray(knowledge[name]) && knowledge[name].length > 0) {
        collections.push(name);
      }
    });

    return collections;
  }
}
