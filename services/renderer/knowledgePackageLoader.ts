/**
 * Knowledge Package Loader
 *
 * Responsible for assembling a complete Knowledge Package from the normalized database
 * before passing it to the existing Knowledge Authoring Engine and Renderer.
 *
 * The renderer receives the same KnowledgePackage object regardless of how data is stored.
 * The renderer never queries database tables directly.
 * The renderer remains storage-agnostic.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  KnowledgePackage,
  PluginFact,
  CitationInput,
  RelationshipInput,
} from "./types";

export interface LoadPackageOptions {
  packageId: string;
}

export interface LoadPackageResult {
  package: KnowledgePackage | null;
  error: string | null;
}

/**
 * Load a Knowledge Package from the database
 *
 * @param options - Options specifying which package to load
 * @returns The loaded KnowledgePackage or null if not found
 */
export async function loadKnowledgePackage(
  options: LoadPackageOptions
): Promise<LoadPackageResult> {
  const sb = createAdminClient();

  try {
    // 1. Load package metadata
    const { data: pkg, error: pkgError } = await sb
      .from("knowledge_packages")
      .select("*")
      .eq("id", options.packageId)
      .single();

    if (pkgError || !pkg) {
      return {
        package: null,
        error: pkgError?.message || `Package not found: ${options.packageId}`,
      };
    }

    // 2. Load knowledge facts
    const { data: factsData, error: factsError } = await sb
      .from("knowledge_facts")
      .select("*")
      .eq("package_id", options.packageId)
      .order("created_at");

    if (factsError) {
      return {
        package: null,
        error: `Failed to load facts: ${factsError.message}`,
      };
    }

    // 3. Load knowledge citations
    const { data: citData, error: citError } = await sb
      .from("knowledge_citations")
      .select("*")
      .eq("package_id", options.packageId);

    if (citError) {
      return {
        package: null,
        error: `Failed to load citations: ${citError.message}`,
      };
    }

    // 4. Load knowledge relationships
    const factIds = (factsData ?? []).map((f: any) => f.id);
    let relData: any[] = [];
    if (factIds.length > 0) {
      const { data, error: relError } = await sb
        .from("knowledge_relationships")
        .select("*")
        .or(`source_id.in.(${factIds.join(",")}),target_id.in.(${factIds.join(",")})`);

      if (relError) {
        return {
          package: null,
          error: `Failed to load relationships: ${relError.message}`,
        };
      }
      relData = data ?? [];
    }

    // 5. Resolve category and intent for composition policy
    const categorySlug = await resolveCategory(sb, pkg.slug, pkg.topic_id);
    const intent = inferIntent(categorySlug, pkg.slug);

    // 6. Map to canonical types
    const facts: PluginFact[] = (factsData ?? []).map((f: any) => ({
      id: f.id,
      statement: f.statement,
      factType: f.fact_type,
      confidence: f.confidence,
      scope: f.scope,
      tags: f.tags ?? [],
      domain: f.domain,
    }));

    const citations: CitationInput[] = (citData ?? []).map((c: any) => ({
      id: c.id,
      sourceName: c.source_name,
      sourceUrl: c.source_url,
      adapterName: c.adapter_name,
      sourceAuthority: c.source_authority,
      retrievedAt: c.retrieved_at,
    }));

    const relationships: RelationshipInput[] = relData.map((r: any) => ({
      id: r.id,
      sourceId: r.source_id,
      targetId: r.target_id,
      relationshipType: r.relationship_type,
      strength: r.strength ?? "moderate",
      explanation: r.explanation,
      bidirectional: r.bidirectional ?? false,
    }));

    // 7. Map facts to structured collections (Phase 30.1)
    const definitions = facts
      .filter(f => f.factType === "definition")
      .map(f => ({
        id: f.id,
        term: f.statement.split(" is ")[0] || f.statement.substring(0, 50),
        definition: f.statement,
        confidence: f.confidence,
      }));

    const concepts = facts
      .filter(f => f.factType === "property")
      .map(f => ({
        id: f.id,
        name: f.statement.substring(0, 50),
        description: f.statement,
        confidence: f.confidence,
      }));

    const procedures = facts
      .filter(f => f.factType === "procedural")
      .map(f => ({
        id: f.id,
        name: f.statement.substring(0, 50),
        steps: [f.statement],
        confidence: f.confidence,
      }));

    const warnings = facts
      .filter(f => f.factType === "warning")
      .map(f => ({
        id: f.id,
        title: f.statement.substring(0, 50),
        description: f.statement,
        severity: "medium" as const,
      }));

    // 8. Assemble canonical KnowledgePackage with structured collections (Phase 30.1)
    const knowledgePackage: KnowledgePackage = {
      id: pkg.id,
      slug: pkg.slug,
      knowledgeHash: pkg.knowledge_hash,
      topicId: pkg.topic_id,
      category: categorySlug,
      intent,
      // Structured knowledge collections
      definitions,
      concepts,
      procedures,
      examples: [],
      comparisons: [],
      commands: [],
      formulae: [],
      warnings,
      bestPractices: [],
      commonMistakes: [],
      faqs: [],
      references: [],
      // Legacy facts for backward compatibility
      facts,
      citations,
      relationships,
      // Metadata with source metadata (Phase 30.1)
      metadata: {
        sourceCount: pkg.source_count,
        factCount: pkg.fact_count,
        relationshipCount: pkg.relationship_count,
        lastUpdated: pkg.last_updated_at,
        lastVerified: pkg.last_verified_at,
        confidence: "high",
        sourceMetadata: {
          adapterName: "legacy-loader",
          adapterVersion: "1.0.0",
          sourceType: "legacy",
          retrievedAt: pkg.last_updated_at,
          processedAt: new Date().toISOString(),
          validationStatus: "valid",
        },
      },
    };

    return {
      package: knowledgePackage,
      error: null,
    };
  } catch (error: any) {
    return {
      package: null,
      error: error.message || "Unknown error loading package",
    };
  }
}

