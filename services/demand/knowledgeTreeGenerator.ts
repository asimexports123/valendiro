/**
 * Knowledge Tree Generator
 *
 * Generates Topics from the existing Category → Subcategory hierarchy.
 * Replaces keyword-first discovery with knowledge-first expansion.
 *
 * Flow:
 *   Category → Subcategory → Generate Topics → Queue for publishing
 *
 * The generator thinks like a teacher building a complete course syllabus,
 * not like an SEO scraper chasing trending keywords.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Static knowledge tree ────────────────────────────────────────────────────
// Each Subcategory has a curated list of topics a learner should master.
// These are SEED topics. The system will expand each into articles automatically.

export const SUBCATEGORY_TOPICS: Record<string, string[]> = {
  // ── Technology ──────────────────────────────────────────────────────────────
  "docker": [
    "Docker", "Docker Architecture", "Docker Images", "Docker Containers",
    "Dockerfile", "Docker Compose", "Docker Networks", "Docker Volumes",
    "Docker CMD vs ENTRYPOINT", "Docker Best Practices", "Docker Security",
    "Docker vs Virtual Machines", "Docker Hub", "Multi-Stage Builds in Docker",
  ],
  "kubernetes": [
    "Kubernetes", "Kubernetes Architecture", "Kubernetes Pods", "Kubernetes Services",
    "Kubernetes Deployments", "Kubernetes ConfigMaps", "Kubernetes Secrets",
    "Kubernetes Ingress", "Kubernetes Namespaces", "Helm Charts",
    "Kubernetes vs Docker Swarm", "kubectl Commands", "Kubernetes RBAC",
  ],
  "python": [
    "Python", "Python Variables and Data Types", "Python Functions",
    "Python Lists and Dictionaries", "Python Classes and OOP",
    "Python File Handling", "Python Error Handling", "Python Modules and Packages",
    "Python Virtual Environments", "Python with APIs", "Python List Comprehensions",
    "Python Lambda Functions", "Python Decorators", "pip Package Manager",
  ],
  "javascript": [
    "JavaScript", "JavaScript Variables", "JavaScript Functions", "JavaScript Arrays",
    "JavaScript Objects", "JavaScript ES6 Features", "JavaScript Promises",
    "JavaScript Async Await", "JavaScript DOM Manipulation", "JavaScript Fetch API",
    "JavaScript Closures", "JavaScript Prototypes", "JavaScript Modules",
    "JavaScript Error Handling", "TypeScript vs JavaScript",
  ],
  "git": [
    "Git", "Git Commit", "Git Branching", "Git Merge", "Git Rebase",
    "Git Pull Request", "Git Remote", "Git Stash", "Git Revert vs Reset",
    "GitHub vs GitLab", "Git Best Practices", "Git Workflows",
  ],
  "linux": [
    "Linux", "Linux File System", "Linux Commands", "Linux Permissions",
    "Linux Shell Scripting", "Linux Process Management", "Linux Networking",
    "Linux Package Management", "Linux Cron Jobs", "Bash vs Zsh",
    "Linux vs Windows Server", "SSH and Remote Access",
  ],
  "react": [
    "React", "React Components", "React Props", "React State",
    "React Hooks", "React useEffect", "React Context API",
    "React Router", "React Performance Optimization",
    "React vs Vue vs Angular", "Next.js", "React Testing",
  ],
  "sql": [
    "SQL", "SQL SELECT Statement", "SQL JOIN Types", "SQL Indexes",
    "SQL Transactions", "SQL Stored Procedures", "SQL vs NoSQL",
    "PostgreSQL", "MySQL vs PostgreSQL", "SQL Normalization",
    "SQL Window Functions", "SQL Performance Optimization",
  ],
  "aws": [
    "Amazon Web Services", "AWS EC2", "AWS S3", "AWS Lambda",
    "AWS RDS", "AWS IAM", "AWS VPC", "AWS CloudFront",
    "AWS vs Google Cloud vs Azure", "AWS Cost Optimization",
    "Serverless Architecture", "AWS Certification Guide",
  ],
  "devops": [
    "DevOps", "CI/CD Pipeline", "Jenkins", "GitHub Actions",
    "Infrastructure as Code", "Terraform", "Ansible",
    "DevOps vs SRE", "Monitoring and Observability",
    "DevOps Best Practices", "Blue Green Deployment",
  ],

  // ── Personal Finance ────────────────────────────────────────────────────────
  "investing-basics": [
    "Index Funds", "ETF", "Compound Interest", "Dollar Cost Averaging",
    "Stock Market", "Bonds", "Asset Allocation", "Diversification",
    "Roth IRA", "401k", "Dividend Investing", "Value Investing",
    "Growth Investing", "Portfolio Rebalancing",
  ],
  "budgeting": [
    "Personal Budget", "50/30/20 Rule", "Zero Based Budgeting",
    "Emergency Fund", "Debt Snowball Method", "Debt Avalanche Method",
    "Net Worth", "Financial Independence", "FIRE Movement",
    "Sinking Fund", "Envelope Budgeting",
  ],
  "mortgage": [
    "Mortgage", "Mortgage Calculator", "Fixed Rate Mortgage",
    "Adjustable Rate Mortgage", "FHA Loan", "VA Loan",
    "Mortgage Pre-Approval", "Down Payment", "PMI Insurance",
    "Refinancing a Mortgage", "Home Equity Loan",
  ],
  "credit-cards": [
    "Credit Card", "Credit Score", "Credit Card Interest",
    "Credit Card Rewards", "Balance Transfer Credit Card",
    "Secured Credit Card", "Credit Utilization",
    "How to Improve Credit Score", "Credit Card vs Debit Card",
  ],
  "taxes": [
    "Income Tax", "Capital Gains Tax", "Tax Deductions",
    "Tax Credits", "W-2 vs 1099", "Self Employment Tax",
    "Tax Brackets", "Standard vs Itemized Deduction",
    "IRS Audit", "Tax Loss Harvesting",
  ],

  // ── Health & Wellness ───────────────────────────────────────────────────────
  "diabetes": [
    "Type 2 Diabetes", "Type 1 Diabetes", "Prediabetes",
    "Blood Sugar Levels", "Insulin Resistance", "Diabetes Diet",
    "Diabetes Medications", "Diabetes and Exercise",
    "Diabetes Complications", "Gestational Diabetes",
  ],
  "mental-health": [
    "Anxiety", "Depression", "Cortisol", "Stress Management",
    "ADHD", "PTSD", "Panic Attacks", "Cognitive Behavioral Therapy",
    "Mindfulness", "Sleep and Mental Health", "Burnout",
    "Therapy vs Medication", "Social Anxiety",
  ],
  "nutrition": [
    "Protein", "Carbohydrates", "Healthy Fats", "Fiber",
    "Vitamins", "Minerals", "Antioxidants", "Omega-3 Fatty Acids",
    "Probiotics", "Intermittent Fasting", "Mediterranean Diet",
    "Keto Diet", "Calorie Deficit", "Macronutrients",
  ],
  "fitness": [
    "Strength Training", "Cardio Exercise", "HIIT Workout",
    "Yoga", "Stretching and Flexibility", "Progressive Overload",
    "Muscle Hypertrophy", "Fat Loss vs Weight Loss",
    "Rest and Recovery", "Creatine Supplement", "Pre-Workout",
  ],
  "heart-health": [
    "Heart Disease", "Hypertension", "Cholesterol",
    "LDL vs HDL Cholesterol", "Blood Pressure", "Cardiovascular Exercise",
    "Heart Attack Symptoms", "Stroke", "Statins",
    "Mediterranean Diet and Heart Health",
  ],

  // ── Education (History, Civics, Science) ────────────────────────────────────
  "world-wars": [
    "World War I", "World War II", "Causes of World War II",
    "Holocaust", "D-Day", "Battle of Stalingrad",
    "Atomic Bombing of Hiroshima", "Cold War",
    "Treaty of Versailles", "Nazi Germany",
  ],
  "civics": [
    "Democracy", "Gerrymandering", "Electoral College",
    "Separation of Powers", "Bill of Rights", "Federalism",
    "Checks and Balances", "Judicial Review",
    "Voter Suppression", "Campaign Finance",
  ],
  "world-history": [
    "Industrial Revolution", "French Revolution", "American Revolution",
    "British Empire", "Roman Empire", "Ancient Egypt",
    "Silk Road", "Renaissance", "Reformation",
    "Colonialism", "Slavery in America", "Civil Rights Movement",
  ],
  "physics": [
    "Newton Laws of Motion", "Gravity", "Thermodynamics",
    "Quantum Mechanics", "Theory of Relativity",
    "Electricity and Magnetism", "Nuclear Physics",
    "Wave Particle Duality", "String Theory", "Dark Matter",
  ],
  "biology": [
    "DNA", "RNA", "Protein Synthesis", "Cell Division",
    "Evolution", "Natural Selection", "Genetics",
    "CRISPR", "Photosynthesis", "Human Immune System",
    "Viruses vs Bacteria", "Cancer Biology",
  ],
};

// ─── Main generator function ──────────────────────────────────────────────────

export interface TopicGenerationResult {
  subcategorySlug: string;
  topicsQueued: number;
  topicsSkipped: number;
  errors: string[];
}

export interface KnowledgeTreeExpansionResult {
  subcategoriesProcessed: number;
  totalTopicsQueued: number;
  totalTopicsSkipped: number;
  errors: string[];
}

/**
 * Generate topics for a specific Subcategory slug.
 * Inserts into content_generation_queue as object_type="topic".
 * Skips topics that already exist in topics or queue.
 */
