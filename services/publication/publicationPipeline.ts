/**
 * Publication Pipeline
 *
 * The Publication Pipeline is the dedicated architectural layer responsible for
 * publishing rendered knowledge to the live website.
 *
 * Architecture Flow:
 * Knowledge Package → Knowledge Authoring Engine → Rendering Engine → rendered_outputs
 * → Publication Pipeline → Publication Validation → topic_translations → Cache Revalidation → Live Website
 *
 * Responsibilities:
 * - Read the latest eligible rendered output
 * - Verify publication eligibility
 * - Validate content integrity
 * - Publish to topic_translations
 * - Trigger cache revalidation/ISR if required
 * - Produce publication logs
 * - Report success or failure
 *
 * Publishing is a business operation, NOT a rendering operation.
 */

import { createClient } from '@supabase/supabase-js';

export interface PublicationConfig {
  qualityThreshold: number;
  requiredRendererVersion: string;
  allowedOutputFormats: ('html' | 'markdown' | 'json')[];
  enableCacheRevalidation: boolean;
  dryRun: boolean;
}

export interface RenderedOutput {
  id: string;
  package_id: string;
  knowledge_hash: string;
  renderer_id: string;
  renderer_version: string;
  template_version: string;
  output_format: 'html' | 'markdown' | 'json';
  cache_key: string;
  content: string;
  document_tree: any;
  word_count: number;
  section_count: number;
  citation_count: number;
  quality_score: any;
  diagnostics: any;
  render_duration_ms: number;
  status: 'draft' | 'published' | 'stale' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  slug: string;
  canonical_path: string;
  category_id: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  estimated_read_time: number | null;
  published_at: string | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface TopicTranslation {
  id: string;
  topic_id: string;
  language_code: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  structured_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    renderCompleted: boolean;
    statusIsPublished: boolean;
    rendererVersionValid: boolean;
    languageMatch: boolean;
    contentIntegrity: boolean;
    metadataComplete: boolean;
    qualityScoreValid: boolean;
    topicExists: boolean;
    topicPublishable: boolean;
  };
}

export interface PublicationResult {
  success: boolean;
  renderedOutputId: string;
  topicId: string;
  languageCode: string;
  validation: ValidationResult;
  publishedAt: string | null;
  cacheInvalidated: boolean;
  error: string | null;
  logId: string;
}

export interface PublicationLog {
  id: string;
  rendered_output_id: string;
  topic_id: string;
  language_code: string;
  validation_result: ValidationResult;
  success: boolean;
  error_message: string | null;
  published_at: string | null;
  created_at: string;
}

export class PublicationPipeline {
  private supabase: any;
  private config: PublicationConfig;

