import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();
  const { data: rows, error } = await sb
    .from("topics")
    .select(`
      id, slug,
      topic_translations(title, content),
      categories(slug, category_translations(name)),
      subcategories(slug, subcategory_translations(name))
    `)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .eq("categories.category_translations.language_code", "en")
    .eq("subcategories.subcategory_translations.language_code", "en");

  console.log("error", error?.message);
  console.log("rows", rows?.length);
  const slugs = (rows ?? []).map((r) => r.slug).slice(0, 20);
  console.log("sample slugs", slugs);

  const { data: loose } = await sb
    .from("topics")
    .select("slug, subcategories(slug)")
    .eq("status", "published")
    .eq("slug", "compound-interest-explained");
  console.log("loose", loose);
}
main();