export async function generateTopicsForSubcategory(
  subcategorySlug: string,
  subcategoryId: string,
  categoryId: string,
  limit = 20
): Promise<TopicGenerationResult> {
  const supabase = createAdminClient();
  const result: TopicGenerationResult = { subcategorySlug, topicsQueued: 0, topicsSkipped: 0, errors: [] };

  const seedTopics = SUBCATEGORY_TOPICS[subcategorySlug];
  if (!seedTopics || seedTopics.length === 0) {
    result.errors.push(`No seed topics defined for Subcategory: ${subcategorySlug}`);
    return result;
  }

  // Fetch existing topic slugs to avoid duplicates
  const { data: existingTopics } = await supabase
    .from("topics")
    .select("slug")
    .eq("category_id", categoryId);
  const existingSlugs = new Set((existingTopics ?? []).map((t) => t.slug));

  // Fetch existing queue titles to avoid re-queuing
  const { data: existingQueue } = await supabase
    .from("content_generation_queue")
    .select("title")
    .eq("object_type", "topic")
    .eq("status", "pending");
  const existingQueueTitles = new Set(
    (existingQueue ?? []).map((q) => q.title.toLowerCase().trim())
  );

  let queued = 0;
  for (const topicTitle of seedTopics.slice(0, limit)) {
    if (queued >= limit) break;

    const slug = topicTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    if (existingSlugs.has(slug) || existingQueueTitles.has(topicTitle.toLowerCase().trim())) {
      result.topicsSkipped++;
      continue;
    }

    const { error } = await supabase.from("content_generation_queue").insert({
      object_type: "topic",
      title: topicTitle,
      description: `Topic: ${topicTitle} — part of the ${subcategorySlug} knowledge Subcategory.`,
      reason: `Knowledge tree expansion for Subcategory: ${subcategorySlug}`,
      priority_score: 80,
      status: "pending",
      metadata: {
        subcategory_id: subcategoryId,
        category_id: categoryId,
        source: "knowledge_tree",
        subcategory_slug: subcategorySlug,
      },
    });

    if (error) {
      result.errors.push(`Failed to queue topic "${topicTitle}": ${error.message}`);
    } else {
      result.topicsQueued++;
      queued++;
    }
  }

  return result;
}

