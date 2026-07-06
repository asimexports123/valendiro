import { createClient } from '@supabase/supabase-js';
import { render } from '../renderer/orchestrator';
import { KnowledgeAuthorAgent, type KnowledgeAuthorInput } from '../agents/agents/knowledgeAuthorAgent';
import { PublicationPipeline } from '../publication/publicationPipeline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://diwwvkbztvhwouttajha.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Business objective types
export type BusinessObjective = 
  | 'improve-technology'
  | 'improve-personal-finance'
  | 'expand-travel'
  | 'increase-beginner-quality'
  | 'raise-quality-score-above-95'
  | 'compress-all-content'
  | 'optimize-for-scanning';

// Pipeline task types
export type PipelineTask = 
  | 'select-topics'
  | 'analyze-gaps'
  | 'update-packages'
  | 'execute-authoring'
  | 'run-validation'
  | 'render-content'
  | 'publish-content'
  | 'generate-report';

// Execution context
export interface ExecutionContext {
  objective: BusinessObjective;
  parameters?: Record<string, any>;
  startTime: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

// Execution report
export interface ExecutionReport {
  objective: BusinessObjective;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  tasks: TaskResult[];
  summary: {
    topicsProcessed: number;
    topicsUpdated: number;
    qualityScoreImprovement: number;
    wordCountChange: number;
  };
  errors?: string[];
}

// Task result
export interface TaskResult {
  task: PipelineTask;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

// Objective translator
class ObjectiveTranslator {
  translate(objective: BusinessObjective): PipelineTask[] {
    const taskMap: Record<BusinessObjective, PipelineTask[]> = {
      'improve-technology': [
        'select-topics',
        'analyze-gaps',
        'update-packages',
        'execute-authoring',
        'run-validation',
        'render-content',
        'publish-content',
        'generate-report'
      ],
      'improve-personal-finance': [
        'select-topics',
        'analyze-gaps',
        'update-packages',
        'execute-authoring',
        'run-validation',
        'render-content',
        'publish-content',
        'generate-report'
      ],
      'expand-travel': [
        'select-topics',
        'analyze-gaps',
        'update-packages',
        'execute-authoring',
        'run-validation',
        'render-content',
        'publish-content',
        'generate-report'
      ],
      'increase-beginner-quality': [
        'select-topics',
        'analyze-gaps',
        'update-packages',
        'execute-authoring',
        'run-validation',
        'render-content',
        'publish-content',
        'generate-report'
      ],
      'raise-quality-score-above-95': [
        'select-topics',
        'analyze-gaps',
        'update-packages',
        'execute-authoring',
        'run-validation',
        'render-content',
        'publish-content',
        'generate-report'
      ],
      'compress-all-content': [
        'select-topics',
        'render-content',
        'publish-content',
        'generate-report'
      ],
      'optimize-for-scanning': [
        'select-topics',
        'render-content',
        'publish-content',
        'generate-report'
      ]
    };

    return taskMap[objective] || [];
  }

  getCategoryFromObjective(objective: BusinessObjective): string | null {
    const categoryMap: Record<BusinessObjective, string | null> = {
      'improve-technology': 'technology',
      'improve-personal-finance': 'finance',
      'expand-travel': 'travel',
      'increase-beginner-quality': null, // All categories
      'raise-quality-score-above-95': null, // All categories
      'compress-all-content': null, // All categories
      'optimize-for-scanning': null // All categories
    };

    return categoryMap[objective];
  }

