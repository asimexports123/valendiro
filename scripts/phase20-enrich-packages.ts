import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const validationTopics = JSON.parse(readFileSync(resolve(__dirname, "phase20-validation-topics.json"), "utf-8"));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const enrichedContent = {
  "nutrition-fundamentals": {
    coreConcepts: "Nutrition is the science of how food affects the body. Key concepts include macronutrients, micronutrients, and energy balance.",
    mentalModels: "Think of your body as an engine - food is fuel. Premium fuel makes the engine run efficiently.",
    analogies: "Nutrition is like building a house - macronutrients are bricks, micronutrients are nails and screws.",
    historicalContext: "Nutrition science evolved from discovering vitamins (early 1900s) to understanding molecular nutrition today.",
    applications: "Sports performance, disease prevention, weight management, healthy aging, mental health support.",
  },
  "budget-travel-strategies": {
    coreConcepts: "Budget travel maximizes experiences while minimizing costs through strategic planning and flexibility.",
    mentalModels: "Think of travel budgeting as a pie chart - allocate more to experiences (memories) and less to conveniences.",
    analogies: "Budget travel is like backpacking vs. luxury cruise - both reach the destination, but one offers more adventure.",
    historicalContext: "Budget travel gained popularity with backpacking culture in the 1960s and digital nomad movement in 2000s.",
    applications: "Gap years, student travel, career breaks, family vacations, digital nomad lifestyle.",
  },
  "python-programming-fundamentals": {
    coreConcepts: "Python is a high-level, interpreted programming language that emphasizes code readability. Key concepts include dynamic typing and automatic memory management.",
    mentalModels: "Think of Python as a universal translator - you write human-readable code, and Python translates it into machine instructions.",
    analogies: "Python is like writing in English vs. binary code. While C++ is like assembly instructions, Python is like giving clear verbal instructions.",
    historicalContext: "Created by Guido van Rossum in 1991, named after Monty Python. Python 3.0 in 2008.",
    applications: "Web development, Data Science, Machine Learning, Automation, Scientific computing.",
  },
  "cloud-computing-fundamentals": {
    coreConcepts: "Cloud computing delivers computing services over the internet. Key concepts include IaaS, PaaS, SaaS, and deployment models.",
    mentalModels: "Cloud computing is like electricity - you don't own the power plant, you just plug in and pay for what you use.",
    analogies: "Cloud vs On-premise is like renting vs. owning a house. Renting offers flexibility, owning offers control.",
    historicalContext: "Cloud computing evolved from mainframe time-sharing (1960s) to AWS launching EC2 (2006).",
    applications: "Web hosting, data storage, machine learning, mobile app backends, disaster recovery.",
  },
  "typescript-language": {
    coreConcepts: "TypeScript is JavaScript with static typing. Key concepts include type annotations, interfaces, generics, and compile-time error checking.",
    mentalModels: "TypeScript is like a spell-checker for code - catches errors before you run the program.",
    analogies: "JavaScript is like writing without spell-check. TypeScript is like writing with spell-check and grammar checking.",
    historicalContext: "Created by Microsoft in 2012, TypeScript gained adoption with Angular 2.0 (2016) and became mainstream by 2018.",
    applications: "Large-scale applications, enterprise software, teams with multiple developers, projects requiring type safety.",
  },
  "cryptocurrency-fundamentals": {
    coreConcepts: "Cryptocurrency is digital currency using cryptography for security. Key concepts include blockchain, decentralization, mining, and wallets.",
    mentalModels: "Cryptocurrency is like digital gold - scarce, divisible, and transferable without intermediaries.",
    analogies: "Crypto is like email for money - anyone can send it anywhere, instantly, without asking permission from a bank.",
    historicalContext: "Bitcoin created by Satoshi Nakamoto in 2009. Ethereum launched 2015 with smart contracts. 2017 saw the first major crypto boom.",
    applications: "Cross-border payments, investment, decentralized finance (DeFi), NFTs, smart contracts.",
  },
  "software-testing": {
    coreConcepts: "Software testing verifies that software meets requirements and is bug-free. Key concepts include unit testing, integration testing, and test automation.",
    mentalModels: "Testing is like quality control in manufacturing - catch defects before products reach customers.",
    analogies: "Testing is like proofreading an essay - catch errors before publication, not after readers see it.",
    historicalContext: "Testing evolved from manual debugging (1950s) to automated testing frameworks (2000s) and DevOps integration today.",
    applications: "Quality assurance, bug prevention, regression testing, performance validation, security testing.",
  },
  "operating-systems": {
    coreConcepts: "Operating systems manage computer hardware and software resources. Key concepts include process management, memory management, file systems, and I/O.",
    mentalModels: "OS is like a traffic cop - manages which programs get CPU time, memory, and access to devices.",
    analogies: "OS is like a restaurant manager - coordinates kitchen (CPU), tables (memory), and waitstaff (I/O) to serve customers efficiently.",
    historicalContext: "First OS in 1950s for mainframes. Unix (1969) influenced modern OSes. Windows (1985) and Linux (1991) dominated personal computing.",
    applications: "Desktop computing, mobile devices, servers, embedded systems, real-time systems.",
  },
  "investing-basics": {
    coreConcepts: "Investing is allocating money to generate returns. Key concepts include compound interest, risk vs. return, diversification, and asset allocation.",
    mentalModels: "Investing is like planting seeds - you give up consumption now for growth later. Time is your biggest ally.",
    analogies: "Investing vs. Saving is like planting a tree vs. storing grain. Savings preserve value, investing grows value.",
    historicalContext: "Modern investing began with stock exchanges (1600s). Index funds pioneered by Vanguard (1976). Passive investing gained prominence in 2000s.",
    applications: "Retirement planning, wealth building, financial independence, education funding, emergency fund growth.",
  },
  "javascript-fundamentals": {
    coreConcepts: "JavaScript is a dynamic, weakly-typed programming language primarily for web browsers. Key concepts include closures, prototypes, asynchronous programming.",
    mentalModels: "JavaScript is the brain of the web. HTML is skeleton, CSS is skin, JS is nervous system.",
    analogies: "JavaScript is like the engine of a car - makes it move and respond to driver input.",
    historicalContext: "Created by Brendan Eich in 1995. ES6 (2015) was a major update.",
    applications: "Frontend web development, Backend (Node.js), Mobile apps, Desktop apps.",
  },
  "project-management-fundamentals": {
    coreConcepts: "Project management delivers projects within scope, time, and budget. Key concepts include planning, scheduling, resource allocation, and stakeholder management.",
    mentalModels: "Project management is like conducting an orchestra - coordinating different sections to create harmony.",
    analogies: "Project management is like planning a road trip - map the route, budget gas money, schedule stops, and handle detours.",
    historicalContext: "PM formalized with Gantt charts (1910s) and PMP certification (1984s). Agile manifesto (2001) revolutionized software project management.",
    applications: "Software development, construction, marketing campaigns, product launches, organizational change initiatives.",
  },
  "retirement-planning-fundamentals": {
    coreConcepts: "Retirement planning ensures financial security after work. Key concepts include savings rate, investment returns, Social Security, and healthcare costs.",
    mentalModels: "Retirement planning is like building a bridge - start early, use strong materials, and ensure it spans the entire gap.",
    analogies: "Retirement savings is like filling a swimming pool with a garden hose - start early and be consistent.",
    historicalContext: "Modern retirement planning emerged with Social Security (1935) and 401(k) plans (1978). FIRE movement gained popularity in 2010s.",
    applications: "Early retirement planning, 401(k) optimization, pension management, healthcare planning, estate planning.",
  },
  "computer-networks": {
    coreConcepts: "Computer networks enable communication between devices. Key concepts include protocols (TCP/IP), routing, switching, and network topologies.",
    mentalModels: "Networks are like postal systems - addresses determine delivery, protocols ensure proper handling, routers act like post offices.",
    analogies: "Internet is like a global phone network - every device has a number (IP), and calls (packets) are routed through exchanges.",
    historicalContext: "ARPANET (1969) was the first network. TCP/IP standardized in 1983. World Wide Web launched 1991.",
    applications: "Internet connectivity, corporate networks, cloud services, IoT, data centers.",
  },
  "cybersecurity-fundamentals": {
    coreConcepts: "Cybersecurity protects systems and data from attacks. Key concepts include confidentiality, integrity, availability, and threat mitigation.",
    mentalModels: "Cybersecurity is like home security - locks, alarms, cameras, and vigilance keep intruders out.",
    analogies: "Security is like immune system - multiple layers of defense, constantly adapting to new threats.",
    historicalContext: "First computer virus (1971). Firewalls emerged in 1980s. Cybersecurity became critical with internet adoption (1990s).",
    applications: "Data protection, network security, application security, identity management, compliance.",
  },
  "fitness-fundamentals": {
    coreConcepts: "Fitness improves physical health through exercise. Key concepts include cardio, strength training, flexibility, and progressive overload.",
    mentalModels: "Fitness is like banking - deposits (exercise) build balance, withdrawals (inactivity) deplete it. Consistency matters more than intensity.",
    analogies: "Building fitness is like building muscle - requires stress (exercise), recovery (rest), and time to see results.",
    historicalContext: "Modern fitness culture emerged with bodybuilding (1970s), aerobics (1980s), and functional training (2000s). Wearables revolutionized tracking in 2010s.",
    applications: "Weight management, disease prevention, athletic performance, mental health, healthy aging.",
  },
  "go-programming-language": {
    coreConcepts: "Go is a statically typed language designed for simplicity and concurrency. Key concepts include goroutines, channels, and garbage collection.",
    mentalModels: "Go is like a well-organized toolbox - simple tools that work together efficiently.",
    analogies: "Go is like a Swiss Army knife - simple, reliable, and good at many things without being specialized.",
    historicalContext: "Created at Google in 2009 by Rob Pike, Ken Thompson. Designed to solve Google's scaling problems.",
    applications: "Cloud infrastructure (Kubernetes), microservices, network programming, DevOps tools, distributed systems.",
  },
  "restful-apis": {
    coreConcepts: "RESTful APIs use HTTP methods to access web resources. Key concepts include resources, HTTP verbs, statelessness, and JSON responses.",
    mentalModels: "REST is like a restaurant menu - you order items (resources) using standard actions (GET, POST, PUT, DELETE).",
    analogies: "REST API is like a vending machine - press buttons (endpoints) to get items (resources) with standard operations.",
    historicalContext: "REST defined by Roy Fielding in 2000. Became dominant API design in 2010s with mobile and web apps.",
    applications: "Web services, mobile app backends, microservices communication, third-party integrations.",
  },
  "nextjs-framework": {
    coreConcepts: "Next.js is a React framework for production. Key concepts include server-side rendering, static generation, API routes, and file-based routing.",
    mentalModels: "Next.js is like a pre-fabricated house - React provides the design, Next.js provides the structure and utilities.",
    analogies: "React is like LEGO bricks, Next.js is like pre-assembled LEGO sets with instructions for specific builds.",
    historicalContext: "Created by Vercel in 2016. Gained popularity with Next.js 9 (2019) and 13 (2022) introducing app router.",
    applications: "Production web apps, e-commerce sites, marketing pages, SaaS applications, blogs.",
  },
  "algorithms-fundamentals": {
    coreConcepts: "Algorithms are step-by-step procedures for solving problems. Key concepts include time complexity, space complexity, sorting, and searching.",
    mentalModels: "Algorithms are like recipes - follow steps in order to produce consistent results. Quality matters for efficiency.",
    analogies: "Algorithm efficiency is like cooking speed - some recipes take 10 minutes, others take hours for the same meal.",
    historicalContext: "Algorithms date to ancient mathematics (Euclid's algorithm). Computer science formalized algorithms in 1900s.",
    applications: "Data processing, search engines, route optimization, machine learning, cryptography.",
  },
  "entrepreneurship-fundamentals": {
    coreConcepts: "Entrepreneurship is creating value through new businesses. Key concepts include value proposition, market validation, business models, and scaling.",
    mentalModels: "Entrepreneurship is like surfing - catch the wave (market opportunity), maintain balance, and ride it as long as possible.",
    analogies: "Startup is like planting a tree - needs right conditions (market), care (execution), and time to grow.",
    historicalContext: "Entrepreneurship evolved from merchant trade to Silicon Valley startups. Lean Startup methodology emerged in 2000s.",
    applications: "Starting companies, innovation within organizations, social entrepreneurship, product development.",
  },
  "business-strategy-fundamentals": {
    coreConcepts: "Business strategy guides long-term decisions. Key concepts include competitive advantage, market positioning, resource allocation, and differentiation.",
    mentalModels: "Strategy is like chess - think several moves ahead, anticipate opponents, and position pieces for advantage.",
    analogies: "Strategy is like a GPS - set destination, plan route, and adjust when roadblocks appear.",
    historicalContext: "Strategic thinking evolved from military strategy (Sun Tzu) to business strategy (Porter 1980s).",
    applications: "Market entry, competitive positioning, growth planning, resource optimization, M&A decisions.",
  },
  "data-structures": {
    coreConcepts: "Data structures organize data for efficient access. Key concepts include arrays, linked lists, trees, graphs, and hash tables.",
    mentalModels: "Data structures are like different storage systems - closet (array), filing cabinet (tree), warehouse (database).",
    analogies: "Choosing data structure is like choosing container - bowl for soup, cup for coffee, plate for dinner.",
    historicalContext: "Fundamental structures emerged with early programming (1950s). Advanced structures developed with algorithms research.",
    applications: "Database systems, file systems, caching, search algorithms, memory management.",
  },
  "home-organization-fundamentals": {
    coreConcepts: "Home organization creates efficient living spaces. Key concepts include decluttering, storage systems, daily habits, and maintenance.",
    mentalModels: "Organization is like a library - everything has a designated place, making retrieval easy.",
    analogies: "Organized home is like a well-designed kitchen - tools are where you need them, workflows are smooth.",
    historicalContext: "Home organization became popular with Marie Kondo (2010s) and minimalism movement. Digital tools emerged in 2000s.",
    applications: "Small space living, moving preparation, daily productivity, stress reduction, aesthetic improvement.",
  },
  "mental-health-fundamentals": {
    coreConcepts: "Mental health encompasses emotional, psychological, and social well-being. Key concepts include stress management, resilience, self-care, and seeking help.",
    mentalModels: "Mental health is like a battery - needs regular charging (self-care) and drains with use (stress).",
    analogies: "Mental health is like physical health - requires exercise, nutrition, rest, and regular check-ups.",
    historicalContext: "Mental health understanding evolved from moral treatment (1800s) to modern evidence-based approaches. Stigma reduction gained momentum in 2000s.",
    applications: "Stress management, anxiety reduction, depression prevention, workplace wellness, relationship health.",
  },
  "docker-containers": {
    coreConcepts: "Docker is a platform for developing, shipping, and running applications in containers. Containers are lightweight, portable, and isolated environments.",
    mentalModels: "Docker is like standardized shipping containers for software - works on any system.",
    analogies: "Docker is like a lunchbox - pack everything needed, works anywhere.",
    historicalContext: "Docker released in 2013 by Solomon Hykes. Kubernetes released 2014.",
    applications: "Microservices, CI/CD, Development consistency, Cloud-native applications.",
  },
};

