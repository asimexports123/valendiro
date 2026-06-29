import { createClient } from "@/lib/supabase/server";
import { AppRole } from "@/lib/constants";
import { Profile } from "@/lib/types";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single<Profile>();

  return profile;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: AppRole | AppRole[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