/**
 * Resolve category slug for a package
 * Chain: knowledge_packages.topic_id → topics → topic_subcategories → subcategories → categories
 */
async function resolveCategory(
  sb: any,
  slug: string,
  topicId: string | null
): Promise<string> {
  let categorySlug = "general";

  if (!topicId) {
    return categorySlug;
  }

  try {
    const { data: topic } = await sb
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (topic?.id) {
      const { data: tsub } = await sb
        .from("topic_subcategories")
        .select("subcategory_id")
        .eq("topic_id", topic.id)
        .limit(1)
        .maybeSingle();

      if (tsub?.subcategory_id) {
        const { data: sub } = await sb
          .from("subcategories")
          .select("category_id")
          .eq("id", tsub.subcategory_id)
          .maybeSingle();

        if (sub?.category_id) {
          const { data: cat } = await sb
            .from("categories")
            .select("slug")
            .eq("id", sub.category_id)
            .maybeSingle();

          if (cat?.slug) categorySlug = cat.slug;
        }
      }
    }
  } catch (err) {
    console.warn(`Non-fatal: failed to resolve category for slug "${slug}":`, err instanceof Error ? err.message : err);
  }

  return categorySlug;
}

/**
 * Infer intent from category and slug
 * This is a simplified version of the full composition policy
 */
function inferIntent(
  categorySlug: string,
  slug: string
): "inform" | "educate" | "guide" | "decide" {
  // Technology topics default to educate
  if (categorySlug === "technology") return "educate";
  
  // Travel topics default to guide
  if (categorySlug === "travel") return "guide";
  
  // Finance topics default to decide
  if (categorySlug === "finance") return "decide";
  
  // Health topics default to educate
  if (categorySlug === "health") return "educate";
  
  // Business topics default to inform
  if (categorySlug === "business") return "inform";
  
  // Default to educate for fundamentals
  if (slug.includes("-fundamentals")) return "educate";
  
  // Default to educate for basics
  if (slug.includes("-basics")) return "educate";
  
  return "inform";
}
