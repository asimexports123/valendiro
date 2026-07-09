import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const id = process.argv[2] ?? "b9eca77a-fa5e-4cff-8872-ebb281c22967";
  const { data } = await sb.from("rendered_outputs").select("document_tree, renderer_id").eq("id", id).single();
  const tree = data?.document_tree ?? [];
  const headings = tree.filter((n: { type: string }) => n.type === "heading").map((h: { level: number; text: string }) => ({ level: h.level, text: h.text }));
  console.log("renderer:", data?.renderer_id);
  console.log(JSON.stringify(headings, null, 2));
}
main();
