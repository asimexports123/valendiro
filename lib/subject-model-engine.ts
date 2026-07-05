/**
 * Subject Model Engine
 * 
 * This engine integrates the Subject Knowledge Model with the Editorial OS.
 * It serves as the PRIMARY source for article generation, determining what a real expert would naturally explain.
 * 
 * The Subject Model Engine:
 * 1. Loads Subject Models from configuration
 * 2. Detects which Subject Model applies to an article
 * 3. Provides expert knowledge to the article generation process
 * 4. Integrates with Editorial Blueprint (arranges information) and Knowledge Package (provides facts)
 */

import fs from 'fs';
import path from 'path';

export interface SubjectModel {
  name: string;
  category: string;
  detectionRules: string[];
  coreConcepts: string[];
  coreVocabulary: string[];
  requiredEntities: string[];
  mentalModels: string[];
  typicalWorkflows: string[];
  requiredSkills: string[];
  requiredDecisions: string[];
  commonMistakes: string[];
  advancedTopics: string[];
  tools: string[];
  measurements: string[];
  processes: string[];
  standards: string[];
  bestPractices: string[];
  frequentlyAskedQuestions: string[];
  relatedSubjects: string[];
}

export interface SubjectModelConfig {
  version: string;
  description: string;
  lastUpdated: string;
  subjects: Record<string, SubjectModel>;
}

export interface SubjectModelDetectionResult {
  subject: string;
  model: SubjectModel;
  confidence: number;
  matchedRules: string[];
}

export interface SubjectKnowledgeContext {
  subject: string;
  model: SubjectModel;
  relevantConcepts: string[];
  relevantVocabulary: string[];
  relevantEntities: string[];
  relevantMentalModels: string[];
  relevantBestPractices: string[];
  relevantCommonMistakes: string[];
}

