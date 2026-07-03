const fs = require("fs");

const analysis = JSON.parse(fs.readFileSync("graph-density-analysis.json", "utf-8"));

const allTopics = [];

for (const subcategory of analysis) {
  for (const topic of subcategory.topics) {
    allTopics.push({
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      subcategorySlug: subcategory.subcategorySlug,
    });
  }
}

console.log(`Extracted ${allTopics.length} topics\n`);

allTopics.forEach(t => {
  console.log(`${t.slug} - ${t.title} (${t.subcategorySlug})`);
});

fs.writeFileSync("phase19-published-topics.json", JSON.stringify(allTopics, null, 2));
console.log("\nSaved to: phase19-published-topics.json");
