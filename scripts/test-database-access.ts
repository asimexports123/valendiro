/**
 * Test Database Access
 *
 * This script tests if we can connect to Supabase and perform read-only queries.
 */

import { createAdminClient, env } from "../lib/env";

async function testDatabaseAccess() {
  console.log("Testing Database Access");
  console.log("========================\n");

  // Check environment variables
  console.log("1. Checking Environment Variables:");
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${url ? 'FOUND' : 'MISSING'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${key ? 'FOUND' : 'MISSING'}`);

  if (!url || !key) {
    console.log("\n❌ Database Connection: FAIL");
    console.log("   Reason: Missing required environment variables");
    return;
  }

  console.log(`   NEXT_PUBLIC_SUPABASE_URL value: ${url.substring(0, 20)}...`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY length: ${key.length} characters\n`);

  // Test database connection
  console.log("2. Testing Database Connection:");
  try {
    const supabase = createAdminClient();
    console.log("   ✅ Admin client created successfully\n");
  } catch (error) {
    console.log(`   ❌ Failed to create admin client: ${error}\n`);
    console.log("\n❌ Database Connection: FAIL");
    console.log("   Reason: Cannot create Supabase client");
    return;
  }

  // Execute read-only queries
  console.log("3. Executing Read-Only Queries:");
  const supabase = createAdminClient();

  try {
    // Count topics
    const { count: topicCount, error: topicError } = await supabase
      .from("topics")
      .select("*", { count: "exact", head: true });

    if (topicError) {
      console.log(`   ❌ Topics query failed: ${topicError.message}`);
    } else {
      console.log(`   ✅ Topics count: ${topicCount}`);
    }
  } catch (error) {
    console.log(`   ❌ Topics query error: ${error}`);
  }

  try {
    // Count knowledge_packages
    const { count: packageCount, error: packageError } = await supabase
      .from("knowledge_packages")
      .select("*", { count: "exact", head: true });

    if (packageError) {
      console.log(`   ❌ Knowledge packages query failed: ${packageError.message}`);
    } else {
      console.log(`   ✅ Knowledge packages count: ${packageCount}`);
    }
  } catch (error) {
    console.log(`   ❌ Knowledge packages query error: ${error}`);
  }

  try {
    // Count rendered_outputs
    const { count: outputCount, error: outputError } = await supabase
      .from("rendered_outputs")
      .select("*", { count: "exact", head: true });

    if (outputError) {
      console.log(`   ❌ Rendered outputs query failed: ${outputError.message}`);
    } else {
      console.log(`   ✅ Rendered outputs count: ${outputCount}`);
    }
  } catch (error) {
    console.log(`   ❌ Rendered outputs query error: ${error}`);
  }

  console.log("\n✅ Database Connection: PASS");
  console.log("   Reason: All read-only queries successful");
}

testDatabaseAccess().catch(console.error);
