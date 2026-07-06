import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

type AdminAuthSuccess = { allowed: true; userId: string };
type AdminAuthFailure = { allowed: false; response: NextResponse };
export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

export async function requireAdmin(
  supabase: SupabaseClient,
): Promise<AdminAuthResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { allowed: true, userId: session.user.id };
}

export function isSecretAuthorized(secret: string | undefined): boolean {
  if (!secret) return false;
  return (
    secret === process.env.RENDER_SECRET ||
    secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test")
  );
}

export async function requireAdminOrSecret(
  body: { secret?: string },
  supabase: SupabaseClient,
): Promise<NextResponse | null> {
  if (isSecretAuthorized(body.secret)) return null;
  const auth = await requireAdmin(supabase);
  if (!auth.allowed) return auth.response;
  return null;
}
