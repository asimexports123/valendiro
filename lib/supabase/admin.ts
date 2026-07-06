/**
 * Supabase Admin Client
 *
 * This module now delegates to lib/env for environment configuration.
 * All environment loading and validation happens in lib/env.ts.
 */

export { createAdminClient, isOfflineContext, assertOfflineContext } from "../env";
