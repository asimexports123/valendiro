/**
 * Content Lifecycle Manager - Phase 2
 * 
 * Manages the content lifecycle: Draft → Review → Published → Updated/Archived
 * Adapts to existing schema without creating duplicate systems.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type ContentStatus = 'draft' | 'review' | 'published' | 'updated' | 'archived';

export interface LifecycleTransition {
  from: ContentStatus;
  to: ContentStatus;
  allowed: boolean;
  requiresValidation: boolean;
}

export interface LifecycleResult {
  success: boolean;
  currentStatus: ContentStatus;
  previousStatus?: ContentStatus;
  transitionedAt?: string;
  error?: string;
}

// Define allowed transitions
const ALLOWED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ['review', 'published', 'archived'],
  review: ['draft', 'published', 'archived'],
  published: ['updated', 'archived'],
  updated: ['published', 'archived'],
  archived: [] // Archived is terminal state
};

// Transitions that require quality validation
const VALIDATION_REQUIRED_TRANSITIONS: ContentStatus[] = ['published', 'updated'];

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function requiresValidation(to: ContentStatus): boolean {
  return VALIDATION_REQUIRED_TRANSITIONS.includes(to);
}

export async function transitionTopicStatus(
  topicId: string,
  newStatus: ContentStatus,
  options?: {
    skipValidation?: boolean;
    validationScore?: number;
    notes?: string;
  }
): Promise<LifecycleResult> {
  const supabase = createAdminClient();

  try {
    // Get current status
    const { data: topic, error: fetchError } = await supabase
      .from('topics')
      .select('id, slug, status')
      .eq('id', topicId)
      .single();

    if (fetchError || !topic) {
      return {
        success: false,
        currentStatus: 'draft',
        error: `Topic not found: ${topicId}`
      };
    }

    const currentStatus = topic.status as ContentStatus;

    // Check if transition is allowed
    if (!canTransition(currentStatus, newStatus)) {
      return {
        success: false,
        currentStatus,
        error: `Cannot transition from ${currentStatus} to ${newStatus}`
      };
    }

    // Check if validation is required
    if (requiresValidation(newStatus) && !options?.skipValidation) {
      if (options?.validationScore === undefined || options.validationScore < 60) {
        return {
          success: false,
          currentStatus,
          error: 'Content quality validation required and not passed'
        };
      }
    }

    // Perform transition
    const now = new Date().toISOString();
    const updates: Record<string, string> = {
      status: newStatus,
      updated_at: now,
    };

    // Set specific timestamps based on status
    if (newStatus === 'published') {
      updates.published_at = now;
    } else if (newStatus === 'updated') {
      updates.updated_at = now;
    } else if (newStatus === 'archived') {
      updates.archived_at = now;
    }

    const { error: updateError } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', topicId);

    if (updateError) {
      return {
        success: false,
        currentStatus,
        error: `Failed to update status: ${updateError.message}`
      };
    }

    return {
      success: true,
      currentStatus: newStatus,
      previousStatus: currentStatus,
      transitionedAt: now,
    };

  } catch (error: any) {
    return {
      success: false,
      currentStatus: 'draft',
      error: error.message || 'Unknown error'
    };
  }
}

export async function getTopicsByStatus(
  status: ContentStatus,
  limit: number = 50
): Promise<Array<{ id: string; slug: string; title: string; status: string; updated_at: string }>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('topics')
    .select('id, slug, status, updated_at')
    .eq('status', status)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  // Get titles from translations
  const topicIds = data.map(t => t.id);
  const { data: translations } = await supabase
    .from('topic_translations')
    .select('topic_id, title')
    .eq('language_code', 'en')
    .in('topic_id', topicIds);

  const titleMap = new Map(translations?.map(t => [t.topic_id, t.title]) ?? []);

  return data.map(topic => ({
    id: topic.id,
    slug: topic.slug,
    title: titleMap.get(topic.id) || topic.slug,
    status: topic.status,
    updated_at: topic.updated_at,
  }));
}

export async function bulkUpdateTopicStatus(
  topicIds: string[],
  newStatus: ContentStatus,
  options?: {
    skipValidation?: boolean;
  }
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const topicId of topicIds) {
    const result = await transitionTopicStatus(topicId, newStatus, options);
    if (result.success) {
      success++;
    } else {
      failed++;
      errors.push(`${topicId}: ${result.error}`);
    }
  }

  return { success, failed, errors };
}

export async function getLifecycleHistory(topicId: string): Promise<Array<{
  status: ContentStatus;
  timestamp: string;
}>> {
  const supabase = createAdminClient();

  // This would typically use a separate lifecycle_history table
  // For Phase 2, we'll reconstruct from current timestamps
  const { data: topic, error } = await supabase
    .from('topics')
    .select('created_at, published_at, updated_at, archived_at, status')
    .eq('id', topicId)
    .single();

  if (error || !topic) {
    return [];
  }

  const history: Array<{ status: ContentStatus; timestamp: string }> = [];

  if (topic.created_at) {
    history.push({ status: 'draft', timestamp: topic.created_at });
  }

  if (topic.published_at) {
    history.push({ status: 'published', timestamp: topic.published_at });
  }

  if (topic.updated_at && topic.updated_at !== topic.published_at) {
    history.push({ status: 'updated', timestamp: topic.updated_at });
  }

  if (topic.archived_at) {
    history.push({ status: 'archived', timestamp: topic.archived_at });
  }

  return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