/**
 * Expand the entire knowledge tree.
 * Iterates over all subcategories in the DB that have seed topics defined,
 * and generates topics for each one.
 */
export async function expandKnowledgeTree(topicsPerSubcategory = 5): Promise<KnowledgeTreeExpansionResult> {
  const supabase = createAdminClient();
  const overall: KnowledgeTreeExpansionResult = {
    subcategoriesProcessed: 0,
    totalTopicsQueued: 0,
    totalTopicsSkipped: 0,
    errors: [],
  };

  // Fetch all subcategories with their category_id
  const { data: subcategories, error: colErr } = await supabase
    .from("subcategories")
    .select("id, slug, category_id")
    .order("created_at", { ascending: true });

  if (colErr || !subcategories) {
    overall.errors.push(`Failed to fetch subcategories: ${colErr?.message}`);
    return overall;
  }

  for (const col of subcategories) {
    if (!SUBCATEGORY_TOPICS[col.slug]) continue; // No seed topics for this Subcategory

    const result = await generateTopicsForSubcategory(
      col.slug,
      col.id,
      col.category_id,
      topicsPerSubcategory
    );

    overall.subcategoriesProcessed++;
    overall.totalTopicsQueued += result.topicsQueued;
    overall.totalTopicsSkipped += result.topicsSkipped;
    overall.errors.push(...result.errors);

    console.log(
      `[KnowledgeTree] ${col.slug}: queued=${result.topicsQueued} skipped=${result.topicsSkipped}`
    );
  }

  return overall;
}

/**
 * Returns the list of Subcategory slugs that have seed topics defined.
 * Used by the admin dashboard to show coverage.
 */
export function getKnowledgeTreeCoverage(): { slug: string; topicCount: number }[] {
  return Object.entries(SUBCATEGORY_TOPICS).map(([slug, topics]) => ({
    slug,
    topicCount: topics.length,
  }));
}
