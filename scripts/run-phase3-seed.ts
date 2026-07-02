import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function runSQL(label: string, sql: string) {
  const { error } = await sb.rpc("exec_sql", { sql_string: sql });
  if (error) {
    console.log(`✗ ${label}: ${error.message}`);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

async function main() {
  console.log("=== Phase 3: Seed Master Taxonomy + Entity Type Blueprints ===\n");

  // ─── Part 1: Clean Phase 2 test data ───
  console.log("--- Cleaning Phase 2 test data ---");
  await sb.from("hub_slot_translations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("hub_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("hub_section_translations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("hub_sections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("topic_translations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("topics").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("entity_type_slot_translations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("entity_type_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("entity_type_section_translations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("entity_type_sections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("entity_type_translations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("entity_types").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Test data cleaned\n");

  // ─── Part 2: Seed 85 Subcategories ───
  console.log("--- Part 1: Seeding 85 Subcategories ---");

  // Read the migration file and extract just the subcategory INSERT statements
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, "../database/migrations/000012_seed_master_taxonomy.sql"),
    "utf8"
  );

  // We need to get category IDs first
  const { data: cats } = await sb.from("categories").select("id, slug");
  const catMap: Record<string, string> = {};
  for (const c of cats!) catMap[c.slug] = c.id;
  console.log("  Categories found:", Object.keys(catMap).join(", "));

  // Define all 85 subcategories grouped by category
  const taxonomy: Record<string, Array<{ slug: string; sort: number; name: string; desc: string; metaTitle: string; metaDesc: string }>> = {
    "technology": [
      { slug: "programming", sort: 1, name: "Programming", desc: "Languages, frameworks, algorithms and coding fundamentals.", metaTitle: "Programming Guides", metaDesc: "Learn programming languages, algorithms, data structures and coding best practices." },
      { slug: "artificial-intelligence", sort: 2, name: "Artificial Intelligence", desc: "Machine learning, deep learning, NLP and AI applications.", metaTitle: "AI & Machine Learning Guides", metaDesc: "Understand machine learning, deep learning, NLP and real-world AI applications." },
      { slug: "web-development", sort: 3, name: "Web Development", desc: "Frontend, backend, full-stack, APIs and web technologies.", metaTitle: "Web Development Guides", metaDesc: "Master frontend, backend, full-stack development and modern web technologies." },
      { slug: "mobile-development", sort: 4, name: "Mobile Development", desc: "iOS, Android, cross-platform and mobile-first development.", metaTitle: "Mobile Development Guides", metaDesc: "Build iOS, Android and cross-platform mobile applications." },
      { slug: "cloud-computing", sort: 5, name: "Cloud Computing", desc: "AWS, Azure, GCP, serverless, containers and cloud architecture.", metaTitle: "Cloud Computing Guides", metaDesc: "Learn cloud platforms, serverless architecture, containers and cloud-native development." },
      { slug: "devops", sort: 6, name: "DevOps", desc: "CI/CD, Docker, Kubernetes, monitoring and infrastructure as code.", metaTitle: "DevOps Guides", metaDesc: "Master CI/CD, Docker, Kubernetes, monitoring and infrastructure automation." },
      { slug: "cybersecurity", sort: 7, name: "Cybersecurity", desc: "Network security, encryption, ethical hacking and threat prevention.", metaTitle: "Cybersecurity Guides", metaDesc: "Learn network security, encryption, ethical hacking and cyber threat prevention." },
      { slug: "data-science", sort: 8, name: "Data Science", desc: "Data analysis, visualisation, statistics and big data tools.", metaTitle: "Data Science Guides", metaDesc: "Master data analysis, statistics, visualisation and big data processing tools." },
      { slug: "networking", sort: 9, name: "Networking", desc: "TCP/IP, DNS, routing, firewalls and network administration.", metaTitle: "Networking Guides", metaDesc: "Understand TCP/IP, DNS, routing, firewalls and network infrastructure." },
      { slug: "databases", sort: 10, name: "Databases", desc: "SQL, NoSQL, query optimisation, indexing and database design.", metaTitle: "Database Guides", metaDesc: "Learn SQL, NoSQL, database design, query optimisation and data modelling." },
      { slug: "operating-systems", sort: 11, name: "Operating Systems", desc: "Linux, Windows, macOS, process management and system internals.", metaTitle: "Operating System Guides", metaDesc: "Understand Linux, Windows, macOS, process management and OS internals." },
      { slug: "hardware-iot", sort: 12, name: "Hardware & IoT", desc: "Processors, embedded systems, Arduino, Raspberry Pi and IoT.", metaTitle: "Hardware & IoT Guides", metaDesc: "Learn about processors, embedded systems, Arduino, Raspberry Pi and IoT development." },
      { slug: "software-engineering", sort: 13, name: "Software Engineering", desc: "Design patterns, architecture, testing, code quality and workflows.", metaTitle: "Software Engineering Guides", metaDesc: "Master design patterns, software architecture, testing and engineering best practices." },
    ],
    "business": [
      { slug: "entrepreneurship", sort: 1, name: "Entrepreneurship", desc: "Starting, growing and scaling a business from idea to execution.", metaTitle: "Entrepreneurship Guides", metaDesc: "Learn how to start, grow and scale a business with practical entrepreneurship guides." },
      { slug: "marketing", sort: 2, name: "Marketing", desc: "Digital marketing, SEO, social media, content and brand strategy.", metaTitle: "Marketing Guides", metaDesc: "Master digital marketing, SEO, social media, content marketing and brand building." },
      { slug: "sales", sort: 3, name: "Sales", desc: "Sales techniques, negotiation, CRM and revenue generation.", metaTitle: "Sales Guides", metaDesc: "Improve your sales skills with guides on techniques, negotiation and CRM tools." },
      { slug: "management", sort: 4, name: "Management", desc: "Team management, decision-making, delegation and organisational skills.", metaTitle: "Management Guides", metaDesc: "Learn team management, decision-making, delegation and organisational best practices." },
      { slug: "leadership", sort: 5, name: "Leadership", desc: "Leadership styles, communication, vision and team motivation.", metaTitle: "Leadership Guides", metaDesc: "Develop your leadership skills with guides on communication, vision and motivation." },
      { slug: "startups", sort: 6, name: "Startups", desc: "Startup funding, MVP, product-market fit and scaling strategies.", metaTitle: "Startup Guides", metaDesc: "Navigate startup challenges from funding and MVP to product-market fit and scaling." },
      { slug: "e-commerce", sort: 7, name: "E-commerce", desc: "Online stores, payment processing, logistics and conversion.", metaTitle: "E-commerce Guides", metaDesc: "Build and grow your online store with guides on payments, logistics and conversions." },
      { slug: "operations", sort: 8, name: "Operations", desc: "Supply chain, process optimisation, quality control and logistics.", metaTitle: "Operations Guides", metaDesc: "Optimise business operations with guides on supply chain, process and quality management." },
      { slug: "human-resources", sort: 9, name: "Human Resources", desc: "Hiring, employee engagement, compensation and workplace culture.", metaTitle: "HR Guides", metaDesc: "Master hiring, employee engagement, compensation strategies and workplace culture." },
      { slug: "customer-service", sort: 10, name: "Customer Service", desc: "Support systems, customer satisfaction, retention and loyalty.", metaTitle: "Customer Service Guides", metaDesc: "Improve customer satisfaction, retention and loyalty with effective support strategies." },
      { slug: "business-strategy", sort: 11, name: "Business Strategy", desc: "Competitive analysis, growth planning, mergers and market positioning.", metaTitle: "Business Strategy Guides", metaDesc: "Plan business growth with guides on competitive analysis, positioning and strategy." },
      { slug: "project-management", sort: 12, name: "Project Management", desc: "Agile, Scrum, Kanban, timelines, budgets and team coordination.", metaTitle: "Project Management Guides", metaDesc: "Master Agile, Scrum, Kanban and project planning with practical guides." },
    ],
    "personal-finance": [
      { slug: "personal-finance-basics", sort: 1, name: "Personal Finance Basics", desc: "Budgeting, saving, emergency funds and financial literacy.", metaTitle: "Personal Finance Basics", metaDesc: "Build a strong financial foundation with guides on budgeting, saving and financial literacy." },
      { slug: "investing", sort: 2, name: "Investing", desc: "Investment strategies, portfolio building and asset allocation.", metaTitle: "Investing Guides", metaDesc: "Learn investment strategies, portfolio building and smart asset allocation." },
      { slug: "stock-market", sort: 3, name: "Stock Market", desc: "Stock trading, analysis, IPOs, dividends and market fundamentals.", metaTitle: "Stock Market Guides", metaDesc: "Understand stock trading, technical analysis, IPOs and dividend investing." },
      { slug: "mutual-funds", sort: 4, name: "Mutual Funds", desc: "Fund selection, SIPs, NAV, expense ratios and fund categories.", metaTitle: "Mutual Fund Guides", metaDesc: "Learn mutual fund selection, SIP investing, NAV analysis and fund categories." },
      { slug: "etfs", sort: 5, name: "ETFs", desc: "Exchange-traded funds, index tracking, sector ETFs and trading.", metaTitle: "ETF Guides", metaDesc: "Understand ETFs, index tracking, sector funds and ETF trading strategies." },
      { slug: "banking", sort: 6, name: "Banking", desc: "Savings accounts, fixed deposits, digital banking and bank services.", metaTitle: "Banking Guides", metaDesc: "Compare savings accounts, fixed deposits, digital banking and bank services." },
      { slug: "credit-cards", sort: 7, name: "Credit Cards", desc: "Card selection, rewards, credit score, interest and responsible use.", metaTitle: "Credit Card Guides", metaDesc: "Choose the right credit card, maximise rewards and manage your credit score." },
      { slug: "loans-mortgages", sort: 8, name: "Loans & Mortgages", desc: "Home loans, personal loans, EMI, interest rates and refinancing.", metaTitle: "Loan & Mortgage Guides", metaDesc: "Compare home loans, personal loans, understand EMI calculations and refinancing." },
      { slug: "insurance", sort: 9, name: "Insurance", desc: "Life, health, auto, home insurance and policy comparison.", metaTitle: "Insurance Guides", metaDesc: "Compare life, health, auto and home insurance policies with expert guides." },
      { slug: "taxes", sort: 10, name: "Taxes", desc: "Income tax, deductions, filing, tax planning and compliance.", metaTitle: "Tax Guides", metaDesc: "Simplify income tax filing, deductions, tax planning and compliance." },
      { slug: "retirement-planning", sort: 11, name: "Retirement Planning", desc: "401k, IRA, pension, Social Security and retirement strategies.", metaTitle: "Retirement Planning Guides", metaDesc: "Plan your retirement with guides on 401k, IRA, pension and Social Security." },
      { slug: "cryptocurrency", sort: 12, name: "Cryptocurrency", desc: "Bitcoin, Ethereum, DeFi, wallets, exchanges and blockchain.", metaTitle: "Cryptocurrency Guides", metaDesc: "Learn about Bitcoin, Ethereum, DeFi, crypto wallets and blockchain technology." },
    ],
    "health-wellness": [
      { slug: "nutrition", sort: 1, name: "Nutrition", desc: "Diet plans, vitamins, minerals, macros and healthy eating.", metaTitle: "Nutrition Guides", metaDesc: "Learn about diet plans, vitamins, minerals and healthy eating habits." },
      { slug: "fitness", sort: 2, name: "Fitness", desc: "Workouts, strength training, cardio, flexibility and exercise plans.", metaTitle: "Fitness Guides", metaDesc: "Build your fitness with guides on workouts, strength training and exercise plans." },
      { slug: "mental-health", sort: 3, name: "Mental Health", desc: "Anxiety, depression, stress management, therapy and mindfulness.", metaTitle: "Mental Health Guides", metaDesc: "Understand anxiety, depression, stress management and mindfulness techniques." },
      { slug: "diseases-conditions", sort: 4, name: "Diseases & Conditions", desc: "Symptoms, diagnosis, treatment options and disease management.", metaTitle: "Disease & Condition Guides", metaDesc: "Learn about symptoms, diagnosis, treatment options and disease management." },
      { slug: "medications", sort: 5, name: "Medications", desc: "Drug information, side effects, interactions and usage guidelines.", metaTitle: "Medication Guides", metaDesc: "Understand medications, side effects, drug interactions and proper usage." },
      { slug: "womens-health", sort: 6, name: "Women's Health", desc: "Reproductive health, pregnancy, menopause and women-specific care.", metaTitle: "Women's Health Guides", metaDesc: "Expert guides on reproductive health, pregnancy, menopause and women's wellness." },
      { slug: "mens-health", sort: 7, name: "Men's Health", desc: "Prostate health, testosterone, fitness and men-specific conditions.", metaTitle: "Men's Health Guides", metaDesc: "Guides on prostate health, testosterone, fitness and men-specific health topics." },
      { slug: "childrens-health", sort: 8, name: "Children's Health", desc: "Paediatric care, vaccinations, growth and childhood conditions.", metaTitle: "Children's Health Guides", metaDesc: "Learn about paediatric care, vaccinations, growth milestones and childhood health." },
      { slug: "preventive-care", sort: 9, name: "Preventive Care", desc: "Screenings, check-ups, vaccinations and early detection.", metaTitle: "Preventive Care Guides", metaDesc: "Stay healthy with guides on screenings, check-ups, vaccinations and early detection." },
      { slug: "healthy-lifestyle", sort: 10, name: "Healthy Lifestyle", desc: "Sleep, hydration, habits, work-life balance and wellness routines.", metaTitle: "Healthy Lifestyle Guides", metaDesc: "Build a healthy lifestyle with guides on sleep, hydration, habits and wellness." },
      { slug: "medical-tests", sort: 11, name: "Medical Tests", desc: "Blood tests, imaging, diagnostic procedures and test interpretation.", metaTitle: "Medical Test Guides", metaDesc: "Understand blood tests, imaging, diagnostic procedures and how to read results." },
      { slug: "alternative-medicine", sort: 12, name: "Alternative Medicine", desc: "Ayurveda, acupuncture, herbal remedies and complementary therapies.", metaTitle: "Alternative Medicine Guides", metaDesc: "Explore Ayurveda, acupuncture, herbal remedies and complementary health therapies." },
    ],
    "education": [
      { slug: "study-skills", sort: 1, name: "Study Skills", desc: "Note-taking, memory techniques, time management and exam prep.", metaTitle: "Study Skills Guides", metaDesc: "Improve your study skills with guides on note-taking, memory techniques and time management." },
      { slug: "school-education", sort: 2, name: "School Education", desc: "K-12 subjects, homework help, school selection and curriculum.", metaTitle: "School Education Guides", metaDesc: "Support school education with guides on subjects, homework strategies and curriculum." },
      { slug: "higher-education", sort: 3, name: "Higher Education", desc: "College applications, degrees, graduate school and academic life.", metaTitle: "Higher Education Guides", metaDesc: "Navigate college applications, degree selection and graduate school with expert guides." },
      { slug: "online-learning", sort: 4, name: "Online Learning", desc: "MOOCs, e-learning platforms, online degrees and self-paced courses.", metaTitle: "Online Learning Guides", metaDesc: "Find the best MOOCs, e-learning platforms and online degree programmes." },
      { slug: "career-development", sort: 5, name: "Career Development", desc: "Resume, interviews, networking, career change and professional growth.", metaTitle: "Career Development Guides", metaDesc: "Advance your career with guides on resumes, interviews, networking and growth." },
      { slug: "language-learning", sort: 6, name: "Language Learning", desc: "English, Spanish, language apps, techniques and immersion methods.", metaTitle: "Language Learning Guides", metaDesc: "Learn new languages with guides on techniques, apps and immersion methods." },
      { slug: "exams-certifications", sort: 7, name: "Exams & Certifications", desc: "Test preparation, professional certifications and exam strategies.", metaTitle: "Exam & Certification Guides", metaDesc: "Prepare for exams and professional certifications with proven strategies." },
      { slug: "teaching", sort: 8, name: "Teaching", desc: "Teaching methods, classroom management, EdTech and curriculum design.", metaTitle: "Teaching Guides", metaDesc: "Improve teaching with guides on methods, classroom management and EdTech tools." },
      { slug: "research-skills", sort: 9, name: "Research Skills", desc: "Academic writing, citations, research methodology and publishing.", metaTitle: "Research Skills Guides", metaDesc: "Master academic writing, citations, research methodology and publishing." },
      { slug: "personal-development", sort: 10, name: "Personal Development", desc: "Goal setting, productivity, habits, mindset and self-improvement.", metaTitle: "Personal Development Guides", metaDesc: "Grow personally with guides on goal setting, productivity, habits and mindset." },
    ],
    "home-lifestyle": [
      { slug: "home-improvement", sort: 1, name: "Home Improvement", desc: "Renovations, repairs, plumbing, electrical and home upgrades.", metaTitle: "Home Improvement Guides", metaDesc: "DIY home renovation, repair and upgrade guides for every skill level." },
      { slug: "interior-design", sort: 2, name: "Interior Design", desc: "Room layouts, colour schemes, furniture and decoration ideas.", metaTitle: "Interior Design Guides", metaDesc: "Transform your space with guides on layouts, colour schemes and decoration." },
      { slug: "home-organization", sort: 3, name: "Home Organization", desc: "Decluttering, storage solutions, closet systems and minimalism.", metaTitle: "Home Organization Guides", metaDesc: "Organise your home with guides on decluttering, storage and minimalist living." },
      { slug: "gardening", sort: 4, name: "Gardening", desc: "Plant care, landscaping, vegetable gardens and indoor plants.", metaTitle: "Gardening Guides", metaDesc: "Grow your garden with guides on plant care, landscaping and vegetable gardening." },
      { slug: "cooking", sort: 5, name: "Cooking", desc: "Recipes, meal prep, cooking techniques and kitchen tips.", metaTitle: "Cooking Guides", metaDesc: "Master cooking with recipes, meal prep strategies and kitchen techniques." },
      { slug: "cleaning", sort: 6, name: "Cleaning", desc: "Cleaning routines, products, deep cleaning and stain removal.", metaTitle: "Cleaning Guides", metaDesc: "Keep your home spotless with guides on routines, products and stain removal." },
      { slug: "diy-projects", sort: 7, name: "DIY Projects", desc: "Crafts, woodworking, home hacks and creative projects.", metaTitle: "DIY Project Guides", metaDesc: "Get inspired with DIY crafts, woodworking and creative home project guides." },
      { slug: "pets", sort: 8, name: "Pets", desc: "Dog care, cat care, pet health, training and pet products.", metaTitle: "Pet Care Guides", metaDesc: "Care for your pets with guides on health, training, nutrition and pet products." },
      { slug: "relationships", sort: 9, name: "Relationships", desc: "Communication, dating, marriage, conflict resolution and boundaries.", metaTitle: "Relationship Guides", metaDesc: "Build better relationships with guides on communication, dating and conflict resolution." },
      { slug: "parenting", sort: 10, name: "Parenting", desc: "Child development, discipline, education and family activities.", metaTitle: "Parenting Guides", metaDesc: "Navigate parenting with guides on child development, discipline and family life." },
      { slug: "fashion", sort: 11, name: "Fashion", desc: "Style tips, wardrobe essentials, trends and personal styling.", metaTitle: "Fashion Guides", metaDesc: "Elevate your style with guides on wardrobe essentials, trends and personal styling." },
      { slug: "beauty", sort: 12, name: "Beauty", desc: "Skincare, haircare, makeup, beauty routines and product reviews.", metaTitle: "Beauty Guides", metaDesc: "Master skincare, haircare and makeup with expert beauty guides and reviews." },
    ],
    "travel": [
      { slug: "destinations", sort: 1, name: "Destinations", desc: "City guides, country overviews, best places and travel itineraries.", metaTitle: "Travel Destination Guides", metaDesc: "Discover the best travel destinations with city guides, itineraries and insider tips." },
      { slug: "travel-planning", sort: 2, name: "Travel Planning", desc: "Trip planning, packing lists, travel apps and booking strategies.", metaTitle: "Travel Planning Guides", metaDesc: "Plan your perfect trip with guides on booking, packing and travel apps." },
      { slug: "hotels", sort: 3, name: "Hotels", desc: "Hotel reviews, booking tips, loyalty programmes and accommodation.", metaTitle: "Hotel Guides", metaDesc: "Find the best hotels with reviews, booking tips and loyalty programme guides." },
      { slug: "flights", sort: 4, name: "Flights", desc: "Cheap flights, airline reviews, airport tips and flight booking.", metaTitle: "Flight Guides", metaDesc: "Find cheap flights and navigate airports with airline reviews and booking tips." },
      { slug: "transportation", sort: 5, name: "Transportation", desc: "Trains, buses, car rentals, ride-sharing and local transport.", metaTitle: "Transportation Guides", metaDesc: "Navigate local transport with guides on trains, buses, car rentals and ride-sharing." },
      { slug: "budget-travel", sort: 6, name: "Budget Travel", desc: "Backpacking, hostels, free activities and money-saving tips.", metaTitle: "Budget Travel Guides", metaDesc: "Travel on a budget with guides on backpacking, hostels and money-saving tips." },
      { slug: "luxury-travel", sort: 7, name: "Luxury Travel", desc: "Five-star hotels, first class, exclusive experiences and resorts.", metaTitle: "Luxury Travel Guides", metaDesc: "Experience luxury travel with guides on five-star hotels, first class and exclusive resorts." },
      { slug: "visa-immigration", sort: 8, name: "Visa & Immigration", desc: "Visa applications, passport renewal, immigration rules and documents.", metaTitle: "Visa & Immigration Guides", metaDesc: "Navigate visa applications, passport renewal and immigration requirements." },
      { slug: "travel-safety", sort: 9, name: "Travel Safety", desc: "Travel insurance, health precautions, scam awareness and emergency.", metaTitle: "Travel Safety Guides", metaDesc: "Stay safe while travelling with guides on insurance, health and scam awareness." },
      { slug: "adventure-travel", sort: 10, name: "Adventure Travel", desc: "Hiking, diving, safaris, extreme sports and outdoor adventures.", metaTitle: "Adventure Travel Guides", metaDesc: "Find your next adventure with guides on hiking, diving, safaris and extreme sports." },
      { slug: "food-culture", sort: 11, name: "Food & Culture", desc: "Local cuisine, food tours, cultural experiences and festivals.", metaTitle: "Food & Culture Travel Guides", metaDesc: "Experience local cuisine, food tours, cultural traditions and festivals." },
    ],
  };

  // Map old category slugs to correct ones in DB
  const catSlugMap: Record<string, string> = {
    "education": "education",  // may be "education-learning" in DB
  };

  let totalSubs = 0;
  for (const [catSlug, subs] of Object.entries(taxonomy)) {
    // Find category ID - try exact match first, then alternative
    let catId = catMap[catSlug];
    if (!catId && catSlug === "education") catId = catMap["education-learning"];
    if (!catId) {
      console.log(`  ⚠ Category '${catSlug}' not found, skipping`);
      continue;
    }

    for (const sub of subs) {
      // Insert subcategory (ON CONFLICT skip)
      const { data: existing } = await sb.from("subcategories").select("id").eq("slug", sub.slug).single();
      if (existing) {
        totalSubs++;
        continue;
      }

      const { data: newSub, error: subErr } = await sb.from("subcategories").insert({
        slug: sub.slug,
        category_id: catId,
        sort_order: sub.sort,
      }).select("id").single();

      if (subErr) {
        console.log(`  ✗ ${sub.slug}: ${subErr.message}`);
        continue;
      }

      // Insert translation
      await sb.from("subcategory_translations").insert({
        subcategory_id: newSub.id,
        language_code: "en",
        name: sub.name,
        description: sub.desc,
        meta_title: sub.metaTitle,
        meta_description: sub.metaDesc,
      });

      totalSubs++;
    }
    console.log(`  ✓ ${catSlug}: subcategories seeded`);
  }
  console.log(`\n  Total subcategories: ${totalSubs}`);

  // ─── Part 2: Seed Entity Type "Programming Language" ───
  console.log("\n--- Part 2: Seeding Entity Type Blueprint ---");

  // Check if already exists
  let { data: et } = await sb.from("entity_types").select("id").eq("slug", "programming-language").single();
  if (!et) {
    const { data: newEt } = await sb.from("entity_types").insert({ slug: "programming-language" }).select("id").single();
    et = newEt;
    await sb.from("entity_type_translations").insert({
      entity_type_id: et!.id,
      language_code: "en",
      name: "Programming Language",
      description: "Complete knowledge blueprint for any programming language — from basics to advanced patterns.",
    });
    console.log("  ✓ Entity Type created:", et!.id);
  } else {
    console.log("  Entity Type already exists:", et.id);
  }

  // Seed full blueprint: 5 sections, 15 slots
  const blueprint = [
    { slug: "foundations", sort: 1, name: "Foundations", desc: "Getting started — installation, syntax, and first programs.", slots: [
      { slug: "introduction", sort: 1, title: "Introduction", desc: "What the language is, its history, and where it is used." },
      { slug: "installation", sort: 2, title: "Installation & Setup", desc: "How to install, configure IDE, and run your first program." },
      { slug: "syntax-basics", sort: 3, title: "Syntax Basics", desc: "Basic syntax, statements, comments, and code structure." },
    ]},
    { slug: "core-concepts", sort: 2, name: "Core Concepts", desc: "Essential language features every developer must know.", slots: [
      { slug: "variables-types", sort: 1, title: "Variables & Data Types", desc: "Declaring variables, primitive types, and type system." },
      { slug: "functions", sort: 2, title: "Functions", desc: "Defining, calling, parameters, return values, and scope." },
      { slug: "control-flow", sort: 3, title: "Control Flow", desc: "If/else, loops, switch, and flow control patterns." },
      { slug: "oop", sort: 4, title: "Object-Oriented Programming", desc: "Classes, objects, inheritance, polymorphism, and encapsulation." },
      { slug: "modules-packages", sort: 5, title: "Modules & Packages", desc: "Code organization, imports, and package management." },
    ]},
    { slug: "advanced", sort: 3, name: "Advanced", desc: "Advanced patterns for production-quality code.", slots: [
      { slug: "async-programming", sort: 1, title: "Async Programming", desc: "Concurrency, async/await, threads, and parallel execution." },
      { slug: "error-handling", sort: 2, title: "Error Handling", desc: "Exceptions, try/catch, custom errors, and defensive coding." },
      { slug: "performance", sort: 3, title: "Performance", desc: "Profiling, optimization, memory management, and benchmarks." },
    ]},
    { slug: "testing-quality", sort: 4, name: "Testing & Quality", desc: "Ensuring code correctness and maintainability.", slots: [
      { slug: "unit-testing", sort: 1, title: "Unit Testing", desc: "Writing tests, test frameworks, mocking, and TDD." },
      { slug: "debugging", sort: 2, title: "Debugging", desc: "Debugger tools, logging, common bugs, and troubleshooting." },
    ]},
    { slug: "ecosystem", sort: 5, name: "Ecosystem & Tools", desc: "Libraries, frameworks, and community resources.", slots: [
      { slug: "popular-frameworks", sort: 1, title: "Popular Frameworks", desc: "Major frameworks and libraries in the ecosystem." },
      { slug: "best-practices", sort: 2, title: "Best Practices", desc: "Style guides, conventions, and production patterns." },
    ]},
  ];

  // Check if sections already exist for this entity type
  const { count: existingSecs } = await sb.from("entity_type_sections").select("*", { count: "exact", head: true }).eq("entity_type_id", et!.id);
  if (existingSecs && existingSecs > 0) {
    console.log("  Blueprint already seeded:", existingSecs, "sections — skipping");
  } else {
    let sectionCount = 0;
    let slotCount = 0;
    for (const sec of blueprint) {
      const { data: newSec } = await sb.from("entity_type_sections").insert({
        entity_type_id: et!.id,
        slug: sec.slug,
        sort_order: sec.sort,
      }).select("id").single();

      await sb.from("entity_type_section_translations").insert({
        section_id: newSec!.id,
        language_code: "en",
        name: sec.name,
        description: sec.desc,
      });
      sectionCount++;

      for (const slot of sec.slots) {
        const { data: newSlot } = await sb.from("entity_type_slots").insert({
          section_id: newSec!.id,
          entity_type_id: et!.id,
          slug: slot.slug,
          sort_order: slot.sort,
        }).select("id").single();

        await sb.from("entity_type_slot_translations").insert({
          slot_id: newSlot!.id,
          language_code: "en",
          title: slot.title,
          description: slot.desc,
        });
        slotCount++;
      }
    }
    console.log(`  ✓ Blueprint seeded: ${sectionCount} sections, ${slotCount} slots`);
  }

  // ─── Part 3: Verify ───
  console.log("\n--- Verification ---");
  const { count: catCount } = await sb.from("categories").select("*", { count: "exact", head: true });
  console.log(`  Categories: ${catCount}`);
  const { count: subCount } = await sb.from("subcategories").select("*", { count: "exact", head: true });
  console.log(`  Subcategories: ${subCount}`);
  const { count: etCount } = await sb.from("entity_types").select("*", { count: "exact", head: true });
  console.log(`  Entity Types: ${etCount}`);
  const { count: secCount2 } = await sb.from("entity_type_sections").select("*", { count: "exact", head: true }).eq("entity_type_id", et!.id);
  console.log(`  Blueprint Sections: ${secCount2}`);
  const { count: slotCount2 } = await sb.from("entity_type_slots").select("*", { count: "exact", head: true }).eq("entity_type_id", et!.id);
  console.log(`  Blueprint Slots: ${slotCount2}`);

  console.log("\n=== Phase 3 Seed Complete ===");
}

main().catch((e) => console.error("FATAL:", e.message));
