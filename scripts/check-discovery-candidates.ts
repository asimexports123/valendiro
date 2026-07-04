/**
 * Check if discovery candidates exist for topics
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

async function checkDiscoveryCandidates(slug: string, name: string) {
  console.log(`\n=== Checking ${name} (${slug}) ===`);

  try {
    // Get topic ID
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("Topic not found");
      return;
    }

    console.log(`Topic ID: ${topic.id}`);

    // Check discovery candidates
    const { data: candidates } = await supabase
      .from("discovery_candidates")
      .select("id, title, source_url")
      .eq("topic_id", topic.id)
      .limit(5);

    if (!candidates || candidates.length === 0) {
      console.log("❌ No discovery candidates found");
    } else {
      console.log(`✓ Discovery candidates found (${candidates.length}):`);
      candidates.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.title.substring(0, 60)}...`);
        console.log(`     URL: ${c.source_url?.substring(0, 60)}...`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

async function checkAllTopics() {
  console.log("=== Discovery Candidates Diagnostic ===");
  
  for (const topic of TOPICS) {
    await checkDiscoveryCandidates(topic.slug, topic.name);
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
