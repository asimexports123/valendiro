/**
 * Step 3: Trace complete request for machine-learning-basics
 */

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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function traceRequest() {
  console.log("=== Step 3: Tracing machine-learning-basics Request ===\n");
  
  const topicSlug = "machine-learning-basics";
  
  // 1. Get Topic
  console.log("1. TOPIC");
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", topicSlug)
    .single();
  
  if (topicError) {
    console.log("Error:", topicError);
    return;
  }
  
  console.log(`   ID: ${topic.id}`);
  console.log(`   Slug: ${topic.slug}`);
  console.log(`   Status: ${topic.status}`);
  console.log(`   Subcategory ID: ${topic.subcategory_id}`);
  
  // 2. Get Knowledge Package
  console.log("\n2. KNOWLEDGE PACKAGE");
  const { data: pkg, error: pkgError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topic.id)
    .single();
  
  if (pkgError) {
    console.log("Error:", pkgError);
    return;
  }
  
  console.log(`   ID: ${pkg.id}`);
  console.log(`   Topic ID: ${pkg.topic_id}`);
  console.log(`   Status: ${pkg.status}`);
  
  // 3. Get Rendered Output
  console.log("\n3. RENDERED OUTPUT");
  const { data: rendered, error: renderedError } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("package_id", pkg.id)
    .eq("status", "published");
  
  if (renderedError) {
    console.log("Error:", renderedError);
    return;
  }
  
  console.log(`   Found: ${rendered.length} rendered outputs`);
  if (rendered.length > 0) {
    rendered.forEach(r => {
      console.log(`   - ID: ${r.id}`);
      console.log(`     Package ID: ${r.package_id}`);
      console.log(`     Knowledge Hash: ${r.knowledge_hash}`);
      console.log(`     Output Format: ${r.output_format}`);
      console.log(`     Status: ${r.status}`);
    });
  }
  
  // 4. Get Topic Translation
  console.log("\n4. TOPIC TRANSLATION");
  const { data: translation, error: transError } = await supabase
    .from("topic_translations")
    .select("*")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();
  
  if (transError) {
    console.log("Error:", transError);
    return;
  }
  
  console.log(`   ID: ${translation.id}`);
  console.log(`   Topic ID: ${translation.topic_id}`);
  console.log(`   Title: ${translation.title}`);
  console.log(`   Content Length: ${translation.content?.length || 0}`);
  
  // 5. Check Knowledge Relationships for this topic
  console.log("\n5. KNOWLEDGE RELATIONSHIPS (source or target = topic ID)");
  const { data: rels, error: relsError } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .or(`source_id.eq.${topic.id},target_id.eq.${topic.id}`)
    .limit(5);
  
  if (relsError) {
    console.log("Error:", relsError);
  } else {
    console.log(`   Found: ${rels.length} relationships`);
    if (rels.length > 0) {
      rels.forEach(rel => {
        console.log(`   - ${rel.source_id.substring(0,8)} -> ${rel.target_id.substring(0,8)} (${rel.relationship_type}, level: ${rel.source_level})`);
      });
    }
  }
  
  // 6. Check Internal Links for this topic
  console.log("\n6. INTERNAL LINKS (source or target = topic ID)");
  const { data: links, error: linksError } = await supabase
    .from("internal_links")
    .select("*")
    .or(`source_id.eq.${topic.id},target_id.eq.${topic.id}`)
    .limit(5);
  
  if (linksError) {
    console.log("Error:", linksError);
  } else {
    console.log(`   Found: ${links.length} internal links`);
  }
  
  // 7. Check Internal Link Suggestions for this topic
  console.log("\n7. INTERNAL LINK SUGGESTIONS (source or target = topic ID)");
  const { data: suggestions, error: suggestionsError } = await supabase
    .from("internal_link_suggestions")
    .select("*")
    .or(`source_object_id.eq.${topic.id},target_object_id.eq.${topic.id}`)
    .limit(5);
  
  if (suggestionsError) {
    console.log("Error:", suggestionsError);
  } else {
    console.log(`   Found: ${suggestions.length} suggestions`);
    if (suggestions.length > 0) {
      suggestions.forEach(s => {
        console.log(`   - ${s.source_object_id.substring(0,8)} -> ${s.target_object_id.substring(0,8)} (${s.source_object_type} -> ${s.target_object_type}, status: ${s.status})`);
      });
    }
  }
  
  // 8. Check other topics in same subcategory
  console.log("\n8. OTHER TOPICS IN SAME SUBCATEGORY");
  const { data: siblingTopics, error: siblingsError } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("subcategory_id", topic.subcategory_id)
    .eq("status", "published")
    .neq("id", topic.id)
    .limit(5);
  
  if (siblingsError) {
    console.log("Error:", siblingsError);
  } else {
    console.log(`   Found: ${siblingTopics.length} sibling topics`);
    if (siblingTopics.length > 0) {
      siblingTopics.forEach(t => {
        console.log(`   - ${t.slug} (${t.id.substring(0,8)})`);
      });
    }
  }
}

traceRequest().catch(console.error);
