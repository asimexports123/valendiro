/**
 * Check database structure to find where topic content is stored
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables(): Promise<void> {
  console.log("Checking database tables...");

  // Try different table names
  const tables = [
    "topics",
    "articles",
    "content",
    "knowledge_packages",
    "pages"
  ];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);

      if (error) {
        console.log(`✗ ${tableName}: ${error.message}`);
      } else {
        console.log(`✓ ${tableName}: Found ${data?.length || 0} records`);
        if (data && data.length > 0) {
          console.log(`  Sample columns: ${Object.keys(data[0]).join(", ")}`);
        }
      }
    } catch (e: any) {
      console.log(`✗ ${tableName}: ${e.message}`);
    }
  }
}

checkTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
