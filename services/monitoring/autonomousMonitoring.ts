/**
 * Autonomous Content Health Monitoring Service
 * 
 * Automatically monitors content health and flags issues
 * No manual intervention required
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";

const supabase = getAdminClient();

export interface HealthIssue {
  topicSlug: string;
  issueType: string;
  severity: "low" | "medium" | "high";
  description: string;
}

/**
 * Monitor content health for all published topics
 */
export async function monitorContentHealth(): Promise<HealthIssue[]> {
  console.log("Monitoring content health...");

  const issues: HealthIssue[] = [];

  try {
    // Get all published topics
    const { data: topics } = await supabase
      .from("topics")
      .select("id, slug, title, content, published_at")
      .eq("status", "published");

    if (!topics || topics.length === 0) {
      console.log("No published topics to monitor");
      return issues;
    }

    console.log(`Monitoring ${topics.length} topics`);

    for (const topic of topics) {
      const topicIssues = await checkTopicHealth(topic);
      issues.push(...topicIssues);
    }

    console.log(`Found ${issues.length} health issues`);

    // Log issues for review
    await logHealthIssues(issues);

    return issues;

  } catch (error) {
    console.error("Error monitoring content health:", error);
    return issues;
  }
}

/**
 * Check health of a single topic
 */
async function checkTopicHealth(topic: any): Promise<HealthIssue[]> {
  const issues: HealthIssue[] = [];

  // Check if content is too short
  if (topic.content && topic.content.length < 500) {
    issues.push({
      topicSlug: topic.slug,
      issueType: "short_content",
      severity: "medium",
      description: "Content is too short (< 500 chars)"
    });
  }

  // Check if topic is very old (published > 1 year ago)
  const publishedAt = new Date(topic.published_at);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (publishedAt < oneYearAgo) {
    issues.push({
      topicSlug: topic.slug,
      issueType: "old_content",
      severity: "low",
      description: "Content is over 1 year old"
    });
  }

  // Check if topic has no internal links
  const { count: linkCount } = await supabase
    .from("internal_links")
    .select("*", { count: "exact", head: true })
    .or(`source_id.eq.${topic.id},target_id.eq.${topic.id}`);

  if ((linkCount || 0) === 0) {
    issues.push({
      topicSlug: topic.slug,
      issueType: "no_internal_links",
      severity: "medium",
      description: "Topic has no internal links"
    });
  }

  return issues;
}

/**
 * Log health issues to database
 */
async function logHealthIssues(issues: HealthIssue[]): Promise<void> {
  if (issues.length === 0) return;

  for (const issue of issues) {
    await supabase
      .from("content_health_issues")
      .insert({
        topic_slug: issue.topicSlug,
        issue_type: issue.issueType,
        severity: issue.severity,
        description: issue.description,
        created_at: new Date().toISOString()
      });
  }
}

/**
 * Run continuous health monitoring
 */
export async function runContinuousMonitoring(): Promise<void> {
  console.log("Starting continuous content health monitoring...");

  while (true) {
    await monitorContentHealth();

    // Check every day
    await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000));
  }
}
