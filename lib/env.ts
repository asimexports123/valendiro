/**
 * Environment Configuration - Single Source of Truth
 *
 * This module is responsible for loading environment variables exactly once.
 * All scripts, workers, CLI commands, migrations, renderers, and publishing tools
 * must import this module to ensure consistent environment configuration.
 *
 * Usage:
 *   import { env, createAdminClient } from "@/lib/env";
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let envLoaded = false;

/**
 * Load environment variables exactly once (lazy loading)
 */
function loadEnv(): void {
  if (!envLoaded) {
    dotenv.config({ path: resolve(process.cwd(), ".env.local") });
    envLoaded = true;
  }
}

/**
 * Environment variables (lazy loaded)
 */
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    loadEnv();
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    loadEnv();
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get ALLOW_RENDER() {
    loadEnv();
    return process.env.ALLOW_RENDER;
  },
  get RENDER_SECRET() {
    loadEnv();
    return process.env.RENDER_SECRET;
  },
} as const;

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  loadEnv();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  }
}

/**
 * Create a Supabase admin client
 * This is the single source of truth for database connections
 */
export function createAdminClient() {
  validateEnv();

  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if running in offline rendering context
 */
export function isOfflineContext(): boolean {
  return env.ALLOW_RENDER === "true" || env.RENDER_SECRET !== undefined;
}

/**
 * Assert offline context for rendering operations
 */
export function assertOfflineContext(): void {
  if (!isOfflineContext()) {
    throw new Error(
      "This operation requires offline rendering context. " +
      "Set ALLOW_RENDER=true or provide RENDER_SECRET."
    );
  }
}