export class SubjectModelEngine {
  private config: SubjectModelConfig | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'subject-models.json');
  }

  /**
   * Load the Subject Model configuration
   */
  loadConfig(): void {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to load Subject Model configuration: ${error}`);
    }
  }

  /**
   * Get all available Subject Models
   */
  getAllSubjects(): string[] {
    if (!this.config) {
      this.loadConfig();
    }
    return Object.keys(this.config!.subjects);
  }

  /**
   * Get a specific Subject Model by key
   */
  getSubjectModel(subjectKey: string): SubjectModel | null {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!.subjects[subjectKey] || null;
  }

  /**
   * Detect which Subject Model applies to an article based on slug and title
   */
  detectSubjectModel(slug: string, title: string): SubjectModelDetectionResult | null {
    if (!this.config) {
      this.loadConfig();
    }

    const slugLower = slug.toLowerCase();
    const titleLower = title.toLowerCase();
    const combinedText = `${slugLower} ${titleLower}`;

    let bestMatch: SubjectModelDetectionResult | null = null;
    let highestConfidence = 0;

    for (const [subjectKey, model] of Object.entries(this.config!.subjects)) {
      const matchedRules: string[] = [];
      let matchCount = 0;

      for (const rule of model.detectionRules) {
        const ruleLower = rule.toLowerCase();
        
        if (ruleLower.includes('slug contains:')) {
          const keywords = ruleLower.replace('slug contains:', '').trim().split(',').map(k => k.trim());
          for (const keyword of keywords) {
            if (slugLower.includes(keyword)) {
              matchCount++;
              matchedRules.push(rule);
              break;
            }
          }
        } else if (ruleLower.includes('title contains:')) {
          const keywords = ruleLower.replace('title contains:', '').trim().split(',').map(k => k.trim());
          for (const keyword of keywords) {
            if (titleLower.includes(keyword)) {
              matchCount++;
              matchedRules.push(rule);
              break;
            }
          }
        } else if (combinedText.includes(ruleLower)) {
          matchCount++;
          matchedRules.push(rule);
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(matchCount / model.detectionRules.length, 1.0);
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = {
            subject: subjectKey,
            model,
            confidence,
            matchedRules
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Extract relevant knowledge from the Subject Model based on article context
   */
  extractRelevantKnowledge(
    subjectKey: string,
    articleContext: {
      slug: string;
      title: string;
      keywords?: string[];
    }
  ): SubjectKnowledgeContext {
    const model = this.getSubjectModel(subjectKey);
    if (!model) {
      throw new Error(`Subject model not found: ${subjectKey}`);
    }

    const contextLower = `${articleContext.slug} ${articleContext.title} ${(articleContext.keywords || []).join(' ')}`.toLowerCase();

    // Extract relevant concepts based on context
    const relevantConcepts = model.coreConcepts.filter(concept =>
      contextLower.includes(concept.toLowerCase()) ||
      this.isSemanticallyRelated(concept, articleContext)
    );

    // Extract relevant vocabulary
    const relevantVocabulary = model.coreVocabulary.filter(term =>
      contextLower.includes(term.toLowerCase())
    );

    // Extract relevant entities
    const relevantEntities = model.requiredEntities.filter(entity =>
      contextLower.includes(entity.toLowerCase())
    );

    // Always include mental models as they provide foundational understanding
    const relevantMentalModels = model.mentalModels;

    // Always include best practices
    const relevantBestPractices = model.bestPractices;

    // Extract relevant common mistakes
    const relevantCommonMistakes = model.commonMistakes.filter(mistake =>
      contextLower.includes(mistake.toLowerCase().substring(0, 20))
    );

    return {
      subject: subjectKey,
      model,
      relevantConcepts,
      relevantVocabulary,
      relevantEntities,
      relevantMentalModels,
      relevantBestPractices,
      relevantCommonMistakes
    };
  }

  /**
   * Generate expert context for article generation
   * This is the PRIMARY source that determines what a real expert would naturally explain
   */
  generateExpertContext(
    subjectKey: string,
    articleContext: {
      slug: string;
      title: string;
      keywords?: string[];
    }
  ): string {
    const knowledge = this.extractRelevantKnowledge(subjectKey, articleContext);
    const model = knowledge.model;

    let expertContext = `# Expert Knowledge Context: ${model.name}\n\n`;
    expertContext += `As a ${model.name} expert, here's what I would naturally explain:\n\n`;

    // Core Concepts
    if (knowledge.relevantConcepts.length > 0) {
      expertContext += `## Core Concepts\n`;
      expertContext += `The fundamental concepts I would cover: ${knowledge.relevantConcepts.join(', ')}\n\n`;
    }

    // Core Vocabulary
    if (knowledge.relevantVocabulary.length > 0) {
      expertContext += `## Essential Terminology\n`;
      expertContext += `Key terms I would define and use: ${knowledge.relevantVocabulary.join(', ')}\n\n`;
    }

    // Required Entities
    if (knowledge.relevantEntities.length > 0) {
      expertContext += `## Key Components\n`;
      expertContext += `The specific entities I would discuss: ${knowledge.relevantEntities.join(', ')}\n\n`;
    }

    // Mental Models
    expertContext += `## Mental Models\n`;
    expertContext += `The conceptual frameworks I would use to explain the topic:\n`;
    knowledge.relevantMentalModels.forEach(model => {
      expertContext += `- ${model}\n`;
    });
    expertContext += '\n';

    // Typical Workflows
    expertContext += `## Typical Workflows\n`;
    expertContext += `The step-by-step processes I would walk through:\n`;
    model.typicalWorkflows.forEach(workflow => {
      expertContext += `- ${workflow}\n`;
    });
    expertContext += '\n';

    // Required Skills
    expertContext += `## Required Skills\n`;
    expertContext += `The skills I would assume the reader needs or should develop:\n`;
    model.requiredSkills.forEach(skill => {
      expertContext += `- ${skill}\n`;
    });
    expertContext += '\n';

    // Required Decisions
    expertContext += `## Key Decisions\n`;
    expertContext += `The decisions I would guide the reader through:\n`;
    model.requiredDecisions.forEach(decision => {
      expertContext += `- ${decision}\n`;
    });
    expertContext += '\n';

    // Common Mistakes
    if (knowledge.relevantCommonMistakes.length > 0) {
      expertContext += `## Common Mistakes to Avoid\n`;
      expertContext += `The pitfalls I would warn readers about:\n`;
      knowledge.relevantCommonMistakes.forEach(mistake => {
        expertContext += `- ${mistake}\n`;
      });
      expertContext += '\n';
    }

    // Best Practices
    expertContext += `## Best Practices\n`;
    expertContext += `The industry-standard practices I would recommend:\n`;
    knowledge.relevantBestPractices.forEach(practice => {
      expertContext += `- ${practice}\n`;
    });
    expertContext += '\n';

    // Tools
    expertContext += `## Essential Tools\n`;
    expertContext += `The tools I would reference or recommend: ${model.tools.join(', ')}\n\n`;

    // Measurements
    expertContext += `## Key Measurements\n`;
    expertContext += `The metrics and measurements I would discuss: ${model.measurements.join(', ')}\n\n`;

    // Frequently Asked Questions
    expertContext += `## Common Questions\n`;
    expertContext += `The questions I would anticipate and answer:\n`;
    model.frequentlyAskedQuestions.slice(0, 5).forEach(faq => {
      expertContext += `- ${faq}\n`;
    });
    expertContext += '\n';

    return expertContext;
  }

  /**
   * Validate that article content reflects expert knowledge
   */
  validateExpertKnowledge(
    subjectKey: string,
    articleContent: string,
    articleContext: {
      slug: string;
      title: string;
      keywords?: string[];
    }
  ): {
    passed: boolean;
    score: number;
    details: {
      conceptCoverage: number;
      vocabularyUsage: number;
      bestPracticeInclusion: number;
      mentalModelUsage: number;
    };
    suggestions: string[];
  } {
    const knowledge = this.extractRelevantKnowledge(subjectKey, articleContext);
    const contentLower = articleContent.toLowerCase();

    // Check concept coverage
    const conceptMatches = knowledge.relevantConcepts.filter(concept =>
      contentLower.includes(concept.toLowerCase())
    );
    const conceptCoverage = knowledge.relevantConcepts.length > 0 
      ? conceptMatches.length / knowledge.relevantConcepts.length 
      : 1.0;

    // Check vocabulary usage
    const vocabularyMatches = knowledge.relevantVocabulary.filter(term =>
      contentLower.includes(term.toLowerCase())
    );
    const vocabularyUsage = knowledge.relevantVocabulary.length > 0
      ? vocabularyMatches.length / knowledge.relevantVocabulary.length
      : 1.0;

    // Check best practice inclusion
    const practiceMatches = knowledge.relevantBestPractices.filter(practice =>
      contentLower.includes(practice.toLowerCase().substring(0, 20))
    );
    const bestPracticeInclusion = knowledge.relevantBestPractices.length > 0
      ? practiceMatches.length / knowledge.relevantBestPractices.length
      : 1.0;

    // Check mental model usage
    const modelMatches = knowledge.relevantMentalModels.filter(model =>
      contentLower.includes(model.toLowerCase().substring(0, 15))
    );
    const mentalModelUsage = knowledge.relevantMentalModels.length > 0
      ? modelMatches.length / knowledge.relevantMentalModels.length
      : 1.0;

    // Calculate overall score
    const overallScore = (
      conceptCoverage * 0.3 +
      vocabularyUsage * 0.25 +
      bestPracticeInclusion * 0.25 +
      mentalModelUsage * 0.2
    ) * 100;

    // Generate suggestions
    const suggestions: string[] = [];
    if (conceptCoverage < 0.5) {
      suggestions.push(`Include more core concepts: ${knowledge.relevantConcepts.slice(0, 3).join(', ')}`);
    }
    if (vocabularyUsage < 0.5) {
      suggestions.push(`Use more domain-specific terminology: ${knowledge.relevantVocabulary.slice(0, 3).join(', ')}`);
    }
    if (bestPracticeInclusion < 0.5) {
      suggestions.push('Include more best practices from the Subject Model');
    }
    if (mentalModelUsage < 0.5) {
      suggestions.push('Incorporate more mental models to explain concepts');
    }

    return {
      passed: overallScore >= 60,
      score: Math.round(overallScore),
      details: {
        conceptCoverage: Math.round(conceptCoverage * 100),
        vocabularyUsage: Math.round(vocabularyUsage * 100),
        bestPracticeInclusion: Math.round(bestPracticeInclusion * 100),
        mentalModelUsage: Math.round(mentalModelUsage * 100)
      },
      suggestions
    };
  }

  /**
   * Helper method to check semantic relatedness
   */
  private isSemanticallyRelated(term: string, context: { slug: string; title: string; keywords?: string[] }): boolean {
    const contextText = `${context.slug} ${context.title} ${(context.keywords || []).join(' ')}`.toLowerCase();
    const termLower = term.toLowerCase();

    // Direct match
    if (contextText.includes(termLower)) {
      return true;
    }

    // Check for partial matches or related terms
    const termParts = termLower.split(' ');
    const matchingParts = termParts.filter(part => contextText.includes(part));
    return matchingParts.length >= Math.ceil(termParts.length / 2);
  }
}

// Singleton instance
let subjectModelEngineInstance: SubjectModelEngine | null = null;

export function getSubjectModelEngine(): SubjectModelEngine {
  if (!subjectModelEngineInstance) {
    subjectModelEngineInstance = new SubjectModelEngine();
  }
  return subjectModelEngineInstance;
}