async function enrichKnowledgePackages() {
  console.log("=== Phase 20: Enriching Knowledge Packages ===\n");
  
  let totalEnriched = 0;
  let totalFactsAdded = 0;
  
  for (const topic of validationTopics.selectedTopics) {
    const enrichment = enrichedContent[topic.slug];
    if (!enrichment) {
      console.log(`Skipping ${topic.slug} - no enrichment defined`);
      continue;
    }
    
    console.log(`\nEnriching: ${topic.slug}`);
    
    const { data: packages } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .eq("status", "ready")
      .limit(1);
    
    if (!packages || packages.length === 0) {
      console.log(`  No package found`);
      continue;
    }
    
    const packageId = packages[0].id;
    let factsAdded = 0;
    
    const factTypes = [
      { key: "coreConcepts", type: "definition" },
      { key: "mentalModels", type: "property" },
      { key: "analogies", type: "property" },
      { key: "historicalContext", type: "historical" },
      { key: "applications", type: "property" },
    ];
    
    for (const { key, type } of factTypes) {
      if (enrichment[key]) {
        const { error } = await supabase
          .from("knowledge_facts")
          .insert({
            package_id: packageId,
            statement: enrichment[key],
            fact_type: type,
            confidence: "high",
            domain: "educational",
            scope: "contextual",
            tags: [type, "enriched"],
          });
        
        if (!error) {
          factsAdded++;
          console.log(`  ✓ Added ${type}`);
        } else {
          console.log(`  ✗ Failed ${type}: ${error.message}`);
        }
      }
    }
    
    totalEnriched++;
    totalFactsAdded += factsAdded;
    console.log(`  Added ${factsAdded} facts`);
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Topics enriched: ${totalEnriched}`);
  console.log(`Total facts added: ${totalFactsAdded}`);
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-enrichment-summary.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalEnriched,
      totalFactsAdded,
    }, null, 2)
  );
}

enrichKnowledgePackages().catch(console.error);
