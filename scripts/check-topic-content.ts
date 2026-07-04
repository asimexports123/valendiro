/**
 * Check topic content in database to diagnose placeholder issue
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  { slug: "python-programming-fundamentals", name: "Python Programming Fundamentals" },
  { slug: "git-version-control", name: "Git Version Control" },
  { slug: "investing-basics", name: "Investing Basics" },
  { slug: "data-structures", name: "Data Structures" },
];

async function checkTopicContent(slug: string, name: string) {
  console.log(`\n=== Checking ${name} (${slug}) ===`);

  try {
    // Get topic content
    const { data: topic } = await supabase
      .from("topics")
      .select("id, content, updated_at")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("Topic not found");
      return;
    }

    console.log(`Topic ID: ${topic.id}`);
    console.log(`Updated at: ${topic.updated_at}`);
    
    if (!topic.content) {
      console.log("Content is NULL");
    } else {
      const content = topic.content;
      console.log(`Content length: ${content.length} characters`);
      console.log(`Content preview (first 500 chars):\n${content.substring(0, 500)}...`);
      
      // Check for placeholder patterns
      const hasKeyPointPlaceholder = /key point \d+ about/i.test(content);
      const hasGenericExample = /example \d+/i.test(content);
      const hasTypePlaceholder = /type \d+/i.test(content);
      
      console.log(`\nPlaceholder detection:`);
      console.log(`  - "Key point N about": ${hasKeyPointPlaceholder ? "FOUND ❌" : "NOT FOUND ✓"}`);
      console.log(`  - "Example N": ${hasGenericExample ? "FOUND ❌" : "NOT FOUND ✓"}`);
      console.log(`  - "Type N": ${hasTypePlaceholder ? "FOUND ❌" : "NOT FOUND ✓"}`);
    }

    // Check rendered_outputs
    const { data: renderedOutput } = await supabase
      .from("rendered_outputs")
      .select("id, content, renderer_id, updated_at")
      .eq("renderer_id", "long-article-v2")
      .eq("package_id", topic.id)
      .maybeSingle();

    if (renderedOutput) {
      console.log(`\nRendered output found:`);
      console.log(`  - Renderer: ${renderedOutput.renderer_id}`);
      console.log(`  - Updated at: ${renderedOutput.updated_at}`);
      console.log(`  - Content length: ${renderedOutput.content?.length || 0} characters`);
      
      if (renderedOutput.content) {
        const hasKeyPointPlaceholder = /key point \d+ about/i.test(renderedOutput.content);
        console.log(`  - "Key point N about" in rendered: ${hasKeyPointPlaceholder ? "FOUND ❌" : "NOT FOUND ✓"}`);
      }
    } else {
      console.log(`\nNo rendered output found for renderer "long-article-v2"`);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

async function checkAllTopics() {
  console.log("=== Topic Content Diagnostic ===");
  
  for (const topic of TOPICS) {
    await checkTopicContent(topic.slug, topic.name);
  }
}

checkAllTopics()
  .then(() => {
    console.log("\n=== Diagnostic Complete ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
