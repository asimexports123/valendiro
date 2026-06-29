import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { DEFAULT_LANGUAGE } from "@/lib/constants";
import { isValidLanguage } from "@/lib/utils/helpers";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // Refresh session if it exists
  await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Admin route protection is handled by server-side checks in admin layout
  // Public routes use [lang] prefix; redirect root to default language
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}`;
    return NextResponse.redirect(url);
  }

  // Validate language segment for public routes
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const isLang = firstSegment && isValidLanguage(firstSegment);
  if (!isLang && !pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|webmanifest)$).*)"],
};
