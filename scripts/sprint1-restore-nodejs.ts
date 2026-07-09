/**
 * Restore nodejs-cluster after accidental Sprint 1 regression.
 * Archives v2 (1 fact), reactivates v1 (45 facts), re-renders and publishes.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { renderPackage } from "../services/render/engine";
import { publishRenderedOutput } from "../services/publish/service";

const BAD_PACKAGE = "18a284b1-412c-48b6-89a9-b9557e2ccd0a";
const GOOD_PACKAGE = "ea3f9ac1-b0fd-4ae7-8552-75245331ef9e";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await sb.from("knowledge_packages").update({ status: "archived" }).eq("id", BAD_PACKAGE);
  await sb
    .from("knowledge_packages")
    .update({ status: "ready", last_verified_at: new Date().toISOString() })
    .eq("id", GOOD_PACKAGE);

  process.env.ALLOW_RENDER = "true";
  const renderResult = await renderPackage({
    packageId: GOOD_PACKAGE,
    format: "markdown",
    forceRerender: true,
  });

  if (renderResult.outputId) {
    await publishRenderedOutput(renderResult.outputId, "en");
  }

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("fact_count, version, status")
    .eq("id", GOOD_PACKAGE)
    .single();

  console.log("Restored nodejs-cluster:", pkg);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
