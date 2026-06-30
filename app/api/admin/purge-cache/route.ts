import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paths } = await request.json().catch(() => ({}));

  const defaultPaths = [
    "/",
    "/en",
    "/en/categories",
    "/en/categories/technology",
    "/en/categories/business",
    "/en/categories/personal-finance",
    "/en/categories/education",
    "/en/categories/health-wellness",
    "/en/categories/home-lifestyle",
    "/en/categories/travel",
    "/en/collections",
    "/en/topics",
    "/en/articles",
  ];

  const pathsToRevalidate: string[] = paths && Array.isArray(paths) ? paths : defaultPaths;

  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }

  return NextResponse.json({ success: true, revalidated: pathsToRevalidate.length });
}
