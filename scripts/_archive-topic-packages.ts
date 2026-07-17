import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";

const slug = process.argv[2] ?? "health-insurance";

async function main() {
  const sb = createAdminClient();
  const { data: t } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
  if (!t) {
    console.log("not found");
    process.exit(1);
  }
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id,status")
    .eq("topic_id", t.id)
    .in("status", ["ready", "draft"]);
  console.log("packages", packages?.length ?? 0);
  for (const pkg of packages ?? []) {
    await sb.from("rendered_outputs").delete().eq("package_id", pkg.id);
    await sb.from("knowledge_packages").update({ status: "archived" }).eq("id", pkg.id);
    console.log("archived", pkg.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
