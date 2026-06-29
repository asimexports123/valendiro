import { NextResponse } from "next/server";
import { Client } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const MIGRATION_SECRET = "ecaedd3e-da3b-4592-9d54-5a749fa4f72d";

function getSupabaseHost(url: string): string {
  try {
    const parsed = new URL(url);
    // Supabase direct Postgres host is typically db.<project-ref>.supabase.co
    return `db.${parsed.hostname}`;
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-migration-secret");
  if (secret !== MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  const host = getSupabaseHost(supabaseUrl);
  if (!host) {
    return NextResponse.json({ error: "Invalid Supabase URL" }, { status: 500 });
  }

  const connectionString = `postgresql://postgres:${serviceRoleKey}@${host}:5432/postgres`;

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    const sqlPath = join(process.cwd(), "database", "migrations", "000010_final_core_architecture.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    await client.connect();
    await client.query(sql);

    // Verify collections table exists
    const { rows: tables } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections'"
    );

    const { rows: policies } = await client.query(
      "SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('categories', 'collections', 'articles')"
    );

    await client.end();

    return NextResponse.json({
      success: true,
      collectionsTableExists: tables.length > 0,
      policiesApplied: policies.map((p) => p.policyname),
    });
  } catch (err) {
    try {
      await client.end();
    } catch {}
    const message = err instanceof Error ? err.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
