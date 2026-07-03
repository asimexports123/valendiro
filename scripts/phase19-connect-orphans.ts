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

// Logical educational relationships for orphan topics
const orphanConnections = {
  "cooking-fundamentals": {
    related: ["nutrition-fundamentals", "budgeting-fundamentals"],
    applications: ["meal-planning", "healthy-living"],
  },
  "cybersecurity-fundamentals": {
    prerequisites: ["computer-networks", "operating-systems"],
    related: ["data-privacy", "internet-safety"],
  },
  "home-organization-fundamentals": {
    related: ["budgeting-fundamentals", "time-management"],
    applications: ["productivity", "minimalist-living"],
  },
};

const topicSlugToId = new Map();
for (const topic of topics) {
  topicSlugToId.set(topic.slug, topic.id);
}

async function connectOrphans() {
  console.log("=== Phase 19: Connecting Orphan Topics ===\n");
  
  const newRelationships: any[] = [];
  const seen = new Set<string>();
  
  for (const [orphanSlug, connections] of Object.entries(orphanConnections)) {
    const orphanId = topicSlugToId.get(orphanSlug);
    if (!orphanId) {
      console.log(`Topic not found: ${orphanSlug}`);
      continue;
    }
    
    console.log(`Connecting: ${orphanSlug}`);
    
    // Connect prerequisites (other topics → orphan)
    if (connections.prerequisites) {
      for (const prereqSlug of connections.prerequisites) {
        const prereqId = topicSlugToId.get(prereqSlug);
        if (!prereqId) continue;
        
        const key = `${prereqId}-${orphanId}-requires`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        newRelationships.push({
          source_id: orphanId,
          target_id: prereqId,
          source_level: "topic",
          target_level: "topic",
          relationship_type: "requires",
          strength: "strong",
          bidirectional: false,
          explanation: `${prereqSlug} is a prerequisite for ${orphanSlug}`,
        });
      }
    }
    
    // Connect related topics (bidirectional)
    if (connections.related) {
      for (const relatedSlug of connections.related) {
        const relatedId = topicSlugToId.get(relatedSlug);
        if (!relatedId) continue;
        
        const key = `${orphanId}-${relatedId}-related`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        newRelationships.push({
          source_id: orphanId,
          target_id: relatedId,
          source_level: "topic",
          target_level: "topic",
          relationship_type: "related_to",
          strength: "moderate",
          bidirectional: true,
          explanation: `${orphanSlug} is related to ${relatedSlug}`,
        });
      }
    }
    
    // Connect applications (orphan → application domain)
    if (connections.applications) {
      for (const appSlug of connections.applications) {
        const appId = topicSlugToId.get(appSlug);
        if (!appId) continue;
        
        const key = `${orphanId}-${appId}-application`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        newRelationships.push({
          source_id: orphanId,
          target_id: appId,
          source_level: "topic",
          target_level: "topic",
          relationship_type: "related_to",
          strength: "moderate",
          bidirectional: false,
          explanation: `${orphanSlug} is applied in ${appSlug}`,
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
  
  // Verify orphan status
  const { data: orphanTopics } = await supabase
    .from("knowledge_relationships")
    .select("source_id")
    .eq("source_level", "topic")
    .eq("target_level", "topic");
  
  const topicRelCounts = new Map();
  orphanTopics?.forEach((r: any) => {
    topicRelCounts.set(r.source_id, (topicRelCounts.get(r.source_id) || 0) + 1);
  });
  
  console.log(`\n=== Orphan Status After ===`);
  for (const slug of Object.keys(orphanConnections)) {
    const id = topicSlugToId.get(slug);
    const count = topicRelCounts.get(id) || 0;
    console.log(`${slug}: ${count} relationships ${count === 0 ? "(STILL ORPHAN)" : "(CONNECTED)"}`);
  }
}

connectOrphans().catch(console.error);
