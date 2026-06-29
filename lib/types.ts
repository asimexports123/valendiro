import { AppRole, SupportedLanguage } from "./constants";

export type { SupportedLanguage };

export type IntentType = "informational" | "commercial" | "transactional" | "navigational";

export interface Profile {
  id: string;
  email: string;
  role: AppRole;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Language {
  code: SupportedLanguage;
  name: string;
  native_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface CategoryTranslation {
  id: string;
  category_id: string;
  language_code: SupportedLanguage;
  name: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  slug: string;
  created_at: string;
}

export interface TagTranslation {
  id: string;
  tag_id: string;
  language_code: SupportedLanguage;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  slug: string;
  canonical_path: string;
  category_id: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimated_read_time: number | null;
  published_at: string | null;
  status: "draft" | "review" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface TopicTranslation {
  id: string;
  topic_id: string;
  language_code: SupportedLanguage;
  title: string;
  subtitle: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  structured_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  slug: string;
  topic_id: string | null;
  answer_type: "short" | "long" | "step_by_step" | "comparison" | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  published_at: string | null;
  status: "draft" | "review" | "published" | "archived";
  intent_type?: IntentType | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionTranslation {
  id: string;
  question_id: string;
  language_code: SupportedLanguage;
  question_text: string;
  answer: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entity {
  id: string;
  slug: string;
  entity_type: "person" | "organization" | "product" | "place" | "concept" | "event" | "technology";
  canonical_path: string;
  published_at: string | null;
  status: "draft" | "review" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface EntityTranslation {
  id: string;
  entity_id: string;
  language_code: SupportedLanguage;
  name: string;
  description: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  structured_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeObject {
  id: string;
  slug: string;
  object_type: "fact" | "definition" | "procedure" | "comparison" | "principle" | "statistic";
  canonical_path: string;
  confidence_score: number | null;
  source_ids: string[] | null;
  published_at: string | null;
  status: "draft" | "review" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface KnowledgeObjectTranslation {
  id: string;
  knowledge_object_id: string;
  language_code: SupportedLanguage;
  title: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export type ArticleLifecycleStatus = "draft" | "published" | "indexed" | "growing" | "stable" | "declining" | "update_required" | "archived";

export interface Article {
  id: string;
  slug: string;
  canonical_path: string;
  article_type: "guide" | "explainer" | "reference" | "comparison" | "tutorial";
  published_at: string | null;
  status: "draft" | "review" | "published" | "archived";
  lifecycle_status: ArticleLifecycleStatus;
  created_at: string;
  updated_at: string;
}

export interface ArticleTranslation {
  id: string;
  article_id: string;
  language_code: SupportedLanguage;
  title: string;
  excerpt: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  structured_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  url: string | null;
  source_type: "academic" | "government" | "industry" | "news" | "book" | "dataset" | "other";
  reliability_score: number | null;
  published_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceTranslation {
  id: string;
  source_id: string;
  language_code: SupportedLanguage;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalLink {
  id: string;
  source_id: string;
  source_type: "topic" | "question" | "entity" | "article" | "knowledge_object";
  target_id: string;
  target_type: "topic" | "question" | "entity" | "article" | "knowledge_object";
  link_text: Record<SupportedLanguage, string> | null;
  link_context: "inline" | "related" | "see_also" | "breadcrumb" | "navigation";
  created_at: string;
}

export interface AffiliateProduct {
  id: string;
  merchant: string;
  product_url: string;
  affiliate_code: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[] | null;
  conversion_score: number;
  estimated_ctr: number;
  commission_rate: number;
  source_network: string | null;
  external_id: string | null;
  last_synced_at: string | null;
  active_from: string | null;
  active_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateProductImport {
  title: string;
  description: string;
  price: number | null;
  image: string | null;
  affiliate_url: string;
  merchant: string;
  category: string;
  tags: string[];
  conversion_score: number;
  source_network: string;
  external_id: string;
}

export interface AffiliateProductTranslation {
  id: string;
  affiliate_product_id: string;
  language_code: SupportedLanguage;
  name: string;
  description: string | null;
  call_to_action: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoMetadata {
  id: string;
  object_id: string;
  object_type: "topic" | "question" | "entity" | "article" | "knowledge_object" | "category" | "tag";
  language_code: SupportedLanguage;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card: "summary" | "summary_large_image" | null;
  noindex: boolean;
  nofollow: boolean;
  hreflang_group_id: string | null;
  structured_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateQueue {
  id: string;
  object_id: string;
  object_type: "topic" | "question" | "entity" | "article" | "knowledge_object" | "seo" | "translation" | "internal_link" | "affiliate";
  job_type: "content_refresh" | "translation" | "seo_optimization" | "internal_linking" | "affiliate_refresh" | "fact_check";
  priority: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: string;
  object_id: string;
  object_type: "topic" | "question" | "entity" | "article" | "knowledge_object";
  language_code: SupportedLanguage;
  metric_type: "views" | "unique_views" | "click_through" | "affiliate_click" | "bounce_rate" | "avg_time";
  value: number;
  recorded_at: string;
  created_at: string;
}

export interface ContentHealthScore {
  id: string;
  object_id: string;
  object_type: KnowledgeObjectType;
  language_code: SupportedLanguage;
  seo_score: number;
  engagement_score: number;
  revenue_score: number;
  freshness_score: number;
  overall_health_score: number;
  score_breakdown: Record<string, unknown> | null;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateConversion {
  id: string;
  affiliate_product_id: string;
  object_id: string;
  object_type: KnowledgeObjectType;
  language_code: SupportedLanguage;
  clicks: number;
  estimated_revenue: number;
  conversion_rate: number;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface DuplicateContentDetection {
  id: string;
  source_object_id: string;
  source_object_type: KnowledgeObjectType;
  target_object_id: string;
  target_object_type: KnowledgeObjectType;
  language_code: SupportedLanguage;
  content_hash: string;
  similarity_score: number;
  status: "pending" | "blocked" | "merged" | "ignored";
  detected_at: string;
  created_at: string;
  updated_at: string;
}

export interface SeoKeywordGap {
  id: string;
  topic_id: string | null;
  keyword: string;
  language_code: SupportedLanguage;
  search_volume_score: number;
  competition_score: number;
  affiliate_potential_score: number;
  opportunity_score: number;
  status: "pending" | "approved" | "ignored";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BreadcrumbItem {
  name: string;
  href: string;
  isCurrent?: boolean;
}

// Intelligence Engine Types
export type KnowledgeObjectType = "topic" | "question" | "entity" | "article" | "knowledge_object";
export type RelationshipType =
  | "belongs_to"
  | "answers"
  | "explains"
  | "references"
  | "related_to"
  | "prerequisite"
  | "follow_up"
  | "sibling"
  | "parent"
  | "child";
export type QueueStatus = "pending" | "approved" | "rejected" | "in_progress" | "completed" | "done";
export type QueueDecisionType = "create" | "update" | "ignore";

export interface ContentScore {
  id: string;
  object_id: string;
  object_type: KnowledgeObjectType;
  language_code: SupportedLanguage;
  search_volume_score: number;
  competition_score: number;
  affiliate_potential_score: number;
  ctr_estimate_score: number;
  freshness_score: number;
  overall_priority_score: number;
  score_metadata: Record<string, unknown> | null;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeRelationship {
  id: string;
  source_id: string;
  source_type: KnowledgeObjectType;
  target_id: string;
  target_type: KnowledgeObjectType;
  relationship_type: RelationshipType;
  strength_score: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ContentGenerationQueueItem {
  id: string;
  object_type: KnowledgeObjectType;
  title: string;
  description: string | null;
  reason: string;
  priority_score: number;
  status: QueueStatus;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  failed_reason: string | null;
  processing_started_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ContentUpdateQueueItem {
  id: string;
  object_id: string;
  object_type: KnowledgeObjectType;
  reason: string;
  priority_score: number;
  status: QueueStatus;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  failed_reason: string | null;
  processing_started_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPriorityQueueItem {
  id: string;
  object_id: string;
  object_type: KnowledgeObjectType;
  priority_score: number;
  decision_type: QueueDecisionType;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "done";
  retry_count: number;
  failed_reason: string | null;
  processing_started_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface SystemEvent {
  id: string;
  event_type: string;
  event_name: string;
  status: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ExecutionLog {
  id: string;
  queue_type: "generation" | "update" | "priority";
  queue_item_id: string;
  object_id: string | null;
  object_type: KnowledgeObjectType | null;
  action: string;
  status: "started" | "success" | "failed" | "retry";
  message: string | null;
  metadata: Record<string, unknown> | null;
  duration_ms: number | null;
  created_at: string;
}

export interface InternalLinkSuggestion {
  id: string;
  source_object_id: string;
  source_object_type: KnowledgeObjectType;
  target_object_id: string;
  target_object_type: KnowledgeObjectType;
  anchor_text: string | null;
  context_snippet: string | null;
  relevance_score: number;
  cluster_strength_score: number;
  status: "pending" | "approved" | "rejected";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Demand Intelligence Types
export type DemandSignalType = "search_intent" | "trend" | "affiliate" | "seasonal" | "competition" | "manual";
export type OpportunitySourceType = "internal_search_intent" | "google_trends" | "search_console" | "affiliate_trends" | "seasonal" | "manual";

export interface DemandSignal {
  id: string;
  signal_type: DemandSignalType;
  source: string;
  keyword: string | null;
  object_id: string | null;
  object_type: KnowledgeObjectType | null;
  language_code: SupportedLanguage;
  volume_score: number;
  trend_score: number;
  seasonal_score: number;
  affiliate_potential_score: number;
  competition_score: number;
  search_intent: IntentType | null;
  category: string | null;
  freshness_score: number;
  status: "pending" | "queued" | "rejected" | "duplicate" | "processed";
  processed_at: string | null;
  cluster_id: string | null;
  metadata: Record<string, unknown> | null;
  recorded_at: string;
  created_at: string;
}

export interface DemandTopicCluster {
  id: string;
  cluster_name: string;
  category: string | null;
  seed_keyword: string;
  keywords: string[];
  demand_score: number;
  competition_score: number;
  opportunity_score: number;
  status: "pending" | "approved" | "rejected";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DemandTopicQueueItem {
  id: string;
  demand_signal_id: string;
  cluster_id: string | null;
  keyword: string;
  title: string;
  description: string | null;
  search_intent: IntentType | null;
  category: string | null;
  language_code: SupportedLanguage;
  demand_score: number;
  competition_score: number;
  opportunity_score: number;
  rejection_reason: string | null;
  status: "pending" | "approved" | "rejected" | "duplicate" | "cannibalized";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DemandAutoCategory {
  id: string;
  category_id: string;
  category_name: string;
  source_count: number;
  created_at: string;
  updated_at: string;
}

export interface TopicGapScore {
  id: string;
  topic_id: string;
  language_code: SupportedLanguage;
  gap_score: number;
  coverage_score: number;
  intent_score: number;
  opportunity_score: number;
  calculated_at: string;
}

export interface TrendScore {
  id: string;
  object_id: string;
  object_type: KnowledgeObjectType;
  language_code: SupportedLanguage;
  trend_score: number;
  source: string;
  metadata: Record<string, unknown> | null;
  calculated_at: string;
}

export interface OpportunitySource {
  id: string;
  source_type: OpportunitySourceType;
  source_name: string;
  config: Record<string, unknown> | null;
  last_run_at: string | null;
  status: "active" | "paused" | "error";
  created_at: string;
  updated_at: string;
}