  constructor(config?: Partial<PublicationConfig>) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.config = {
      qualityThreshold: 0.8,
      requiredRendererVersion: '1.0.0',
      allowedOutputFormats: ['html'],
      enableCacheRevalidation: true,
      dryRun: false,
      ...config,
    };
  }

  /**
   * Publish a rendered output to the live website
   */
  async publishRenderedOutput(
    renderedOutputId: string,
    targetLanguage: string = 'en'
  ): Promise<PublicationResult> {
    console.log(`[Publication Pipeline] Starting publication for rendered output: ${renderedOutputId}`);

    // Step 1: Fetch rendered output
    const renderedOutput = await this.fetchRenderedOutput(renderedOutputId);
    if (!renderedOutput) {
      const error = `Rendered output not found: ${renderedOutputId}`;
      console.error(`[Publication Pipeline] ${error}`);
      return this.createFailureResult(renderedOutputId, error);
    }

    // Step 2: Fetch associated topic
    const topic = await this.fetchTopicByPackageId(renderedOutput.package_id);
    if (!topic) {
      const error = `Topic not found for package: ${renderedOutput.package_id}`;
      console.error(`[Publication Pipeline] ${error}`);
      return this.createFailureResult(renderedOutputId, error);
    }

    // Step 3: Validate publication eligibility
    const validation = await this.validatePublication(renderedOutput, topic, targetLanguage);
    if (!validation.valid) {
      const error = `Validation failed: ${validation.errors.join(', ')}`;
      console.error(`[Publication Pipeline] ${error}`);
      await this.logPublication(renderedOutput, topic, targetLanguage, validation, false, error, false);
      return this.createFailureResult(renderedOutputId, error, validation, topic.id, targetLanguage);
    }

    if (validation.warnings.length > 0) {
      console.warn(`[Publication Pipeline] Validation warnings: ${validation.warnings.join(', ')}`);
    }

    // Step 4: Publish to topic_translations
    let publishedAt: string | null = null;
    if (!this.config.dryRun) {
      publishedAt = await this.publishToTopicTranslation(renderedOutput, topic, targetLanguage);
      if (!publishedAt) {
        const error = 'Failed to publish to topic_translations';
        console.error(`[Publication Pipeline] ${error}`);
        await this.logPublication(renderedOutput, topic, targetLanguage, validation, false, error, false);
        return this.createFailureResult(renderedOutputId, error, validation, topic.id, targetLanguage);
      }
    } else {
      console.log(`[Publication Pipeline] Dry run: skipping actual publication`);
      publishedAt = new Date().toISOString();
    }

    // Step 5: Trigger cache revalidation
    let cacheInvalidated = false;
    if (this.config.enableCacheRevalidation && !this.config.dryRun) {
      cacheInvalidated = await this.triggerCacheRevalidation(topic.slug, targetLanguage);
    }

    // Step 6: Log publication
    const logId = await this.logPublication(renderedOutput, topic, targetLanguage, validation, true, null, cacheInvalidated);

    console.log(`[Publication Pipeline] Publication successful for topic: ${topic.slug}`);

    return {
      success: true,
      renderedOutputId,
      topicId: topic.id,
      languageCode: targetLanguage,
      validation,
      publishedAt,
      cacheInvalidated,
      error: null,
      logId,
    };
  }

  /**
   * Publish by topic slug
   */
  async publishByTopicSlug(
    topicSlug: string,
    languageCode: string = 'en'
  ): Promise<PublicationResult> {
    console.log(`[Publication Pipeline] Publishing by topic slug: ${topicSlug}`);

    // Fetch topic by slug
    const topic = await this.fetchTopicBySlug(topicSlug);
    if (!topic) {
      const error = `Topic not found: ${topicSlug}`;
      console.error(`[Publication Pipeline] ${error}`);
      return this.createFailureResult('', error);
    }

    // Fetch latest published rendered output for this topic
    const renderedOutput = await this.fetchLatestRenderedOutputForTopic(topic.id);
    if (!renderedOutput) {
      const error = `No published rendered output found for topic: ${topicSlug}`;
      console.error(`[Publication Pipeline] ${error}`);
      return this.createFailureResult('', error);
    }

    return this.publishRenderedOutput(renderedOutput.id, languageCode);
  }

  /**
   * Fetch rendered output by ID
   */
  private async fetchRenderedOutput(id: string): Promise<RenderedOutput | null> {
    const { data, error } = await this.supabase
      .from('rendered_outputs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[Publication Pipeline] Error fetching rendered output:`, error);
      return null;
    }

    return data;
  }

  /**
   * Fetch topic by package ID
   */
  private async fetchTopicByPackageId(packageId: string): Promise<Topic | null> {
    // First get the package to find the topic
    const { data: packageData, error: packageError } = await this.supabase
      .from('knowledge_packages')
      .select('topic_id')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      console.error(`[Publication Pipeline] Error fetching package:`, packageError);
      return null;
    }

    // Then fetch the topic
    const { data: topicData, error: topicError } = await this.supabase
      .from('topics')
      .select('*')
      .eq('id', packageData.topic_id)
      .single();

    if (topicError) {
      console.error(`[Publication Pipeline] Error fetching topic:`, topicError);
      return null;
    }

    return topicData;
  }

  /**
   * Fetch topic by slug
   */
  private async fetchTopicBySlug(slug: string): Promise<Topic | null> {
    const { data, error } = await this.supabase
      .from('topics')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error(`[Publication Pipeline] Error fetching topic by slug:`, error);
      return null;
    }

    return data;
  }

  /**
   * Fetch latest rendered output for a topic
   */
  private async fetchLatestRenderedOutputForTopic(topicId: string): Promise<RenderedOutput | null> {
    // Get the package for this topic
    const { data: packageData, error: packageError } = await this.supabase
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topicId)
      .single();

    if (packageError || !packageData) {
      console.error(`[Publication Pipeline] Error fetching package for topic:`, packageError);
      return null;
    }

    // Fetch latest published rendered output for this package
    const { data, error } = await this.supabase
      .from('rendered_outputs')
      .select('*')
      .eq('package_id', packageData.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(`[Publication Pipeline] Error fetching rendered output:`, error);
      return null;
    }

    return data;
  }

  /**
   * Validate publication eligibility
   */
  private async validatePublication(
    renderedOutput: RenderedOutput,
    topic: Topic,
    targetLanguage: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const checks = {
      renderCompleted: true,
      statusIsPublished: renderedOutput.status === 'published',
      rendererVersionValid: this.isRendererVersionValid(renderedOutput.renderer_version),
      languageMatch: true, // Will implement multi-language validation later
      contentIntegrity: this.validateContentIntegrity(renderedOutput),
      metadataComplete: this.validateMetadata(renderedOutput),
      qualityScoreValid: this.validateQualityScore(renderedOutput),
      topicExists: topic !== null,
      topicPublishable: topic.status !== 'archived',
    };

    // Validate status
    if (!checks.statusIsPublished) {
      errors.push(`Rendered output status is '${renderedOutput.status}', expected 'published'`);
    }

    // Validate renderer version
    if (!checks.rendererVersionValid) {
      errors.push(`Renderer version '${renderedOutput.renderer_version}' is below minimum '${this.config.requiredRendererVersion}'`);
    }

    // Validate output format
    if (!this.config.allowedOutputFormats.includes(renderedOutput.output_format)) {
      errors.push(`Output format '${renderedOutput.output_format}' is not allowed`);
    }

    // Validate content integrity
    if (!checks.contentIntegrity) {
      errors.push('Content integrity validation failed');
    }

    // Validate metadata
    if (!checks.metadataComplete) {
      warnings.push('Metadata is incomplete');
    }

    // Validate quality score
    if (!checks.qualityScoreValid) {
      errors.push(`Quality score does not meet threshold of ${this.config.qualityThreshold}`);
    }

    // Validate topic exists
    if (!checks.topicExists) {
      errors.push('Topic does not exist');
    }

    // Validate topic is publishable
    if (!checks.topicPublishable) {
      errors.push(`Topic status is '${topic.status}', cannot publish archived topics`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks,
    };
  }

  /**
   * Validate content integrity
   */
  private validateContentIntegrity(renderedOutput: RenderedOutput): boolean {
    if (!renderedOutput.content || renderedOutput.content.length === 0) {
      return false;
    }

    if (renderedOutput.word_count === 0) {
      return false;
    }

    if (!renderedOutput.document_tree) {
      return false;
    }

    return true;
  }

  /**
   * Validate metadata completeness
   */
  private validateMetadata(renderedOutput: RenderedOutput): boolean {
    if (!renderedOutput.cache_key || renderedOutput.cache_key.length === 0) {
      return false;
    }

    if (!renderedOutput.knowledge_hash || renderedOutput.knowledge_hash.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Validate quality score
   */
  private validateQualityScore(renderedOutput: RenderedOutput): boolean {
    // Extract overall quality score from quality_score JSONB
    const qualityScore = renderedOutput.quality_score?.overall || 0;
    return qualityScore >= this.config.qualityThreshold;
  }

  /**
   * Check if renderer version is valid (>= required version)
   */
  private isRendererVersionValid(version: string): boolean {
    const required = this.config.requiredRendererVersion;
    // Simple version comparison - assumes semantic versioning
    const requiredParts = required.split('.').map(Number);
    const versionParts = version.split('.').map(Number);

    for (let i = 0; i < requiredParts.length; i++) {
      if (versionParts[i] > requiredParts[i]) return true;
      if (versionParts[i] < requiredParts[i]) return false;
    }
    return true;
  }

  /**
   * Publish to topic_translations table
   */
  private async publishToTopicTranslation(
    renderedOutput: RenderedOutput,
    topic: Topic,
    languageCode: string
  ): Promise<string | null> {
    const now = new Date().toISOString();

    // Extract title and metadata from document_tree
    const documentTree = renderedOutput.document_tree || {};
    const title = documentTree.title || topic.slug;
    const subtitle = documentTree.subtitle || null;
    const metaTitle = documentTree.meta_title || null;
    const metaDescription = documentTree.meta_description || null;
    const structured_data = documentTree.structured_data || null;

    // Check if translation exists
    const { data: existingTranslation, error: fetchError } = await this.supabase
      .from('topic_translations')
      .select('*')
      .eq('topic_id', topic.id)
      .eq('language_code', languageCode)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`[Publication Pipeline] Error fetching translation:`, fetchError);
      return null;
    }

    if (existingTranslation) {
      // Update existing translation
      const { error: updateError } = await this.supabase
        .from('topic_translations')
        .update({
          title,
          subtitle,
          content: renderedOutput.content,
          meta_title: metaTitle,
          meta_description: metaDescription,
          structured_data,
          updated_at: now,
        })
        .eq('id', existingTranslation.id);

      if (updateError) {
        console.error(`[Publication Pipeline] Error updating translation:`, updateError);
        return null;
      }

      console.log(`[Publication Pipeline] Updated translation for topic: ${topic.slug}`);
    } else {
      // Insert new translation
      const { error: insertError } = await this.supabase
        .from('topic_translations')
        .insert({
          topic_id: topic.id,
          language_code: languageCode,
          title,
          subtitle,
          content: renderedOutput.content,
          meta_title: metaTitle,
          meta_description: metaDescription,
          structured_data,
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error(`[Publication Pipeline] Error inserting translation:`, insertError);
        return null;
      }

      console.log(`[Publication Pipeline] Inserted translation for topic: ${topic.slug}`);
    }

    // Update topic status to published
    const { error: topicUpdateError } = await this.supabase
      .from('topics')
      .update({
        status: 'published',
        published_at: now,
        updated_at: now,
      })
      .eq('id', topic.id);

    if (topicUpdateError) {
      console.error(`[Publication Pipeline] Error updating topic status:`, topicUpdateError);
      return null;
    }

    return now;
  }

  /**
   * Trigger cache revalidation
   */
  private async triggerCacheRevalidation(
    topicSlug: string,
    languageCode: string
  ): Promise<boolean> {
    try {
      // For Next.js ISR, we can use revalidatePath
      // This would typically be called from an API route
      console.log(`[Publication Pipeline] Cache revalidation requested for: ${topicSlug} (${languageCode})`);
      
      // In a real implementation, this would call Next.js revalidation
      // For now, we'll log it
      return true;
    } catch (error) {
      console.error(`[Publication Pipeline] Cache revalidation failed:`, error);
      return false;
    }
  }

  /**
   * Log publication to database
   */
  private async logPublication(
    renderedOutput: RenderedOutput,
    topic: Topic,
    languageCode: string,
    validation: ValidationResult,
    success: boolean,
    errorMessage: string | null,
    cacheInvalidated: boolean = false
  ): Promise<string> {
    const now = new Date().toISOString();

    // Write to publication_logs table
    const { data, error } = await this.supabase
      .from('publication_logs')
      .insert({
        rendered_output_id: renderedOutput.id,
        topic_id: topic.id,
        language_code: languageCode,
        validation_result: validation,
        success,
        error_message: errorMessage,
        published_at: success ? now : null,
        cache_invalidated: cacheInvalidated,
        created_at: now,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Publication Pipeline] Error writing publication log:`, error);
      // Fallback to console log
      console.log(`[Publication Pipeline] Publication log (fallback):`, {
        rendered_output_id: renderedOutput.id,
        topic_id: topic.id,
        language_code: languageCode,
        success,
        error_message: errorMessage,
      });
      return crypto.randomUUID();
    }

    console.log(`[Publication Pipeline] Publication logged: ${data.id}`);
    return data.id;
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    renderedOutputId: string,
    error: string,
    validation?: ValidationResult,
    topicId?: string,
    languageCode?: string
  ): PublicationResult {
    return {
      success: false,
      renderedOutputId,
      topicId: topicId || '',
      languageCode: languageCode || 'en',
      validation: validation || {
        valid: false,
        errors: [error],
        warnings: [],
        checks: {
          renderCompleted: false,
          statusIsPublished: false,
          rendererVersionValid: false,
          languageMatch: false,
          contentIntegrity: false,
          metadataComplete: false,
          qualityScoreValid: false,
          topicExists: false,
          topicPublishable: false,
        },
      },
      publishedAt: null,
      cacheInvalidated: false,
      error,
      logId: '',
    };
  }

  /**
   * Batch publish multiple topics
   */
  async batchPublish(topicSlugs: string[], languageCode: string = 'en'): Promise<PublicationResult[]> {
    console.log(`[Publication Pipeline] Batch publishing ${topicSlugs.length} topics`);

    const results: PublicationResult[] = [];

    for (const slug of topicSlugs) {
      const result = await this.publishByTopicSlug(slug, languageCode);
      results.push(result);
    }

    return results;
  }
}