  getComplexityFromObjective(objective: BusinessObjective): string | null {
    const complexityMap: Record<BusinessObjective, string | null> = {
      'increase-beginner-quality': 'beginner',
      'raise-quality-score-above-95': null, // All complexities
      'compress-all-content': null, // All complexities
      'optimize-for-scanning': null, // All complexities
      'improve-technology': null, // All complexities
      'improve-personal-finance': null, // All complexities
      'expand-travel': null // All complexities
    };

    return complexityMap[objective];
  }
}

// Topic selector
class TopicSelector {
  async selectTopics(category: string | null, complexity: string | null, limit: number = 10): Promise<any[]> {
    let query = supabase.from('topics').select('id, slug, category').limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    if (complexity) {
      query = query.eq('complexity', complexity);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to select topics: ${error.message}`);
    }

    return data || [];
  }
}

// Knowledge gap analyzer
class KnowledgeGapAnalyzer {
  async analyzeGaps(topicId: string): Promise<any> {
    // Get current knowledge package
    const { data: packageData } = await supabase
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topicId)
      .single();

    if (!packageData) {
      throw new Error(`No knowledge package found for topic ${topicId}`);
    }

    // Get current facts
    const { data: facts } = await supabase
      .from('knowledge_facts')
      .select('id, factType, confidence')
      .eq('package_id', packageData.id);

    // Analyze gaps by fact type
    const factTypeCounts: Record<string, number> = {};
    const factTypeConfidence: Record<string, number> = {};

    for (const fact of facts || []) {
      factTypeCounts[fact.factType] = (factTypeCounts[fact.factType] || 0) + 1;
      if (!factTypeConfidence[fact.factType]) {
        factTypeConfidence[fact.factType] = 0;
      }
      factTypeConfidence[fact.factType] += parseFloat(fact.confidence);
    }

    // Calculate average confidence
    for (const type in factTypeConfidence) {
      const count = factTypeCounts[type];
      factTypeConfidence[type] = count > 0 ? factTypeConfidence[type] / count : 0;
    }

    // Identify gaps (low count or low confidence)
    const gaps: string[] = [];
    const targetCounts: Record<string, number> = {
      'definition': 3,
      'procedural': 5,
      'property': 5,
      'comparison': 3,
      'warning': 3,
      'rule': 3,
      'historical': 2,
      'causal': 3
    };

    for (const type in targetCounts) {
      const count = factTypeCounts[type] || 0;
      const confidence = factTypeConfidence[type] || 0;
      
      if (count < targetCounts[type] || confidence < 0.7) {
        gaps.push(type);
      }
    }

    return {
      topicId,
      factTypeCounts,
      factTypeConfidence,
      gaps,
      totalFacts: facts?.length || 0
    };
  }
}

// Pipeline orchestrator
export class PipelineOrchestrator {
  private translator: ObjectiveTranslator;
  private topicSelector: TopicSelector;
  private gapAnalyzer: KnowledgeGapAnalyzer;
  private knowledgeAuthorAgent: KnowledgeAuthorAgent;
  private publicationPipeline: PublicationPipeline;

  constructor() {
    this.translator = new ObjectiveTranslator();
    this.topicSelector = new TopicSelector();
    this.gapAnalyzer = new KnowledgeGapAnalyzer();
    this.knowledgeAuthorAgent = new KnowledgeAuthorAgent();
    
    // Set environment variables if not already set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;
    }
    
    this.publicationPipeline = new PublicationPipeline();
  }

  async executeObjective(objective: BusinessObjective, parameters?: Record<string, any>): Promise<ExecutionReport> {
    const context: ExecutionContext = {
      objective,
      parameters,
      startTime: new Date(),
      status: 'in-progress'
    };

    const report: ExecutionReport = {
      objective,
      startTime: context.startTime,
      status: 'in-progress',
      tasks: [],
      summary: {
        topicsProcessed: 0,
        topicsUpdated: 0,
        qualityScoreImprovement: 0,
        wordCountChange: 0
      }
    };

    try {
      // Translate objective to pipeline tasks
      const tasks = this.translator.translate(objective);
      
      // Get category and complexity filters
      const category = this.translator.getCategoryFromObjective(objective);
      const complexity = this.translator.getComplexityFromObjective(objective);
      const limit = parameters?.limit || 10;

      // Execute tasks in order
      for (const task of tasks) {
        const taskResult: TaskResult = {
          task,
          status: 'in-progress',
          startTime: new Date()
        };

        try {
          switch (task) {
            case 'select-topics':
              taskResult.result = await this.executeSelectTopics(category, complexity, limit);
              break;
            case 'analyze-gaps':
              taskResult.result = await this.executeAnalyzeGaps(taskResult.result);
              break;
            case 'update-packages':
              taskResult.result = await this.executeUpdatePackages(taskResult.result);
              break;
            case 'execute-authoring':
              taskResult.result = await this.executeAuthoring(taskResult.result);
              break;
            case 'run-validation':
              taskResult.result = await this.executeValidation(taskResult.result);
              break;
            case 'render-content':
              taskResult.result = await this.executeRender(taskResult.result);
              break;
            case 'publish-content':
              taskResult.result = await this.executePublish(taskResult.result);
              break;
            case 'generate-report':
              taskResult.result = this.generateFinalReport(report);
              break;
          }

          taskResult.status = 'completed';
        } catch (error) {
          taskResult.status = 'failed';
          taskResult.error = error instanceof Error ? error.message : String(error);
          report.errors = report.errors || [];
          report.errors.push(`Task ${task} failed: ${taskResult.error}`);
        }

        taskResult.endTime = new Date();
        report.tasks.push(taskResult);
      }

      report.status = 'completed';
    } catch (error) {
      report.status = 'failed';
      report.errors = report.errors || [];
      report.errors.push(error instanceof Error ? error.message : String(error));
    }

    report.endTime = new Date();
    return report;
  }

  private async executeSelectTopics(category: string | null, complexity: string | null, limit: number) {
    const topics = await this.topicSelector.selectTopics(category, complexity, limit);
    return { topics, count: topics.length };
  }

  private async executeAnalyzeGaps(previousResult: any) {
    const gaps: any[] = [];
    for (const topic of previousResult.topics) {
      const gapAnalysis = await this.gapAnalyzer.analyzeGaps(topic.id);
      gaps.push({ topicId: topic.id, ...gapAnalysis });
    }
    return { gaps };
  }

  private async executeUpdatePackages(previousResult: any) {
    // NO EXISTING IMPLEMENTATION
    // 
    // Investigation Results:
    // - services/knowledge/packageVersioner.ts exists with computeKnowledgeHash() and decideVersion()
    // - These functions only compute hashes and decide versions - they do NOT update knowledge_packages in the database
    // - services/knowledge/knowledgeService.ts exists but works with knowledge_objects table, not knowledge_packages
    // - No service found that actually updates knowledge_packages based on gap analysis results
    //
    // To implement: Would need to create a service that:
    // 1. Takes gap analysis results
    // 2. Adds new facts to knowledge_packages based on identified gaps
    // 3. Updates package version using packageVersioner
    // 4. Writes to knowledge_packages table in Supabase
    
    return { updatedPackages: previousResult.gaps.length, note: 'NO EXISTING IMPLEMENTATION - placeholder' };
  }

  private async executeAuthoring(previousResult: any) {
    // Service: KnowledgeAuthorAgent (services/agents/agents/knowledgeAuthorAgent.ts)
    // Function: execute(input: KnowledgeAuthorInput)
    // Input: { topic, category, facts[] }
    // Output: { topic, category, authoringComplete, passesAllChecks, qualityScore, acceptanceConfidence, recommendation, sections, readerQuestions, gapsFilled, document }
    // Error handling: Agent handles errors internally, logs to console
    // Production evidence: Used in Phase 18A, registered in AgentRegistry
    
    const authoredContent: any[] = [];
    
    for (const gap of previousResult.gaps || []) {
      try {
        // Get facts for this topic
        const { data: packageData } = await supabase
          .from('knowledge_packages')
          .select('id')
          .eq('topic_id', gap.topicId)
          .single();

        if (packageData) {
          const { data: facts } = await supabase
            .from('knowledge_facts')
            .select('*')
            .eq('package_id', packageData.id);

          if (facts && facts.length > 0) {
            // Get topic info
            const { data: topic } = await supabase
              .from('topics')
              .select('slug')
              .eq('id', gap.topicId)
              .single();

            const authorInput: KnowledgeAuthorInput = {
              topic: topic?.slug || 'unknown',
              category: 'education', // Default category
              facts: facts.map(f => ({
                id: f.id,
                statement: f.statement,
                factType: f.fact_type,
                confidence: parseFloat(f.confidence),
                scope: f.scope,
                tags: f.tags || [],
                domain: f.domain || ''
              }))
            };

            const result = await this.knowledgeAuthorAgent.execute(authorInput);
            authoredContent.push({
              topicId: gap.topicId,
              ...result
            });
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to author content for topic ${gap.topicId}: ${message}`);
        authoredContent.push({
          topicId: gap.topicId,
          error: message,
        });
      }
    }

