/**
 * Audit sanitizeFacts filtering
 * Check which facts would be filtered by the sanitizeFacts function
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPICS = ["nodejs-cluster", "vendor-management", "family-vacations"];

// Copy of the sanitizeFacts logic from longArticle.ts
const VERB_RE = /\b(is|are|was|were|has|have|had|do|does|did|will|can|could|would|should|must|may|might|provides?|uses?|allows?|enables?|helps?|creates?|defines?|describes?|represents?|supports?|contains?|consists?|gives?|makes?|refers?|reads?|removes?|replaces?|applies?|selects?|groups?|combines?|measures?|estimates?|determines?|demonstrates?|deploys?|requires?|reduces?|improves?|stores?|runs?|arranges?|finds?|executes?|processes?|divides?|partitions?|reuses?|links?|models?|identifies?|ensures?|includes?|emphasizes?|isolates?|manages?|handles?|performs?|operates?|implements?|extends?|inherits?|exports?|imports?|installs?|configures?|initializes?|renders?|generates?|fetches?|returns?|accepts?|rejects?|validates?|converts?|maps?|filters?|sorts?|merges?|splits?|wraps?|exposes?|hides?|tracks?|logs?|caches?|indexes?|queries?|inserts?|updates?|deletes?|affects?|involves?|requires?|produces?|develops?|builds?|achieves?|delivers?|drives?|grows?|increases?|decreases?|prevents?|reduces?|eliminates?|treats?|causes?|leads?)\b/i;

function sanitizeFacts(facts: any[]): any[] {
  const seen = new Set<string>();
  return facts.filter((f) => {
    const s = f.statement.trim();
    const wordCount = s.split(/\s+/).length;
    if (wordCount <= 4) return false;
    if (wordCount <= 6 && !VERB_RE.test(s)) return false;
    const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function auditSanitizeFilter() {
  console.log("SanitizeFacts Filter Audit");
  console.log("==========================\n");

  const supabase = createAdminClient();

  for (const slug of TOPICS) {
    console.log(`\n--- ${slug} ---`);

    // Get topic and package
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`❌ Topic not found`);
      continue;
    }

    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log(`❌ Knowledge package not found`);
      continue;
    }

    // Get facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("statement, fact_type, confidence")
      .eq("package_id", pkg.id);

    if (!facts) {
      console.log(`❌ No facts found`);
      continue;
    }

    console.log(`Total facts in DB: ${facts.length}`);

    // Apply sanitizeFacts
    const sanitized = sanitizeFacts(facts);
    console.log(`Facts after sanitizeFacts: ${sanitized.length}`);
    console.log(`Filtered out: ${facts.length - sanitized.length}`);

    if (facts.length - sanitized.length > 0) {
      console.log(`\nFiltered facts:`);
      const filtered = facts.filter(f => !sanitized.includes(f));
      for (const f of filtered) {
        const wordCount = f.statement.trim().split(/\s+/).length;
        const hasVerb = VERB_RE.test(f.statement);
        let reason = "";
        if (wordCount <= 4) reason = "wordCount <= 4";
        else if (wordCount <= 6 && !hasVerb) reason = "wordCount <= 6 and no verb";
        console.log(`- [${reason}] ${f.statement.substring(0, 80)}...`);
      }
    }
  }
}

auditSanitizeFilter().catch(console.error);
