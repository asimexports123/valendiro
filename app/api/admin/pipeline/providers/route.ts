/**
 * GET /api/admin/pipeline/providers
 *
 * Returns the health status of all registered LLM providers.
 * Shows which provider is currently active, which have API keys configured,
 * and which model each provider will use.
 *
 * Requires admin or editor role.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import "@/services/llm";                           // registers all providers
import { getProviderHealth } from "@/services/llm";
import { requireAdmin } from "@/lib/api/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (!auth.allowed) return auth.response;

  const providers = getProviderHealth();
  const activeProvider = providers.find((p) => p.isActive);

  return NextResponse.json({
    activeProvider: activeProvider?.name ?? "deterministic",
    configuredVia: process.env.LLM_PROVIDER ?? "auto (first available)",
    providers,
    hint: "Set LLM_PROVIDER=openai|anthropic|gemini and corresponding API key in .env.local to activate a real LLM.",
  });
}
