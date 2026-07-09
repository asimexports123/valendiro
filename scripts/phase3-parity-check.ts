import * as dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const results = JSON.parse(readFileSync("temp/phase3-results.json", "utf8"));
  const report = [];
  for (const r of results) {
    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("topic_id")
      .eq("id", r.packageId)
      .single();
    const { data: out } = await sb
      .from("rendered_outputs")
      .select("content,output_format")
      .eq("id", r.newProjectionId)
      .single();
    const { data: tr } = await sb
      .from("topic_translations")
      .select("content,title")
      .eq("topic_id", pkg!.topic_id)
      .eq("language_code", "en")
      .single();
    report.push({
      domain: r.domain,
      slug: r.slug,
      projectionVersion: r.projectionVersion,
      format: out?.output_format,
      contentIdentical: out?.content === tr?.content,
      hasHtmlComments: /<!--/.test(out?.content || ""),
      hasHtmlDoc: /<!DOCTYPE|<article/i.test(out?.content || ""),
      title: tr?.title,
      qualityScore: r.qualityScore,
      validationPassed: r.validationPassed,
      renderDurationMs: r.renderDurationMs,
    });
  }
  writeFileSync("temp/phase3-parity.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main();
