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

// Domain-based relationship mappings for weak topics
const domainRelationships = {
  // Programming languages - connect to fundamentals and each other
  "rust-programming-language": {
    prerequisites: ["python-programming-fundamentals", "algorithms-fundamentals"],
    related: ["go-programming-language", "c-programming", "systems-programming"],
  },
  "go-programming-language": {
    prerequisites: ["python-programming-fundamentals", "algorithms-fundamentals"],
    related: ["rust-programming-language", "c-programming", "systems-programming"],
  },
  
  // Finance domain
  "budget-travel-strategies": {
    prerequisites: ["budgeting-fundamentals", "saving-money"],
    related: ["travel-planning-fundamentals", "personal-finance-fundamentals"],
  },
  "retirement-planning-fundamentals": {
    prerequisites: ["investing-basics", "budgeting-fundamentals"],
    related: ["personal-finance-fundamentals", "financial-planning"],
  },
  
  // Health & Wellness domain
  "fitness-fundamentals": {
    prerequisites: ["nutrition-fundamentals", "health-basics"],
    related: ["mental-health-fundamentals", "wellness"],
  },
  "mental-health-fundamentals": {
    prerequisites: ["psychology-basics"],
    related: ["fitness-fundamentals", "nutrition-fundamentals", "wellness"],
  },
  "nutrition-fundamentals": {
    prerequisites: ["biology-basics"],
    related: ["fitness-fundamentals", "mental-health-fundamentals", "cooking-fundamentals"],
  },
  
  // Technology domain
  "computer-networks": {
    prerequisites: ["operating-systems", "data-communication"],
    related: ["cybersecurity-fundamentals", "internet-basics"],
  },
  
  // Business domain
  "career-development-fundamentals": {
    prerequisites: ["communication-skills", "professional-skills"],
    related: ["project-management-fundamentals", "leadership", "soft-skills"],
  },
  
  // Specialized domains
  "cryptocurrency-fundamentals": {
    prerequisites: ["blockchain-basics", "investing-basics"],
    related: ["personal-finance-fundamentals", "digital-currency"],
  },
};

const topicSlugToId = new Map();
for (const topic of topics) {
  topicSlugToId.set(topic.slug, topic.id);
}

async function strengthenWeakTopics() {
  console.log("=== Phase 19: Strengthening Weak Topics ===\n");
  
  const newRelationships: any[] = [];
  const seen = new Set<string>();
  
  for (const [weakSlug, connections] of Object.entries(domainRelationships)) {
    const weakId = topicSlugToId.get(weakSlug);
    if (!weakId) {
      console.log(`Topic not found: ${weakSlug}`);
      continue;
    }
    
    console.log(`Strengthening: ${weakSlug}`);
    
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

strengthenWeakTopics().catch(console.error);
