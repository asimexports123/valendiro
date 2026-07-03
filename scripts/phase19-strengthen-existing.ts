import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const topics = JSON.parse(readFileSync(resolve(__dirname, "phase19-published-topics.json"), "utf-8"));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Use only existing published topics
const topicSlugs = topics.map(t => t.slug);

const existingTopicConnections = {
  "career-development-fundamentals": {
    related: ["project-management-fundamentals", "marketing-fundamentals", "business-strategy-fundamentals"],
  },
  "cooking-fundamentals": {
    related: ["nutrition-fundamentals", "budgeting-fundamentals"],
  },
  "cryptocurrency-fundamentals": {
    related: ["investing-basics", "personal-finance-fundamentals"],
  },
  "cybersecurity-fundamentals": {
    related: ["computer-networks"],
  },
  "home-organization-fundamentals": {
    related: ["budgeting-fundamentals", "project-management-fundamentals"],
  },
  "operating-systems": {
    related: ["computer-networks", "algorithms-fundamentals"],
  },
};

const topicSlugToId = new Map();
for (const topic of topics) {
  topicSlugToId.set(topic.slug, topic.id);
}

async function strengthenWithExistingTopics() {
  console.log("=== Phase 19: Strengthening with Existing Topics ===\n");
  
  const newRelationships: any[] = [];
  const seen = new Set<string>();
  
  for (const [weakSlug, connections] of Object.entries(existingTopicConnections)) {
    const weakId = topicSlugToId.get(weakSlug);
    if (!weakId) {
      console.log(`Topic not found: ${weakSlug}`);
      continue;
    }
    
    console.log(`Strengthening: ${weakSlug}`);
    
    // Connect related topics (bidirectional)
    if (connections.related) {
      for (const relatedSlug of connections.related) {
        const relatedId = topicSlugToId.get(relatedSlug);
        if (!relatedId) {
          console.log(`  Skipping ${relatedSlug} (not published)`);
          continue;
        }
        
        const key = `${weakId}-${relatedId}-related`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        newRelationships.push({
          source_id: weakId,
          target_id: relatedId,
          source_level: "topic",
          target_level: "topic",
          relationship_type: "related_to",
          strength: "moderate",
          bidirectional: true,
          explanation: `${weakSlug} is related to ${relatedSlug}`,
        });
      }
    }
  }
  
  console.log(`\nGenerated ${newRelationships.length} new relationships`);
  
  // Insert relationships
  console.log("\nInserting relationships...");
  let successCount = 0;
  let duplicateCount = 0;
  
  for (const rel of newRelationships) {
    const { data, error } = await supabase
      .from("knowledge_relationships")
      .insert(rel)
      .select();
    
    if (error) {
      if (error.message.includes("duplicate")) {
        duplicateCount++;
      }
    } else {
      successCount++;
      console.log(`  Inserted: ${rel.source_id.substring(0,8)} -> ${rel.target_id.substring(0,8)} (related_to)`);
    }
  }
  
  console.log(`\n=== Insertion Results ===`);
  console.log(`Successfully inserted: ${successCount}`);
  console.log(`Duplicates skipped: ${duplicateCount}`);
}

strengthenWithExistingTopics().catch(console.error);
