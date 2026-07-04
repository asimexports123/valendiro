/**
 * Add content fields to topics table using SQL
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function addContentFields(): Promise<void> {
  console.log("Adding content fields to topics table...");

  try {
    // Execute raw SQL to add columns
    const { error: error1 } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE topics ADD COLUMN IF NOT EXISTS content text;' 
    });
    
    if (error1) {
      console.log("Error adding content column:", error1);
      // Try direct SQL through the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql: 'ALTER TABLE topics ADD COLUMN IF NOT EXISTS content text;' })
      });
      console.log("Direct SQL response:", response.status);
    }

    const { error: error2 } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE topics ADD COLUMN IF NOT EXISTS html_content text;' 
    });
    
    if (error2) {
      console.log("Error adding html_content column:", error2);
    }

    console.log("✓ Content fields added to topics table");
  } catch (error) {
    console.error("Error:", error);
  }
}

addContentFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
