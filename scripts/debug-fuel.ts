import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { selectCatalogPublishTargets } from "../services/discovery/catalogHierarchy";

async function main() {
  const targets = await selectCatalogPublishTargets(3);
  for (const t of targets.filter((x) => x.slug.includes("compound"))) {
    const fuel = await gatherExternalWorldFuel(t);
    console.log(t.slug, fuel.sourceCount, fuel.liveCrawlCount, fuel.rssCount);
    fuel.blocks.forEach((b) => console.log(" ", b.url.slice(0, 60), b.text.length));
  }
}
main();
