/**
 * Analyze Rendered Content
 *
 * Extracts and analyzes the rendered HTML content for the three production topics
 * to verify: no placeholder text, no generic paragraphs, subject model applied,
 * blueprint applied, domain terminology present, references present, internal links present.
 */

import { createAdminClient } from "../lib/supabase/admin";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function analyzeRenderedContent() {
  console.log("Analyzing Rendered Content");
  console.log("============================\n");

  const supabase = createAdminClient();

  for (const slug of PRODUCTION_TOPICS) {
    console.log(`\n--- ${slug} ---`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`❌ Topic not found`);
      continue;
    }

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log(`❌ Knowledge package not found`);
      continue;
    }

    // Get rendered output
    const { data: renderedOutput } = await supabase
      .from("rendered_outputs")
      .select("*")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!renderedOutput) {
      console.log(`❌ No rendered output found`);
      continue;
    }

    const content = renderedOutput.content || "";
    
    console.log(`Content Length: ${content.length} chars`);
    console.log(`Word Count: ${renderedOutput.word_count}`);
    console.log(`Section Count: ${renderedOutput.section_count}`);
    
    // Check for placeholder text
    const placeholderPatterns = ["placeholder", "lorem ipsum", "sample text", "dummy content"];
    const hasPlaceholder = placeholderPatterns.some(pattern => 
      content.toLowerCase().includes(pattern)
    );
    console.log(`Has Placeholder Text: ${hasPlaceholder ? "❌ YES" : "✅ NO"}`);
    
    // Check for generic paragraphs
    const shortParagraphs = content.split("\n\n").filter(p => p.length > 0 && p.length < 100);
    console.log(`Generic Paragraphs (<100 chars): ${shortParagraphs.length}`);
    
    // Extract headings (section hierarchy)
    const headings: { level: number; text: string }[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      if (match) {
        headings.push({ level: match[1].length, text: match[2].trim() });
      }
    }
    console.log(`\nSection Hierarchy:`);
    for (const heading of headings) {
      console.log(`  ${"#".repeat(heading.level)} ${heading.text}`);
    }
    
    // Check for domain terminology (based on topic)
    const domainTerms: Record<string, string[]> = {
      "nodejs-cluster": ["cluster", "worker", "master", "process", "cpu", "thread"],
      "family-vacations": ["vacation", "family", "travel", "trip", "destination", "budget"],
      "vendor-management": ["vendor", "management", "supplier", "contract", "procurement", "relationship"]
    };
    
    const terms = domainTerms[slug] || [];
    const foundTerms = terms.filter(term => content.toLowerCase().includes(term.toLowerCase()));
    console.log(`\nDomain Terminology: ${foundTerms.length}/${terms.length} found`);
    console.log(`Found: ${foundTerms.join(", ") || "none"}`);
    
    // Check for references/citations
    const hasReferences = content.includes("[") || content.includes("Source") || content.includes("Reference");
    console.log(`Has References: ${hasReferences ? "✅ YES" : "❌ NO"}`);
    
    // Check for internal links
    const hasInternalLinks = content.includes("(/") || content.includes("http");
    console.log(`Has Internal Links: ${hasInternalLinks ? "✅ YES" : "❌ NO"}`);
    
    // Get citation count from quality score
    const qualityScore = renderedOutput.quality_score as any;
    const citationCount = qualityScore?.citationCount || 0;
    console.log(`Citation Count (from quality score): ${citationCount}`);
  }
}

analyzeRenderedContent().catch(console.error);
