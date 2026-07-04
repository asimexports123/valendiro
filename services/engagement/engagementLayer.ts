/**
 * Engagement Layer Service
 * 
 * Generates Layer 2 engagement elements (next page hooks, sidebars, CTAs)
 * Sits on top of Layer 1 core content to maximize user engagement
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";

const supabase = getAdminClient();

export interface EngagementElement {
  topicId: string;
  elementType: "next_page_hook" | "sidebar" | "cta" | "related_content" | "navigation" | "callout";
  position: number;
  content: any;
  targetTopicId?: string;
}

export interface NextPageHook {
  hookText: string;
  targetTopicId: string;
  position: number;
  context: "end_of_article" | "after_section" | "inline";
}

/**
 * Generate next page hooks for a topic based on related topics
 */
export async function generateNextPageHooks(topicId: string, relatedTopicIds: string[]): Promise<void> {
  const hooks: NextPageHook[] = [];

  for (let i = 0; i < relatedTopicIds.length && i < 3; i++) {
    const { data: targetTopic } = await supabase
      .from("topics")
      .select("title, slug")
      .eq("id", relatedTopicIds[i])
      .single();

    if (targetTopic) {
      hooks.push({
        hookText: `Continue learning about ${targetTopic.title}`,
        targetTopicId: relatedTopicIds[i],
        position: i + 1,
        context: "end_of_article"
      });
    }
  }

  // Insert hooks into database
  for (const hook of hooks) {
    await supabase.from("next_page_hooks").insert({
      topic_id: topicId,
      hook_text: hook.hookText,
      target_topic_id: hook.targetTopicId,
      position: hook.position,
      context: hook.context
    });
  }
}

/**
 * Generate sidebar for a topic
 */
export async function generateSidebar(topicId: string, sidebarType: string): Promise<void> {
  const { data: topic } = await supabase
    .from("topics")
    .select("title")
    .eq("id", topicId)
    .single();

  if (!topic) return;

  let content: any = {};

  switch (sidebarType) {
    case "key_takeaways":
      content = {
        items: [
          "Key point 1",
          "Key point 2",
          "Key point 3"
        ]
      };
      break;
    case "quick_answer":
      content = {
        question: topic.title,
        answer: "Quick answer summary..."
      };
      break;
    case "pro_tip":
      content = {
        tip: "Professional tip for better results"
      };
      break;
  }

  await supabase.from("sidebars").insert({
    topic_id: topicId,
    title: sidebarType.replace("_", " ").toUpperCase(),
    content,
    position: 1,
    sidebar_type: sidebarType
  });
}

/**
 * Generate CTA for a topic
 */
export async function generateCTA(topicId: string): Promise<void> {
  await supabase.from("ctas").insert({
    topic_id: topicId,
    cta_text: "Learn more about related topics",
    action_type: "internal_link",
    position: 1,
    is_prominent: false
  });
}

/**
 * Generate complete engagement layer for a topic
 */
export async function generateEngagementLayer(topicId: string, relatedTopicIds: string[]): Promise<void> {
  console.log(`Generating engagement layer for topic: ${topicId}`);

  // Generate next page hooks
  await generateNextPageHooks(topicId, relatedTopicIds);

  // Generate sidebar
  await generateSidebar(topicId, "key_takeaways");

  // Generate CTA
  await generateCTA(topicId);

  console.log(`Engagement layer generated for topic: ${topicId}`);
}
