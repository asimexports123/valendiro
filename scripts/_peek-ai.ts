import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreOpeningQuality } from "../services/discovery/brainExplain";
import { inferReaderFirstQuestion } from "../services/discovery/brainReaderIntent";
import { shortTopicLabel } from "@/services/content/topicHeading";

async function main() {
  const sb = createAdminClient();
  const { data } = await sb
    .from("topics")
    .select("id,topic_translations(title,content)")
    .eq("slug", "what-is-artificial-intelligence")
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  const t = (data?.topic_translations as Array<{ title: string; content: string }>)[0];
  console.log(t.content.split("\n").slice(0, 25).join("\n"));
  const lines = t.content.split("\n").map((l) => l.trim());
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
    if (past) paras.push(line);
  }
  const open = paras.join(" ");
  const intent = inferReaderFirstQuestion(t.title, shortTopicLabel("what-is-artificial-intelligence", t.title));
  console.log("OPEN:", open.slice(0, 250));
  console.log(scoreOpeningQuality(open, intent.topicNoun));
}
main();
