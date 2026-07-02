/**
 * Phase 15 Environment Audit
 * 
 * Identifies which database is being used and queries actual counts
 */

import { createClient } from "@supabase/supabase-js";

// Database connection being used
const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

console.log("=".repeat(60));
console.log("PHASE 15 ENVIRONMENT AUDIT");
console.log("=".repeat(60));

console.log("\n🔍 DATABASE CONNECTION INFORMATION");
console.log("-".repeat(60));
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Supabase Project ID: ${SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")}`);
console.log(`Key Type: Service Role Key (admin access)`);
console.log(`Connection: Direct Supabase connection (not local)`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function audit() {
  console.log("\n📊 DATABASE COUNTS");
  console.log("-".repeat(60));

  // Count all tables
  const [
    { count: categoriesCount },
    { count: subcategoriesCount },
    { count: topicsCount },
    { count: publishedTopicsCount },
    { count: draftTopicsCount },
    { count: knowledgePackagesCount },
    { count: factsCount },
    { count: citationsCount },
    { count: articlesCount },
  ] = await Promise.all([
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("subcategories").select("*", { count: "exact", head: true }),
    supabase.from("topics").select("*", { count: "exact", head: true }),
    supabase.from("topics").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("topics").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("knowledge_packages").select("*", { count: "exact", head: true }),
    supabase.from("facts").select("*", { count: "exact", head: true }),
    supabase.from("citations").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
  ]);

  console.log(`Categories: ${categoriesCount || 0}`);
  console.log(`Subcategories: ${subcategoriesCount || 0}`);
  console.log(`Topics (total): ${topicsCount || 0}`);
  console.log(`Topics (published): ${publishedTopicsCount || 0}`);
  console.log(`Topics (draft): ${draftTopicsCount || 0}`);
  console.log(`Knowledge Packages: ${knowledgePackagesCount || 0}`);
  console.log(`Facts: ${factsCount || 0}`);
  console.log(`Citations: ${citationsCount || 0}`);
  console.log(`Articles: ${articlesCount || 0}`);

  console.log("\n🎯 MACHINE LEARNING BASICS VERIFICATION");
  console.log("-".repeat(60));

  // Check Machine Learning Basics
  const { data: mlTopic } = await supabase
    .from("topics")
    .select("id, slug, status")
    .eq("slug", "machine-learning-basics")
    .maybeSingle();

  if (mlTopic) {
    console.log(`✅ Topic exists`);
    console.log(`   ID: ${mlTopic.id}`);
    console.log(`   Slug: ${mlTopic.slug}`);
    console.log(`   Status: ${mlTopic.status}`);

    // Check for knowledge package
    const { data: mlPackage } = await supabase
      .from("knowledge_packages")
      .select("id, status, fact_count")
      .eq("topic_id", mlTopic.id)
      .maybeSingle();

    if (mlPackage) {
      console.log(`✅ Knowledge Package exists`);
      console.log(`   ID: ${mlPackage.id}`);
      console.log(`   Status: ${mlPackage.status}`);
      console.log(`   Fact Count: ${mlPackage.fact_count}`);
    } else {
      console.log(`❌ No Knowledge Package found`);
    }

    // Check for article
    const { data: mlArticle } = await supabase
      .from("articles")
      .select("id, status")
      .eq("topic_id", mlTopic.id)
      .maybeSingle();

    if (mlArticle) {
      console.log(`✅ Article exists`);
      console.log(`   ID: ${mlArticle.id}`);
      console.log(`   Status: ${mlArticle.status}`);
    } else {
      console.log(`❌ No Article found`);
    }
  } else {
    console.log(`❌ Topic "machine-learning-basics" not found`);
  }

  console.log("\n🔍 TOPIC SLUG VERIFICATION");
  console.log("-".repeat(60));
  console.log("Testing different query approaches...");

  // Test 1: Simple select without limit
  const { data: topics1, error: error1 } = await supabase
    .from("topics")
    .select("slug")
    .limit(5);

  console.log(`Test 1 - Simple select (limit 5): ${topics1?.length || 0} results`);
  if (error1) console.log(`  Error: ${error1.message}`);

  // Test 2: Select with count
  const { data: topics2, count, error: error2 } = await supabase
    .from("topics")
    .select("slug, title", { count: "exact" })
    .limit(5);

  console.log(`Test 2 - Select with count: ${topics2?.length || 0} results, count: ${count}`);
  if (error2) console.log(`  Error: ${error2.message}`);

  // Test 3: Select only id
  const { data: topics3, error: error3 } = await supabase
    .from("topics")
    .select("id")
    .limit(5);

  console.log(`Test 3 - Select only id: ${topics3?.length || 0} results`);
  if (error3) console.log(`  Error: ${error3.message}`);

  // Test 4: Check if there's a row level security issue
  const { data: topics4, error: error4 } = await supabase
    .from("topics")
    .select("*")
    .range(0, 4);

  console.log(`Test 4 - Select * with range: ${topics4?.length || 0} results`);
  if (error4) console.log(`  Error: ${error4.message}`);

  if (topics4 && topics4.length > 0) {
    console.log(`\nFirst ${topics4.length} topics:`);
    topics4.forEach(t => {
      console.log(`  - ${t.slug}: ${t.title || 'N/A'} (${t.status})`);
    });
  }

  console.log("\n🔍 CHECKING FOR MACHINE LEARNING TOPICS");
  console.log("-".repeat(60));
  
  const { data: mlTopics, error: mlError } = await supabase
    .from("topics")
    .select("slug")
    .ilike("slug", "%machine%");

  if (mlError) {
    console.log(`❌ Query error: ${mlError.message}`);
  } else if (mlTopics && mlTopics.length > 0) {
    console.log(`Found ${mlTopics.length} machine learning topics:`);
    mlTopics.forEach(t => {
      console.log(`  - ${t.slug}`);
    });
  } else {
    console.log("No machine learning topics found");
  }

  console.log("\n🔍 CHECKING FOR CSS TOPICS");
  console.log("-".repeat(60));
  
  const { data: cssTopics, error: cssError } = await supabase
    .from("topics")
    .select("slug")
    .ilike("slug", "%css%");

  if (cssError) {
    console.log(`❌ Query error: ${cssError.message}`);
  } else if (cssTopics && cssTopics.length > 0) {
    console.log(`Found ${cssTopics.length} CSS topics:`);
    cssTopics.forEach(t => {
      console.log(`  - ${t.slug}`);
    });
  } else {
    console.log("No CSS topics found");
  }

  console.log("\n🔍 CHECKING FOR DOCKER TOPICS");
  console.log("-".repeat(60));
  
  const { data: dockerTopics, error: dockerError } = await supabase
    .from("topics")
    .select("slug")
    .ilike("slug", "%docker%");

  if (dockerError) {
    console.log(`❌ Query error: ${dockerError.message}`);
  } else if (dockerTopics && dockerTopics.length > 0) {
    console.log(`Found ${dockerTopics.length} Docker topics:`);
    dockerTopics.forEach(t => {
      console.log(`  - ${t.slug}`);
    });
  } else {
    console.log("No Docker topics found");
  }

  console.log("\n🔍 CHECKING FOR NUTRITION TOPICS");
  console.log("-".repeat(60));
  
  const { data: nutritionTopics, error: nutritionError } = await supabase
    .from("topics")
    .select("slug")
    .ilike("slug", "%nutrition%");

  if (nutritionError) {
    console.log(`❌ Query error: ${nutritionError.message}`);
  } else if (nutritionTopics && nutritionTopics.length > 0) {
    console.log(`Found ${nutritionTopics.length} Nutrition topics:`);
    nutritionTopics.forEach(t => {
      console.log(`  - ${t.slug}`);
    });
  } else {
    console.log("No Nutrition topics found");
  }

  console.log("\n🔍 CHECKING FOR RETIREMENT TOPICS");
  console.log("-".repeat(60));
  
  const { data: retirementTopics, error: retirementError } = await supabase
    .from("topics")
    .select("slug")
    .ilike("slug", "%retirement%");

  if (retirementError) {
    console.log(`❌ Query error: ${retirementError.message}`);
  } else if (retirementTopics && retirementTopics.length > 0) {
    console.log(`Found ${retirementTopics.length} Retirement topics:`);
    retirementTopics.forEach(t => {
      console.log(`  - ${t.slug}`);
    });
  } else {
    console.log("No Retirement topics found");
  }

  console.log("\n🔍 FIRST 20 PUBLISHED TOPICS");
  console.log("-".repeat(60));
  
  const { data: publishedTopics } = await supabase
    .from("topics")
    .select("slug, status")
    .eq("status", "published")
    .limit(20);

  if (publishedTopics && publishedTopics.length > 0) {
    console.log(`Found ${publishedTopics.length} published topics:`);
    publishedTopics.forEach(t => {
      console.log(`  - ${t.slug} (${t.status})`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("AUDIT COMPLETE");
  console.log("=".repeat(60));
}

audit().catch(console.error);
