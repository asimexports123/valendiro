/**
 * Regenerate Content for Existing Published Topics
 * 
 * Updates existing published topics with actual article content
 * Using the new writing service that was deployed
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

// Inline writing functions to avoid import issues
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

function generateIntroduction(title: string, facts: any[]): string {
  const primaryFact = facts.find(f => f.confidence > 0.8);
  if (!primaryFact) {
    return `${title} is an important topic to understand. This guide will help you learn the fundamentals.`;
  }
  const cleanStatement = cleanMarkdownArtifacts(primaryFact.statement || "");
  return `${title} is essential for building a strong foundation. ${cleanStatement}`;
}

function generateSections(facts: any[]): any[] {
  const sections: any[] = [];
  const groups: Record<string, any[]> = {};
  
  for (const fact of facts) {
    const category = fact.category || "Overview";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(fact);
  }
  
  for (const [category, categoryFacts] of Object.entries(groups)) {
    if (categoryFacts.length > 0) {
      const sectionContent = categoryFacts
        .map(f => cleanMarkdownArtifacts(f.statement || ""))
        .join(" ");
      sections.push({ heading: category, content: sectionContent });
    }
  }
  
  return sections;
}

function generateConclusion(title: string): string {
  return `By understanding ${title.toLowerCase()}, you'll be better equipped to apply these concepts in real-world situations. Continue learning to deepen your knowledge.`;
}

function buildArticleHtml(title: string, introduction: string, sections: any[], conclusion: string): string {
  let html = `<h1>${title}</h1>\n\n`;
  html += `<p>${introduction}</p>\n\n`;
  
  for (const section of sections) {
    html += `<h2>${section.heading}</h2>\n`;
    html += `<p>${section.content}</p>\n\n`;
  }
  
  html += `<h2>Conclusion</h2>\n`;
  html += `<p>${conclusion}</p>\n`;
  
  return html;
}

async function regenerateContentForTopic(topicSlug: string): Promise<void> {
  console.log(`Regenerating content for: ${topicSlug}`);

  try {
    // Get the Knowledge Package for this topic
    const { data: packageData } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_slug", topicSlug)
      .single();

    if (!packageData) {
      console.log(`No Knowledge Package found for ${topicSlug}, skipping`);
      return;
    }

    const facts = packageData.package?.facts || [];
    const title = packageData.package?.title || topicSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    // Generate article content inline
    const introduction = generateIntroduction(title, facts);
    const sections = generateSections(facts);
    const conclusion = generateConclusion(title);
    const articleHtml = buildArticleHtml(title, introduction, sections, conclusion);

    // Update topic with content
    const { error } = await supabase
      .from("topics")
      .update({
        content: articleHtml,
        html_content: articleHtml
      })
      .eq("slug", topicSlug);

    if (error) {
      throw new Error(`Failed to write article: ${error.message}`);
    }
    
    console.log(`✓ Content regenerated for ${topicSlug}`);

  } catch (error) {
    console.error(`✗ Failed to regenerate content for ${topicSlug}:`, error);
  }
}

async function regenerateAllPublishedTopics(): Promise<void> {
  console.log("Regenerating content from knowledge packages...");

  // Get all knowledge packages
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("*");

  if (!packages || packages.length === 0) {
    console.log("No knowledge packages found");
    return;
  }

  console.log(`Found ${packages.length} knowledge packages`);

  for (const pkg of packages) {
    const topicSlug = pkg.slug;
    console.log(`Processing: ${topicSlug}`);

    try {
      const facts = pkg.package?.facts || [];
      const title = pkg.package?.title || topicSlug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

      // Generate article content inline
      const introduction = generateIntroduction(title, facts);
      const sections = generateSections(facts);
      const conclusion = generateConclusion(title);
      const articleHtml = buildArticleHtml(title, introduction, sections, conclusion);

      // Check if topic exists, if not create it
      const { data: existingTopic } = await supabase
        .from("topics")
        .select("id")
        .eq("slug", topicSlug)
        .single();

      if (existingTopic) {
        // Update existing topic
        await supabase
          .from("topics")
          .update({
            content: articleHtml,
            html_content: articleHtml,
            status: "published"
          })
          .eq("slug", topicSlug);
        console.log(`✓ Updated topic: ${topicSlug}`);
      } else {
        // Create new topic
        await supabase
          .from("topics")
          .insert({
            slug: topicSlug,
            title: title,
            content: articleHtml,
            html_content: articleHtml,
            status: "published"
          });
        console.log(`✓ Created topic: ${topicSlug}`);
      }

    } catch (error) {
      console.error(`✗ Failed to process ${topicSlug}:`, error);
    }
  }

  console.log("Content regeneration complete");
}

regenerateAllPublishedTopics()
  .then(() => {
    console.log("✅ All done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
