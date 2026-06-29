import { NextResponse } from "next/server";
import { Client } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const MIGRATION_SECRET = "ecaedd3e-da3b-4592-9d54-5a749fa4f72d";

function getProjectRef(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split(".");
    if (parts.length < 3) return null;
    return parts[0];
  } catch {
    return null;
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

  const projectRef = getProjectRef(supabaseUrl);
  if (!projectRef) {
    return NextResponse.json({ error: "Invalid Supabase URL" }, { status: 500 });
  }

  const regions = [
    "ap-south-1",
    "ap-southeast-1",
    "ap-northeast-1",
    "us-east-1",
    "us-west-2",
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "sa-east-1",
  ];

  const sqlPath = join(process.cwd(), "database", "migrations", "000010_final_core_architecture.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  let lastError: Error | null = null;

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const user = `postgres.${projectRef}`;
    const connectionString = `postgresql://${user}:${serviceRoleKey}@${host}:5432/postgres`;
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });

    try {
      await client.connect();
      await client.query(sql);

      const { rows: tables } = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections'"
      );

      const { rows: policies } = await client.query(
        "SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('categories', 'collections', 'articles')"
      );

      await client.end();

      return NextResponse.json({
        success: true,
        region,
        collectionsTableExists: tables.length > 0,
        policiesApplied: policies.map((p) => p.policyname),
      });
    } catch (err) {
      try {
        await client.end();
      } catch {}
      lastError = err instanceof Error ? err : new Error("Migration failed");
      if (lastError.message.includes("ENOTFOUND") || lastError.message.includes("tenant/user")) {
        continue;
      }
      return NextResponse.json({ error: lastError.message, region }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: lastError?.message || "All Supabase pooler regions failed", regionsTried: regions },
    { status: 500 }
  );
}
