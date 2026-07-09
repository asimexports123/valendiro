/**
 * Seed educational RSS sources — the right fuel for the knowledge engine.
 * Run once, then the daily cron pours this into the catalog.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "../lib/supabase/admin";

const EDUCATIONAL_SOURCES = [
  { name: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/blog/rss.xml", source_type: "rss", fetch_interval_minutes: 360 },
  { name: "Wikipedia Featured Articles", url: "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=featured&feedformat=rss", source_type: "rss", fetch_interval_minutes: 720 },
  { name: "Wikipedia Technology Portal", url: "https://en.wikipedia.org/w/index.php?title=Portal:Technology&action=feed", source_type: "rss", fetch_interval_minutes: 720 },
  { name: "Node.js Blog", url: "https://nodejs.org/en/feeds/blog.xml", source_type: "rss", fetch_interval_minutes: 360 },
  { name: "CSS-Tricks", url: "https://css-tricks.com/feed/", source_type: "rss", fetch_interval_minutes: 360 },
  { name: "freeCodeCamp", url: "https://www.freecodecamp.org/news/rss/", source_type: "rss", fetch_interval_minutes: 360 },
  { name: "Investopedia", url: "https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline", source_type: "rss", fetch_interval_minutes: 360 },
  { name: "NerdWallet", url: "https://www.nerdwallet.com/blog/feed/", source_type: "rss", fetch_interval_minutes: 360 },
  { name: "GitHub Blog", url: "https://github.blog/feed/", source_type: "rss", fetch_interval_minutes: 360 },
  { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", source_type: "rss", fetch_interval_minutes: 360 },
];

async function main() {
  const sb = createAdminClient();
  let added = 0;
  let existing = 0;

  for (const src of EDUCATIONAL_SOURCES) {
    const { data: found } = await sb
      .from("discovery_system_sources")
      .select("id")
      .eq("url", src.url)
      .maybeSingle();

    if (found) {
      await sb.from("discovery_system_sources").update({ status: "active" }).eq("id", found.id);
      existing++;
      continue;
    }

    const { error } = await sb.from("discovery_system_sources").insert({
      name: src.name,
      url: src.url,
      source_type: src.source_type,
      status: "active",
      fetch_interval_minutes: src.fetch_interval_minutes,
      config: { category: "educational", priority: "high" },
    });

    if (error) {
      console.error(`Failed ${src.name}:`, error.message);
    } else {
      added++;
      console.log(`Added: ${src.name}`);
    }
  }

  // Deprioritize pure news feeds — they create junk pages, not knowledge
  await sb
    .from("discovery_system_sources")
    .update({ status: "paused", config: { reason: "news_not_knowledge", paused_at: new Date().toISOString() } })
    .eq("name", "TechCrunch Test");

  console.log(JSON.stringify({ added, existing, total: EDUCATIONAL_SOURCES.length }));
}

main();
