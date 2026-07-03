/**
 * Step 1: Inspect production schema of knowledge_relationships table
 * This queries the actual production database, not migration files
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

async function inspectSchema() {
  console.log("=== Step 1: Inspecting Production Schema ===\n");
  
  // Query column information from information schema
  const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
    sql_string: `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'knowledge_relationships'
      ORDER BY ordinal_position;
    `
  });
  
  if (columnsError) {
    console.error("Error querying columns:", columnsError);
  } else {
    console.log("COLUMNS:");
    console.log(JSON.stringify(columns, null, 2));
  }
  
  // Query constraints
  const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
    sql_string: `
      SELECT 
        con.conname as constraint_name,
        con.contype as constraint_type,
        pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'knowledge_relationships';
    `
  });
  
  if (constraintsError) {
    console.error("Error querying constraints:", constraintsError);
  } else {
    console.log("\nCONSTRAINTS:");
    console.log(JSON.stringify(constraints, null, 2));
  }
  
  // Query indexes
  const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
    sql_string: `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'knowledge_relationships';
    `
  });
  
  if (indexesError) {
    console.error("Error querying indexes:", indexesError);
  } else {
    console.log("\nINDEXES:");
    console.log(JSON.stringify(indexes, null, 2));
  }
  
  // Query foreign keys
  const { data: foreignKeys, error: fkError } = await supabase.rpc('exec_sql', {
    sql_string: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'knowledge_relationships';
    `
  });
  
  if (fkError) {
    console.error("Error querying foreign keys:", fkError);
  } else {
    console.log("\nFOREIGN KEYS:");
    console.log(JSON.stringify(foreignKeys, null, 2));
  }
}

inspectSchema().catch(console.error);
