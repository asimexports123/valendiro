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

// Targeted relationships for remaining weak topics
const finalWeakTopicConnections = {
  "career-development-fundamentals": {
    prerequisites: ["communication-skills", "professional-skills"],
    related: ["leadership", "soft-skills", "workplace-success"],
  },
  "cooking-fundamentals": {
    prerequisites: ["kitchen-safety", "food-preparation"],
    related: ["meal-planning", "healthy-eating", "food-safety"],
  },
  "cryptocurrency-fundamentals": {
    prerequisites: ["digital-currency", "financial-technology"],
    related: ["blockchain-technology", "investing-basics", "risk-management"],
  },
  "cybersecurity-fundamentals": {
    prerequisites: ["internet-safety", "data-privacy"],
    related: ["network-security", "information-security", "cyber-threats"],
  },
  "home-organization-fundamentals": {
    prerequisites: ["decluttering", "storage-solutions"],
    related: ["minimalism", "productivity", "home-management"],
  },
  "operating-systems": {
    prerequisites: ["computer-architecture", "software-basics"],
    related: ["computer-networks", "system-administration", "virtualization"],
  },
};

const topicSlugToId = new Map();
for (const topic of topics) {
  topicSlugToId.set(topic.slug, topic.id);
}

async function finalStrengthening() {
  console.log("=== Phase 19: Final Weak Topic Strengthening ===\n");
  
  const newRelationships: any[] = [];
  const seen = new Set<string>();
  
  for (const [weakSlug, connections] of Object.entries(finalWeakTopicConnections)) {
    const weakId = topicSlugToId.get(weakSlug);
    if (!weakId) {
      console.log(`Topic not found: ${weakSlug}`);
      continue;
    }
    
    console.log(`Final strengthening: ${weakSlug}`);
    
    // Connect prerequisites
    if (connections.prerequisites) {
      for (const prereqSlug of connections.prerequisites) {
        const prereqId = topicSlugToId.get(prereqSlug);
        if (!prereqId) continue;
        
        const key = `${weakId}-${prereqId}-requires`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        newRelationships.push({
          source_id: weakId,
          target_id: prereqId,
          source_level: "topic",
          target_level: "topic",
          relationship_type: "requires",
          strength: "strong",
          bidirectional: false,
          explanation: `${prereqSlug} is a prerequisite for ${weakSlug}`,
        });
      }
    }
    
    // Connect related topics (bidirectional)
    if (connections.related) {
      for (const relatedSlug of connections.related) {
        const relatedId = topicSlugToId.get(relatedSlug);
        if (!relatedId) continue;
        
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
      console.log(`  Inserted: ${rel.source_id.substring(0,8)} -> ${rel.target_id.substring(0,8)} (${rel.relationship_type})`);
    }
  }
  
  console.log(`\n=== Insertion Results ===`);
  console.log(`Successfully inserted: ${successCount}`);
  console.log(`Duplicates skipped: ${duplicateCount}`);
}

finalStrengthening().catch(console.error);
