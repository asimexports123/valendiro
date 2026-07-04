import "dotenv/config";

const RENDER_SECRET = process.env.RENDER_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

if (!RENDER_SECRET) {
  console.error("RENDER_SECRET environment variable is required");
  process.exit(1);
}

const CATEGORIES = ["technology", "personal-finance", "business", "education", "health-wellness", "home-lifestyle", "travel"];
const ARTICLES_PER_CATEGORY = 3;

async function getPilotArticles() {
  // Since we can't access the database directly without admin credentials,
  // we'll use a hardcoded list of known article slugs for the pilot
  // In production, this would be fetched from the database
  
  const pilotArticles = [
    // Technology
    { slug: "docker-containers", category: "technology" },
    { slug: "artificial-intelligence-fundamentals", category: "technology" },
    { slug: "web-development-fundamentals", category: "technology" },
    
    // Personal Finance
    { slug: "investing-fundamentals", category: "personal-finance" },
    { slug: "budgeting-fundamentals", category: "personal-finance" },
    { slug: "retirement-planning-fundamentals", category: "personal-finance" },
    
    // Business
    { slug: "entrepreneurship-fundamentals", category: "business" },
    { slug: "marketing-fundamentals", category: "business" },
    { slug: "leadership-fundamentals", category: "business" },
    
    // Education
    { slug: "study-skills-fundamentals", category: "education" },
    { slug: "learning-methods-fundamentals", category: "education" },
    { slug: "career-development-fundamentals", category: "education" },
    
    // Health
    { slug: "nutrition-fundamentals", category: "health-wellness" },
    { slug: "fitness-fundamentals", category: "health-wellness" },
    { slug: "mental-health-fundamentals", category: "health-wellness" },
    
    // Home
    { slug: "home-organization-fundamentals", category: "home-lifestyle" },
    { slug: "cooking-fundamentals", category: "home-lifestyle" },
    { slug: "productivity-fundamentals", category: "home-lifestyle" },
    
    // Travel
    { slug: "budget-travel-strategies", category: "travel" },
    { slug: "travel-planning-fundamentals", category: "travel" },
  ];

  return pilotArticles;
}

async function getPackageIdForArticle(slug: string): Promise<string | null> {
  try {
    // Get the article page to extract package ID from the rendered content
    const response = await fetch(`${BASE_URL}/api/render/${slug}`);
    if (!response.ok) {
      console.log(`  ❌ Could not find render for ${slug}`);
      return null;
    }
    
    const data = await response.json();
    // The render API returns outputId, but we need packageId
    // We'll need to get this from a different source or use a different approach
    // For now, return null and we'll use a direct database approach in production
    
    return null;
  } catch (error) {
    console.log(`  ❌ Error fetching render for ${slug}:`, error);
    return null;
  }
}

async function triggerRerender(packageId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/render/${packageId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Render-Secret": RENDER_SECRET,
      },
      body: JSON.stringify({
        format: "html",
        renderer: "long-article-v2",
        style: ["intermediate"],
      }),
    });

    if (!response.ok) {
      console.log(`  ❌ Rerender failed for package ${packageId}: ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    console.log(`  ✅ Successfully re-rendered package ${packageId} (status: ${result.status}, quality: ${result.qualityScore?.overall})`);
    return true;
  } catch (error) {
    console.log(`  ❌ Error re-rendering package ${packageId}:`, error);
    return false;
  }
}

async function main() {
  console.log("Phase A Sprint 2 - Pilot Rerender (via API)");
  console.log("=========================================\n");

  console.log("Step 1: Getting pilot articles...\n");
  const articles = await getPilotArticles();
  console.log(`Selected ${articles.length} articles for pilot rerender\n`);

  console.log("Step 2: Triggering re-renders via API...\n");
  console.log("NOTE: This approach requires knowing package IDs. In production,");
  console.log("we need direct database access to map article slugs to package IDs.\n");
  
  console.log("Current limitation: Cannot access database without admin credentials.");
  console.log("Alternative approaches:");
  console.log("1. Use the admin dashboard to manually trigger re-renders");
  console.log("2. Provide admin credentials to the script");
  console.log("3. Create a new admin API endpoint for batch re-rendering\n");
  
  console.log("Recommendation: Create an admin API endpoint for batch re-rendering");
  console.log("that accepts a list of article slugs and triggers re-renders with the new renderer.");
}

main().catch(console.error);
