/**
 * @architecture-frozen — Canonical Knowledge Package Writer. See docs/ARCHITECTURE_FROZEN.md
 * The ONLY module allowed to INSERT/UPDATE knowledge_packages in production.
 * Assembly logic lives in assembler.ts; all package row mutations go through here.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface PackageInsertRow {
  hub_slot_id: string | null;
  topic_id: string | null;
  slug: string;
  version: number;
  knowledge_hash: string;
  source_count: number;
  fact_count: number;
  relationship_count: number;
  discovery_run_ids: string[];
  status: string;
}

export interface PackageMetricsUpdate {
  status?: string;
  fact_count?: number;
  relationship_count?: number;
  source_count?: number;
  last_updated_at?: string;
  last_verified_at?: string;
}

export async function findLatestPackageBySlug(slug: string) {
  const sb = createAdminClient();
  return sb
    .from("knowledge_packages")
    .select("id, version, knowledge_hash")
    .eq("slug", slug)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function touchPackageVerified(packageId: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("knowledge_packages")
    .update({ last_verified_at: new Date().toISOString() })
    .eq("id", packageId);
  if (error) throw new Error(`Failed to touch package: ${error.message}`);
}

export async function archivePackage(packageId: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("knowledge_packages")
    .update({ status: "archived" })
    .eq("id", packageId);
  if (error) throw new Error(`Failed to archive package: ${error.message}`);
}

export async function insertPackage(row: PackageInsertRow): Promise<string> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("knowledge_packages")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create package: ${error?.message}`);
  }
  return data.id;
}

export async function updatePackageMetrics(
  packageId: string,
  metrics: PackageMetricsUpdate
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.from("knowledge_packages").update(metrics).eq("id", packageId);
  if (error) throw new Error(`Failed to update package metrics: ${error.message}`);
}

/** @deprecated Use assemble() via assembler.ts — legacy admin migration path only */
export async function linkPackageToTopic(packageId: string, topicId: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("knowledge_packages")
    .update({ topic_id: topicId, updated_at: new Date().toISOString() })
    .eq("id", packageId);
  if (error) throw new Error(`Failed to link package to topic: ${error.message}`);
}
