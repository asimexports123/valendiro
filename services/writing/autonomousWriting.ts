/**
 * Autonomous Article Writing Service
 * 
 * Generates actual article content from Knowledge Packages
 * Converts facts into readable article text
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";
import { updateTopicFields } from "@/services/publish/writers";

const supabase = getAdminClient();

export interface ArticleContent {
  title: string;
  introduction: string;
  sections: ArticleSection[];
  conclusion: string;
}

export interface ArticleSection {
  heading: string;
  content: string;
}

/**
 * Generate article content from Knowledge Package
 */
export async function generateArticleContent(topicSlug: string, knowledgePackage: any): Promise<ArticleContent> {
  console.log(`Generating article content for: ${topicSlug}`);

  const facts = knowledgePackage.facts || [];
  const title = knowledgePackage.title || topicSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  // Generate introduction
  const introduction = generateIntroduction(title, facts);

  // Generate sections from facts
  const sections = generateSections(facts);

  // Generate conclusion
  const conclusion = generateConclusion(title);

  return {
    title,
    introduction,
    sections,
    conclusion
  };
}

/**
 * Clean markdown artifacts from text
 */
function cleanMarkdownArtifacts(text: string): string {
  return text
    .replace(/\[!NOTE\]/g, "")
    .replace(/\[!TIP\]/g, "")
    .replace(/\[!WARNING\]/g, "")
    .replace(/\[!IMPORTANT\]/g, "")
    .replace(/Definition /g, "")
    .replace(/Expert Perspective /g, "")
    .replace(/What to Learn Next /g, "")
    .trim();
}

/**
 * Generate introduction from facts
 */
function generateIntroduction(title: string, facts: any[]): string {
  const primaryFact = facts.find(f => f.confidence > 0.8);
  if (!primaryFact) {
    return `${title} is an important topic to understand. This guide will help you learn the fundamentals.`;
  }
  // Clean up markdown artifacts from the statement
  const cleanStatement = cleanMarkdownArtifacts(primaryFact.statement || "");
  return `${title} is essential for building a strong foundation. ${cleanStatement}`;
}

/**
 * Generate sections from facts
 */
function generateSections(facts: any[]): ArticleSection[] {
  const sections: ArticleSection[] = [];
  
  // Group facts by category
  const factGroups = groupFactsByCategory(facts);
  
  for (const [category, categoryFacts] of Object.entries(factGroups)) {
    if (categoryFacts.length > 0) {
      const sectionContent = categoryFacts
        .map(f => cleanMarkdownArtifacts(f.statement || ""))
        .join(" ");
      
      sections.push({
        heading: category,
        content: sectionContent
      });
    }
  }

  return sections;
}

/**
 * Group facts by category
 */
function groupFactsByCategory(facts: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  for (const fact of facts) {
    const category = fact.category || "Overview";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(fact);
  }
  
  return groups;
}

/**
 * Generate conclusion
 */
function generateConclusion(title: string): string {
  return `By understanding ${title.toLowerCase()}, you'll be better equipped to apply these concepts in real-world situations. Continue learning to deepen your knowledge.`;
}

/**
 * Write article content to topic
 */
export async function writeArticleToTopic(topicSlug: string, articleContent: ArticleContent): Promise<void> {
  console.log(`Writing article content for: ${topicSlug}`);

  // Build full article HTML
  const articleHtml = buildArticleHtml(articleContent);

  // Update topic with content
  const { data: topic } = await supabase.from("topics").select("id").eq("slug", topicSlug).single();
  if (!topic) throw new Error(`Topic not found: ${topicSlug}`);

  await updateTopicFields(topic.id, {
    content: articleHtml,
    html_content: articleHtml,
  });

  console.log(`Article written for ${topicSlug}`);
}

/**
 * Build article HTML from content
 */
function buildArticleHtml(content: ArticleContent): string {
  let html = `<h1>${content.title}</h1>\n\n`;
  html += `<p>${content.introduction}</p>\n\n`;
  
  for (const section of content.sections) {
    html += `<h2>${section.heading}</h2>\n`;
    html += `<p>${section.content}</p>\n\n`;
  }
  
  html += `<h2>Conclusion</h2>\n`;
  html += `<p>${content.conclusion}</p>\n`;
  
  return html;
}