    return { authoredContent };
  }

  private async executeValidation(previousResult: any) {
    // NO EXISTING IMPLEMENTATION
    //
    // Investigation Results:
    // - services/agents/agents/editorialAgent.ts exists but is a PLACEHOLDER (line 117: "TODO: Implement actual editorial review")
    // - services/agents/agents/qualityAgent.ts exists but is a PLACEHOLDER (line 123: "TODO: Implement actual quality evaluation")
    // - Both agents return placeholder outputs with zero scores and empty issues arrays
    // - No real implementation exists for editorial or quality validation
    //
    // Editorial Agent (services/agents/agents/editorialAgent.ts):
    // - Line 117: "TODO: Implement actual editorial review"
    // - Returns: { originalContent, editedContent, issuesFound: 0, issuesFixed: 0, qualityScoreBefore: 0, qualityScoreAfter: 0, issues: [] }
    //
    // Quality Agent (services/agents/agents/qualityAgent.ts):
    // - Line 123: "TODO: Implement actual quality evaluation"
    // - Returns: { overallScore: 0, passesThreshold: false, dimensions: { clarity: 0, completeness: 0, accuracy: 0, practicalValue: 0, readability: 0, trustworthiness: 0 }, issues: [], recommendation: "improve" }
    //
    // To implement: Would need to:
    // 1. Implement actual editorial review logic in EditorialAgent
    // 2. Implement actual quality evaluation logic in QualityAgent
    // 3. Wire these agents into the validation pipeline
    
    return { validationResults: previousResult.authoredContent, note: 'NO EXISTING IMPLEMENTATION - both EditorialAgent and QualityAgent are placeholders' };
  }

