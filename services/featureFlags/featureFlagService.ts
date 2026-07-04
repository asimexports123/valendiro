/**
 * Feature Flag Service
 *
 * Controls gradual rollout of new systems.
 *
 * Flags:
 * - USE_KNOWLEDGE_AUTHORING_ENGINE: Enable new Knowledge Authoring Engine
 * - ENABLED_TOPICS: Comma-separated list of topics to use new engine
 */

export interface FeatureFlagConfig {
  useKnowledgeAuthoringEngine: boolean;
  enabledTopics: string[];
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private config: FeatureFlagConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  private loadConfig(): FeatureFlagConfig {
    return {
      useKnowledgeAuthoringEngine: process.env.USE_KNOWLEDGE_AUTHORING_ENGINE === "true",
      enabledTopics: this.parseEnabledTopics(),
    };
  }

  private parseEnabledTopics(): string[] {
    const topics = process.env.KNOWLEDGE_AUTHORING_ENABLED_TOPICS || "";
    return topics.split(",").map(t => t.trim()).filter(t => t.length > 0);
  }

  /**
   * Check if Knowledge Authoring Engine should be used for a topic
   */
  shouldUseKnowledgeAuthoringEngine(topicSlug: string): boolean {
    if (!this.config.useKnowledgeAuthoringEngine) {
      return false;
    }

    // If no specific topics listed, enable for all
    if (this.config.enabledTopics.length === 0) {
      return true;
    }

    // Check if topic is in enabled list
    return this.config.enabledTopics.includes(topicSlug);
  }

  /**
   * Reload config (useful for testing)
   */
  reload(): void {
    this.config = this.loadConfig();
  }

  /**
   * Get current config (for debugging)
   */
  getConfig(): FeatureFlagConfig {
    return { ...this.config };
  }
}
