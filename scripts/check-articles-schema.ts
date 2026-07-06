import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function checkArticlesSchema() {
  const supabase = createAdminClient();

  console.log("=== Check articles table schema ===");
  // Try to get a sample row to see the structure
  const { data: sampleArticle, error } = await supabase
    .from("articles")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error checking articles table:", error);
  } else if (sampleArticle && sampleArticle.length > 0) {
    console.log("Sample article structure:", Object.keys(sampleArticle[0]));
    console.log("Sample article:", JSON.stringify(sampleArticle[0], null, 2));
  } else {
    console.log("No articles found, table is empty");
  }

  // Try inserting a test row to see what columns are required
  console.log("\n=== Try to get table information ===");
  const { data: tableInfo, error: tableError } = await supabase
    .rpc('get_table_columns', { table_name: 'articles' });

  if (tableError) {
    console.error("Error getting table info:", tableError);
  } else {
    console.log("Table columns:", tableInfo);
  }
}

checkArticlesSchema().catch(console.error);
