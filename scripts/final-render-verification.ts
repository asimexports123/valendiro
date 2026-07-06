/**
 * Final Render Verification
 * 
 * Extract detailed information about rendered articles for:
 * - nodejs-cluster
 * - vendor-management
 * - family-vacations
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPICS = ["nodejs-cluster", "vendor-management", "family-vacations"];

interface RenderVerification {
  topicSlug: string;
  finalHTML: string;
  finalWordCount: number;
  finalHeadings: string[];
  articleBody: string;
  factsToParagraphs: number;
  averageParagraphLength: number;
  averageWordsPerFact: number;
  isLongerThan1800: boolean;
}

async function verifyFinalRenders() {
  console.log("Final Render Verification");
  console.log("========================\n");

  const supabase = createAdminClient();

  for (const slug of TOPICS) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`TOPIC: ${slug}`);
    console.log("=".repeat(80));

    // Get topic and package
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`❌ Topic not found`);
      continue;
    }

    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id, fact_count")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log(`❌ Knowledge package not found`);
      continue;
    }

    // Get rendered output
    const { data: rendered } = await supabase
      .from("rendered_outputs")
      .select("content, quality_score")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!rendered) {
      console.log(`❌ No rendered output found`);
      continue;
    }

    const verification: RenderVerification = {
      topicSlug: slug,
      finalHTML: rendered.content,
      finalWordCount: rendered.quality_score?.wordCount || 0,
      finalHeadings: [],
      articleBody: rendered.content,
      factsToParagraphs: 0,
      averageParagraphLength: 0,
      averageWordsPerFact: 0,
      isLongerThan1800: false,
    };

    // Extract headings
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    const headings: string[] = [];
    let match;
    while ((match = headingRegex.exec(rendered.content)) !== null) {
      headings.push(`H${match[1]}: ${match[2].replace(/<[^>]*>/g, '')}`);
    }
    verification.finalHeadings = headings;

    // Extract article body (remove HTML tags for analysis)
    const plainText = rendered.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    verification.articleBody = plainText;

    // Count paragraphs (blocks of text)
    const paragraphs = plainText.split(/\n\n+/).filter((p: string) => p.trim().length > 0);
    verification.factsToParagraphs = paragraphs.length;

    // Calculate average paragraph length
    const totalParagraphWords = paragraphs.reduce((sum: number, p: string) => sum + p.split(/\s+/).length, 0);
    verification.averageParagraphLength = paragraphs.length > 0 ? totalParagraphWords / paragraphs.length : 0;

    // Calculate average words per fact
    verification.averageWordsPerFact = pkg.fact_count > 0 ? verification.finalWordCount / pkg.fact_count : 0;

    // Check if longer than 1800 words
    verification.isLongerThan1800 = verification.finalWordCount > 1800;

    // Print results
    console.log(`\n1. FINAL HTML (first 500 chars):`);
    console.log(rendered.content.substring(0, 500) + "...");

    console.log(`\n2. FINAL WORD COUNT: ${verification.finalWordCount}`);

    console.log(`\n3. FINAL HEADINGS (${headings.length}):`);
    headings.forEach(h => console.log(`   ${h}`));

    console.log(`\n4. FINAL ARTICLE BODY (first 500 chars):`);
    console.log(plainText.substring(0, 500) + "...");

    console.log(`\n5. HOW MANY FACTS BECAME PARAGRAPHS: ${verification.factsToParagraphs}`);
    console.log(`   (Total facts in package: ${pkg.fact_count})`);

    console.log(`\n6. AVERAGE PARAGRAPH LENGTH: ${verification.averageParagraphLength.toFixed(1)} words`);

    console.log(`\n7. AVERAGE WORDS PER FACT: ${verification.averageWordsPerFact.toFixed(1)}`);

    console.log(`\n8. IS ARTICLE LONGER THAN 1800 WORDS? ${verification.isLongerThan1800 ? "YES" : "NO"}`);

    if (!verification.isLongerThan1800) {
      console.log(`\n9. ARTICLE IS SHORTER THAN 1800 WORDS`);
      console.log(`   Shortfall: ${1800 - verification.finalWordCount} words`);
    }

    console.log(`\n--- END ${slug} ---`);
  }
}

verifyFinalRenders().catch(console.error);
