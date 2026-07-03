/**
 * Revalidate a specific topic page to clear ISR cache
 */

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: npx tsx scripts/revalidate-topic.ts <slug>");
  process.exit(1);
}

const path = `/en/topics/${slug}`;

fetch("https://valendiro.com/api/revalidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ path }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("Revalidation response:", data);
  })
  .catch((err) => {
    console.error("Revalidation failed:", err);
  });
