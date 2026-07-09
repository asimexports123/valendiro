/**
 * Phase 3 projection validation — before/after quality metrics for one package.
 * Usage: ALLOW_RENDER=true npx tsx scripts/phase3-projection-validation.ts [packageId]
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

process.env.ALLOW_RENDER = "true";

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const { renderPackage } = await import("../services/render/engine");
  const { validateProjectionPage } = await import("../services/renderer/productionQAEnforcement");

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let packageId = process.argv[2];
  if (!packageId) {
    const { data } = await sb
      .from("knowledge_packages")
      .select("id,slug,fact_count")
      .gte("fact_count", 8)
      .eq("status", "ready")
      .order("fact_count", { ascending: true })
      .limit(1)
      .single();
    if (!data) throw new Error("No suitable package found");
    packageId = data.id;
    console.log(`Using package: ${data.slug} (${data.id}) facts=${data.fact_count}`);
  }

  const t0 = Date.now();
  const result = await renderPackage({
    packageId,
    format: "markdown",
    rendererId: "long-article-v2",
    forceRerender: true,
  });
  const ms = Date.now() - t0;

  const { data: facts } = await sb
    .from("knowledge_facts")
    .select("statement")
    .eq("package_id", packageId)
    .limit(50);

  const { data: outputRow } = await sb
    .from("rendered_outputs")
    .select("document_tree")
    .eq("id", result.outputId!)
    .single();

  const tree =
    typeof outputRow?.document_tree === "string"
      ? JSON.parse(outputRow.document_tree)
      : outputRow?.document_tree ?? [];

  const metrics = validateProjectionPage(
    tree,
    (facts ?? []).map((f, i) => ({
      id: String(i),
      statement: f.statement,
      factType: "definition" as const,
      confidence: "verified" as const,
      domain: "",
      scope: "",
      tags: [],
    }))
  );

  console.log(
    JSON.stringify(
      {
        packageId,
        outputId: result.outputId,
        status: result.status,
        qualityOverall: result.qualityScore.overall,
        wordCount: result.qualityScore.wordCount,
        sectionCount: result.qualityScore.sectionCount,
        renderDurationMs: ms,
        projectionMetrics: metrics,
        warnings: result.diagnostics.warnings?.filter((w) => w.startsWith("[projection]")),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
