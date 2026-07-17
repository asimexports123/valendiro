/**
 * Controlled Publisher - Phase 1
 * 
 * Direct publishing path for controlled PSEO content.
 * Bypasses autonomous Brain/TopicModel/Planner/Composer pipeline.
 * Writes directly to topic_translations as canonical content source.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface PublishTopicRequest {
  topicId: string;
  languageCode: string;
  title: string;
  subtitle?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'published';
}

export interface PublishResult {
  success: boolean;
  topicId: string;
  error?: string;
}

/**
 * Publish or update topic content directly to topic_translations.
 * This is the canonical publishing path for controlled PSEO content.
 */
export async function publishTopicControlled(request: PublishTopicRequest): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    // Check if topic exists
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, slug, status')
      .eq('id', request.topicId)
      .maybeSingle();

    if (topicError || !topic) {
      return {
        success: false,
        topicId: request.topicId,
        error: `Topic not found: ${request.topicId}`,
      };
    }

    // Update or insert topic translation
    const { error: translationError } = await supabase
      .from('topic_translations')
      .upsert({
        topic_id: request.topicId,
        language_code: request.languageCode,
        title: request.title,
        subtitle: request.subtitle || null,
        content: request.content,
        meta_title: request.metaTitle || null,
        meta_description: request.metaDescription || null,
      }, {
        onConflict: 'topic_id,language_code',
      });

    if (translationError) {
      return {
        success: false,
        topicId: request.topicId,
        error: `Failed to update translation: ${translationError.message}`,
      };
    }

    // Update topic status if publishing
    if (request.status === 'published' && topic.status !== 'published') {
      const { error: statusError } = await supabase
        .from('topics')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.topicId);

      if (statusError) {
        return {
          success: false,
          topicId: request.topicId,
          error: `Failed to update topic status: ${statusError.message}`,
        };
      }
    }

    return {
      success: true,
      topicId: request.topicId,
    };
  } catch (error: any) {
    return {
      success: false,
      topicId: request.topicId,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Create a new topic and publish content in one operation.
 */
export async function createAndPublishTopic(params: {
  slug: string;
  categoryId?: string;
  subcategoryId?: string;
  languageCode: string;
  title: string;
  subtitle?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}): Promise<PublishResult & { topicId?: string }> {
  const supabase = createAdminClient();

  try {
    // Check for slug duplicate
    const { data: existing } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', params.slug)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        topicId: existing.id,
        error: `Slug already exists: ${params.slug}`,
      };
    }

    // Create topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .insert({
        slug: params.slug,
        category_id: params.categoryId || null,
        subcategory_id: params.subcategoryId || null,
        canonical_path: `/en/topics/${params.slug}`,
        status: 'draft',
      })
      .select('id')
      .single();

    if (topicError || !topic) {
      return {
        success: false,
        topicId: '',
        error: `Failed to create topic: ${topicError?.message}`,
      };
    }

    // Publish content
    const publishResult = await publishTopicControlled({
      topicId: topic.id,
      languageCode: params.languageCode,
      title: params.title,
      subtitle: params.subtitle,
      content: params.content,
      metaTitle: params.metaTitle,
      metaDescription: params.metaDescription,
      status: 'draft',
    });

    if (!publishResult.success) {
      return {
        success: false,
        topicId: topic.id,
        error: publishResult.error,
      };
    }

    return {
      success: true,
      topicId: topic.id,
    };
  } catch (error: any) {
    return {
      success: false,
      topicId: '',
      error: error.message || 'Unknown error',
    };
  }
}
