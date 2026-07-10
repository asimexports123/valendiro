import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { countWords } from "../services/knowledge/contentQualityGate";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

function firstPara(content: string): string {
  const lines = content.split(/\n/).map((l) => l.trim());
  let past = false;
  const paras: string[] = [];
  for (const line of lines) {
    if (!line) {
      if (paras.length) break;
      continue;
    }
    if (line.startsWith("# ")) {
      past = true;
      continue;
    }
    if (line.startsWith("## ")) break;
    if (past || !line.startsWith("#")) paras.push(line);
  }
  return paras.join(" ").replace(/\*\*/g, "").trim();
}

async function main() {
  const sb = createAdminClient();
  const rows: Array<Record<string, unknown>> = [];

  for (const slug of SLUGS) {
    const { data } = await sb
      .from("topics")
      .select("slug, topic_translations(title, content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    const t = (data?.topic_translations as Array<{ title?: string; content?: string }> | null)?.[0];
    const content = t?.content ?? "";
    const words = countWords(content);
    const open = firstPara(content);
    const answersFirstQ =
      /\b(is|are|refers to|defined as|means)\b/i.test(open) &&
      !/buzzword soup|keep that idea|this guide stays concrete/i.test(open);

    const row = {
      slug,
      title: t?.title ?? slug,
      words,
      answersFirstQ,
      opening: open.slice(0, 240),
    };
    rows.push(row);
    console.log("---");
    console.log(slug);
    console.log(`words=${words} answersFirstQ=${answersFirstQ}`);
    console.log(`OPEN: ${open.slice(0, 200)}`);
  }

  console.log("\n=== CEO FUEL-FIX LIVE REPORT ===");
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
