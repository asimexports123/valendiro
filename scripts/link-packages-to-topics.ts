/**
 * Link Knowledge Packages to Topics
 *
 * Creates topics in the topics table for each seeded knowledge package,
 * links them to the correct subcategory, and adds topic translations.
 * This makes packages visible on public subcategory/topic pages.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

// Subcategory IDs from the database
const SUBCATEGORY_IDS: Record<string, string> = {
  "programming":        "c2958e16-3155-4946-95fd-816ead05e8d9",
  "web-development":    "76cf0684-38ff-4e44-a633-8f744a321a67",
  "data-science":       "717ba0e5-3334-4a62-837a-5cda60105d54",
  "databases":          "2d58645f-34f8-4d25-b190-1419c4edbae2",
  "operating-systems":  "25b48cd5-e2be-4b9e-a9d5-ce3f4836aa1b",
  "software-engineering":"58c42ac7-c23e-46cb-9323-41273e3fe72a",
};

// Map each package slug → subcategory + display metadata
const PACKAGE_META: Record<string, {
  subcategorySlug: string;
  title: string;
  subtitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedReadTime: number;
}> = {
  // Programming Languages → programming
  "python-programming-fundamentals": {
    subcategorySlug: "programming",
    title: "Python Programming Fundamentals",
    subtitle: "Learn Python from scratch — syntax, data types, and core concepts.",
    difficulty: "beginner", estimatedReadTime: 8,
  },
  "javascript-fundamentals": {
    subcategorySlug: "programming",
    title: "JavaScript Fundamentals",
    subtitle: "Master the language of the web — variables, functions, and async patterns.",
    difficulty: "beginner", estimatedReadTime: 10,
  },
  "typescript-language": {
    subcategorySlug: "programming",
    title: "TypeScript Language",
    subtitle: "Add static types to JavaScript for safer, more scalable code.",
    difficulty: "intermediate", estimatedReadTime: 9,
  },
  "rust-programming-language": {
    subcategorySlug: "programming",
    title: "Rust Programming Language",
    subtitle: "Systems programming with memory safety and zero-cost abstractions.",
    difficulty: "advanced", estimatedReadTime: 12,
  },
  "go-programming-language": {
    subcategorySlug: "programming",
    title: "Go Programming Language",
    subtitle: "Simple, fast, and concurrent — Go for backend and cloud development.",
    difficulty: "intermediate", estimatedReadTime: 9,
  },
  "sql-fundamentals": {
    subcategorySlug: "programming",
    title: "SQL Fundamentals",
    subtitle: "Query and manage relational databases with SQL.",
    difficulty: "beginner", estimatedReadTime: 8,
  },

  // Web Development → web-development
  "react-library": {
    subcategorySlug: "web-development",
    title: "React Library",
    subtitle: "Build dynamic UIs with components, hooks, and the React ecosystem.",
    difficulty: "intermediate", estimatedReadTime: 10,
  },
  "nextjs-framework": {
    subcategorySlug: "web-development",
    title: "Next.js Framework",
    subtitle: "Full-stack React with SSR, SSG, and the App Router.",
    difficulty: "intermediate", estimatedReadTime: 11,
  },
  "css-fundamentals": {
    subcategorySlug: "web-development",
    title: "CSS Fundamentals",
    subtitle: "Style web pages with layouts, animations, and responsive design.",
    difficulty: "beginner", estimatedReadTime: 7,
  },
  "restful-apis": {
    subcategorySlug: "web-development",
    title: "RESTful APIs",
    subtitle: "Design and consume REST APIs using HTTP methods and status codes.",
    difficulty: "intermediate", estimatedReadTime: 8,
  },
  "html-fundamentals": {
    subcategorySlug: "web-development",
    title: "HTML Fundamentals",
    subtitle: "Structure web content with semantic HTML5 elements.",
    difficulty: "beginner", estimatedReadTime: 6,
  },

  // Data Science → data-science
  "machine-learning-fundamentals": {
    subcategorySlug: "data-science",
    title: "Machine Learning Fundamentals",
    subtitle: "Supervised, unsupervised, and reinforcement learning explained.",
    difficulty: "intermediate", estimatedReadTime: 12,
  },
  "pandas-data-analysis": {
    subcategorySlug: "data-science",
    title: "Pandas Data Analysis",
    subtitle: "Manipulate and analyze tabular data with Python's Pandas library.",
    difficulty: "intermediate", estimatedReadTime: 9,
  },
  "neural-networks": {
    subcategorySlug: "data-science",
    title: "Neural Networks",
    subtitle: "Understand deep learning — layers, backpropagation, and training.",
    difficulty: "advanced", estimatedReadTime: 14,
  },
  "data-visualization": {
    subcategorySlug: "data-science",
    title: "Data Visualization",
    subtitle: "Turn raw data into clear, meaningful charts and dashboards.",
    difficulty: "beginner", estimatedReadTime: 8,
  },
  "statistics-fundamentals": {
    subcategorySlug: "data-science",
    title: "Statistics Fundamentals",
    subtitle: "Probability, distributions, hypothesis testing, and regression.",
    difficulty: "beginner", estimatedReadTime: 9,
  },

  // Computer Science → databases / operating-systems
  "algorithms-fundamentals": {
    subcategorySlug: "programming",
    title: "Algorithms Fundamentals",
    subtitle: "Time complexity, sorting, searching, and Big O notation.",
    difficulty: "intermediate", estimatedReadTime: 11,
  },
  "data-structures": {
    subcategorySlug: "programming",
    title: "Data Structures",
    subtitle: "Arrays, linked lists, trees, graphs, and hash tables explained.",
    difficulty: "intermediate", estimatedReadTime: 11,
  },
  "operating-systems": {
    subcategorySlug: "operating-systems",
    title: "Operating Systems",
    subtitle: "Processes, memory management, scheduling, and file systems.",
    difficulty: "intermediate", estimatedReadTime: 12,
  },
  "computer-networks": {
    subcategorySlug: "web-development",
    title: "Computer Networks",
    subtitle: "TCP/IP, DNS, HTTP, and the fundamentals of how the internet works.",
    difficulty: "intermediate", estimatedReadTime: 10,
  },
  "database-design": {
    subcategorySlug: "databases",
    title: "Database Design",
    subtitle: "Normalization, relationships, indexes, and ACID transactions.",
    difficulty: "intermediate", estimatedReadTime: 10,
  },

  // Software Engineering → software-engineering
  "git-version-control": {
    subcategorySlug: "software-engineering",
    title: "Git Version Control",
    subtitle: "Track code changes, collaborate with branches, and manage history.",
    difficulty: "beginner", estimatedReadTime: 7,
  },
  "docker-containers": {
    subcategorySlug: "software-engineering",
    title: "Docker Containers",
    subtitle: "Package and deploy applications consistently with Docker.",
    difficulty: "intermediate", estimatedReadTime: 9,
  },
  "software-testing": {
    subcategorySlug: "software-engineering",
    title: "Software Testing",
    subtitle: "Unit, integration, and end-to-end testing strategies.",
    difficulty: "intermediate", estimatedReadTime: 9,
  },
  "design-patterns": {
    subcategorySlug: "software-engineering",
    title: "Software Design Patterns",
    subtitle: "Creational, structural, and behavioral patterns for clean code.",
    difficulty: "intermediate", estimatedReadTime: 11,
  },
  "agile-development": {
    subcategorySlug: "software-engineering",
    title: "Agile Development",
    subtitle: "Scrum, Kanban, sprints, and iterative software delivery.",
    difficulty: "beginner", estimatedReadTime: 8,
  },
};

async function main() {
  console.log("=== Linking Knowledge Packages to Topics ===\n");

  // Load all packages
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, slug");

  if (!packages?.length) {
    console.log("No packages found.");
    return;
  }

  const pkgMap = new Map(packages.map((p: any) => [p.slug, p.id]));

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const [slug, meta] of Object.entries(PACKAGE_META)) {
    const pkgId = pkgMap.get(slug);
    if (!pkgId) {
      console.log(`  SKIP (no package): ${slug}`);
      skipped++;
      continue;
    }

    const subcategoryId = SUBCATEGORY_IDS[meta.subcategorySlug];
    if (!subcategoryId) {
      console.log(`  SKIP (no subcategory): ${slug}`);
      skipped++;
      continue;
    }

    // Check if topic already exists
    const { data: existing } = await sb
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      // Update subcategory_id if not set
      await sb.from("topics").update({ subcategory_id: subcategoryId }).eq("id", existing.id);
      // Update knowledge package topic_id
      await sb.from("knowledge_packages").update({ topic_id: existing.id }).eq("id", pkgId);
      console.log(`  UPDATE (exists): ${slug}`);
      skipped++;
      continue;
    }

    try {
      // Create topic
      const { data: topic, error: topicErr } = await sb
        .from("topics")
        .insert({
          slug,
          canonical_path: `/en/topics/${slug}`,
          subcategory_id: subcategoryId,
          difficulty: meta.difficulty,
          estimated_read_time: meta.estimatedReadTime,
          status: "published",
          published_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (topicErr || !topic) {
        console.log(`  ERROR (topic insert): ${slug} — ${topicErr?.message}`);
        errors++;
        continue;
      }

      // Create English translation
      const { error: transErr } = await sb.from("topic_translations").insert({
        topic_id: topic.id,
        language_code: "en",
        title: meta.title,
        subtitle: meta.subtitle,
        content: null,
        meta_title: `${meta.title} — Valendiro`,
        meta_description: meta.subtitle,
      });

      if (transErr) {
        console.log(`  ERROR (translation): ${slug} — ${transErr.message}`);
        errors++;
        continue;
      }

      // Link knowledge package to this topic
      await sb.from("knowledge_packages").update({ topic_id: topic.id }).eq("id", pkgId);

      console.log(`  OK: ${slug} → ${meta.subcategorySlug}`);
      created++;
    } catch (err: any) {
      console.log(`  ERROR: ${slug} — ${err?.message}`);
      errors++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Created:  ${created}`);
  console.log(`  Updated:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);
  console.log(`\n=== Done ===`);
}

main().catch(console.error);