  private async executeRender(previousResult: any) {
    const renderResults: any[] = [];
    
    // Get topics to render
    const { data: topics } = await supabase.from('topics').select('id, slug').limit(5);
    
    for (const topic of topics || []) {
      try {
        // Get knowledge package
        const { data: packageData } = await supabase
          .from('knowledge_packages')
          .select('id')
          .eq('topic_id', topic.id)
          .single();

        if (packageData) {
          // Render content
          const result = await render({
            packageId: packageData.id,
            format: 'markdown',
            rendererId: 'long-article-v2',
            style: ['intermediate'],
            forceRerender: true,
          });

          renderResults.push({
            topicSlug: topic.slug,
            qualityScore: result.qualityScore.overall,
            wordCount: result.qualityScore.wordCount
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to render ${topic.slug}: ${message}`);
        renderResults.push({
          topicSlug: topic.slug,
          error: message,
        });
      }
    }

    return { renderResults };
  }

  private async executePublish(previousResult: any) {
    // Service: PublicationPipeline (services/publication/publicationPipeline.ts)
    // Function: publishByTopicSlug(topicSlug, languageCode)
    // Input: topicSlug (string), languageCode (string, default 'en')
    // Output: { success, renderedOutputId, topicId, languageCode, validation, publishedAt, cacheInvalidated, error, logId }
    // Error handling: Returns failure result with error message, logs to console
    // Production evidence: Used in Phase 18 scripts (phase18-rerender-and-publish-all.ts), published to production
    
    const renderResults = previousResult?.renderResults || [];
    const publishedTopics: any[] = [];
    
    for (const renderResult of renderResults) {
      try {
        const result = await this.publicationPipeline.publishByTopicSlug(
          renderResult.topicSlug,
          'en'
        );
        publishedTopics.push({
          topicSlug: renderResult.topicSlug,
          success: result.success,
          publishedAt: result.publishedAt,
          error: result.error
        });
      } catch (error) {
        console.error(`Failed to publish ${renderResult.topicSlug}:`, error);
        publishedTopics.push({
          topicSlug: renderResult.topicSlug,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { publishedCount: publishedTopics.length, publishedTopics };
  }

  private generateFinalReport(report: ExecutionReport) {
    // Calculate summary statistics
    const renderTask = report.tasks.find(t => t.task === 'render-content');
    if (renderTask?.result?.renderResults) {
      report.summary.topicsProcessed = renderTask.result.renderResults.length;
      report.summary.topicsUpdated = renderTask.result.renderResults.length;
    }

    return report;
  }
}

// Export singleton instance
export const pipelineOrchestrator = new PipelineOrchestrator();
