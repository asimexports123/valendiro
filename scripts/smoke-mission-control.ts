import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { GET } = await import("../app/api/admin/dashboard/dashboard/mission-control/route");
  const res = await GET();
  const j = await res.json();
  console.log(
    JSON.stringify(
      {
        status: res.status,
        ok: !j.error,
        live: j.live,
        topics: j.metrics?.topicsPublished,
        packages: j.metrics?.packagesReady,
        entities: j.metrics?.entities,
        facts: j.metrics?.facts,
        quality: j.metrics?.qualityScore,
        bottlenecks: j.bottlenecks?.map((b: { title: string }) => b.title),
        activity: j.activity?.length,
        categories: j.categories?.length,
        sources: j.sources?.length,
        error: j.error,
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
