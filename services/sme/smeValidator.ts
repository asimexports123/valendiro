import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ─── SME Profile Types ─────────────────────────────────────────────────────

interface SMEProfile {
  name: string;
  mandatoryConcepts: string[];
  mandatoryTerminology: string[];
  mandatoryEntities: string[];
  mandatoryWorkflows: string[];
  mandatoryComparisons: string[];
  mandatoryExamples: string[];
  mandatoryMistakes: string[];
  mandatoryFAQs: string[];
  mandatoryReferences: string[];
  mandatoryCalculations: string[];
  mandatoryDiagrams: string[];
  mandatoryVisualExplanations: string[];
  mandatoryInternalLinks: string[];
  forbiddenGenericWording: string[];
  forbiddenGenericSections: string[];
  rejectionRules: string[];
}

interface SMEValidationResult {
  passed: boolean;
  score: number;
  violations: string[];
  missingElements: string[];
  expertProfile: string;
}

// ─── SME Validator Class ─────────────────────────────────────────────────

export class SMEValidator {
  private profiles: Record<string, SMEProfile>;
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.profiles = this.loadProfiles();
  }

  private loadProfiles(): Record<string, SMEProfile> {
    const profilesPath = path.join(process.cwd(), 'config/sme-profiles.json');
    const data = fs.readFileSync(profilesPath, 'utf8');
    return JSON.parse(data).domains;
  }

  private detectDomain(content: string, slug: string): string {
    const contentLower = content.toLowerCase();
    const slugLower = slug.toLowerCase();
    const domainScores: Record<string, number> = {};

    for (const [domainKey, profile] of Object.entries(this.profiles)) {
      let score = 0;
      for (const term of profile.mandatoryTerminology) {
        if (contentLower.includes(term.toLowerCase()) || slugLower.includes(term.toLowerCase())) {
          score += 2;
        }
      }
      domainScores[domainKey] = score;
    }

    let bestDomain = 'cloud-computing';
    let bestScore = 0;
    for (const [domainKey, score] of Object.entries(domainScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domainKey;
      }
    }

    return bestDomain;
  }

  private async evolveProfile(domainKey: string): Promise<void> {
    // Fetch knowledge packages for this domain to evolve the profile
    const { data: knowledgePackages } = await this.supabase
      .from('knowledge_packages')
      .select('facts, sources, relationships')
      .limit(100);

    if (!knowledgePackages || knowledgePackages.length === 0) return;

    const profile = this.profiles[domainKey];
    const newConcepts = new Set<string>();
    const newTerminology = new Set<string>();
    const newEntities = new Set<string>();

    // Extract new concepts from knowledge packages
    for (const kp of knowledgePackages) {
      if (kp.facts) {
        const facts = typeof kp.facts === 'string' ? JSON.parse(kp.facts) : kp.facts;
        for (const fact of facts) {
          if (fact.concept && !profile.mandatoryConcepts.includes(fact.concept)) {
            newConcepts.add(fact.concept);
          }
        }
      }
    }

    // Update profile with evolved knowledge
    if (newConcepts.size > 0) {
      profile.mandatoryConcepts.push(...Array.from(newConcepts).slice(0, 10));
    }
  }

  public async validateArticle(content: string, slug: string, knowledgePackageId?: string): Promise<SMEValidationResult> {
    const domain = this.detectDomain(content, slug);
    const profile = this.profiles[domain];

    // Evolve profile from knowledge package if provided
    if (knowledgePackageId) {
      await this.evolveProfile(domain);
    }

    const violations: string[] = [];
    const missingElements: string[] = [];
    const contentLower = content.toLowerCase();

    // Check mandatory concepts
    let conceptScore = 0;
    for (const concept of profile.mandatoryConcepts) {
      if (contentLower.includes(concept.toLowerCase())) {
        conceptScore++;
      }
    }
    if (conceptScore < profile.mandatoryConcepts.length * 0.5) {
      violations.push(`Insufficient mandatory concepts (${conceptScore}/${profile.mandatoryConcepts.length})`);
      missingElements.push(...profile.mandatoryConcepts.slice(conceptScore));
    }

    // Check mandatory terminology
    let terminologyScore = 0;
    for (const term of profile.mandatoryTerminology) {
      if (contentLower.includes(term.toLowerCase())) {
        terminologyScore++;
      }
    }
    if (terminologyScore < profile.mandatoryTerminology.length * 0.5) {
      violations.push(`Insufficient mandatory terminology (${terminologyScore}/${profile.mandatoryTerminology.length})`);
    }

    // Check mandatory entities
    let entityScore = 0;
    for (const entity of profile.mandatoryEntities) {
      if (contentLower.includes(entity.toLowerCase())) {
        entityScore++;
      }
    }
    if (entityScore < profile.mandatoryEntities.length * 0.3) {
      violations.push(`Insufficient mandatory entities (${entityScore}/${profile.mandatoryEntities.length})`);
    }

    // Check rejection rules
    for (const rule of profile.rejectionRules) {
      if (rule.includes('Must contain')) {
        const requiredElement = rule.replace('Must contain ', '').toLowerCase();
        if (!contentLower.includes(requiredElement)) {
          violations.push(rule);
          missingElements.push(requiredElement);
        }
      }
    }

    // Check forbidden generic wording
    for (const forbidden of profile.forbiddenGenericWording) {
      if (contentLower.includes(forbidden.toLowerCase())) {
        violations.push(`Contains forbidden generic wording: ${forbidden}`);
      }
    }

    // Check forbidden generic sections
    for (const forbidden of profile.forbiddenGenericSections) {
      if (contentLower.includes(forbidden.toLowerCase())) {
        violations.push(`Contains forbidden generic section: ${forbidden}`);
      }
    }

    // Calculate score
    const totalChecks = profile.mandatoryConcepts.length + profile.mandatoryTerminology.length + profile.mandatoryEntities.length;
    const passedChecks = conceptScore + terminologyScore + entityScore - violations.length;
    const score = Math.max(0, Math.min(100, (passedChecks / totalChecks) * 100));

    const passed = violations.length === 0 && score >= 70;

    return {
      passed,
      score: Math.round(score),
      violations,
      missingElements,
      expertProfile: profile.name
    };
  }

  public async validateTopic(topicId: string, slug: string, content: string): Promise<SMEValidationResult> {
    // Get knowledge package for this topic
    const { data: knowledgePackage } = await this.supabase
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topicId)
      .maybeSingle();

    return this.validateArticle(content, slug, knowledgePackage?.id);
  }
}

// ─── Export singleton instance ─────────────────────────────────────────────

export const smeValidator = new SMEValidator();
