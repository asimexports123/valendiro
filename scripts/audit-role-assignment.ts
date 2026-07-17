#!/usr/bin/env tsx
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { planArticleReasoning } from "../services/discovery/brainReasoning";
import assessFactForSection from "../services/discovery/readerUnderstanding";
import { writeFileSync } from "fs";

async function auditTopic(slug: string) {
  const sb = createAdminClient();
  const { data: t } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!t) throw new Error(`Topic not found: ${slug}`);
  const title = (t.topic_translations as any)[0]?.title || slug;
  const target = { topicId: t.id, slug, title } as any;
  const fuel = await gatherExternalWorldFuel(target);
  const notes = brainUnderstand(fuel.texts, title);
  const reasoning = planArticleReasoning(notes, title, 0);
  const out: any = { slug, title, sections: {} };
  for (const [sectionId, theses] of reasoning.entries()) {
    out.sections[sectionId] = theses.map((thesis: any) => {
      const claims = thesis.claims.map((c: any) => {
        const fact = c.sourceFact || c.assertion || "";
        const assessment = assessFactForSection(fact, sectionId === "overview" ? "overview" : sectionId === "how-it-works" ? "how" : sectionId === "keyConcepts" ? "keyConcepts" : sectionId, notes, title, { slug });
        return {
          fact,
          subject: c.subject,
          assertion: c.assertion,
          assessment,
        };
      });
      return {
        mainIdea: thesis.mainIdea,
        centralIdea: thesis.centralIdea,
        claims,
      };
    });
  }
  const outPath = resolve(process.cwd(), "temp", `${slug}-audit.json`);
  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote audit to ${outPath}`);
  return outPath;
}

async function main() {
  const topics = [
    "project-management",
    "what-is-artificial-intelligence",
    "strength-training-basics",
    "index-funds",
    "design-patterns",
  ];
  for (const t of topics) {
    try {
      console.log(`\nAuditing ${t}...`);
      await auditTopic(t);
    } catch (e: any) {
      console.error(`Failed ${t}:`, e?.message ?? e);
    }
  }
  console.log("\nAudit complete. Files in temp/*.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

