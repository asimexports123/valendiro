/**
 * Insert realistic test content to demonstrate full pipeline execution
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function insertTestContent() {
  console.log("Inserting realistic test content...");

  const { data: sources } = await supabase
    .from("discovery_sources")
    .select("id")
    .eq("name", "MDN Web Docs")
    .single();

  if (!sources) {
    console.log("MDN source not found");
    return;
  }

  const testArticles = [
    {
      title: "JavaScript Async/Await: A Complete Guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
      content: "JavaScript async/await is a powerful feature that makes working with asynchronous code easier. Async functions return a Promise, and the await keyword pauses execution until the Promise resolves. This approach is cleaner than using .then() chains and makes error handling with try/catch straightforward. Async/await is built on top of Promises and is supported in all modern browsers and Node.js. When you use async, the function always returns a Promise. The await keyword can only be used inside async functions.",
      published_at: new Date().toISOString(),
    },
    {
      title: "React Hooks: useState and useEffect Explained",
      url: "https://react.dev/reference/react",
      content: "React Hooks are functions that let you hook into React state and lifecycle features from function components. useState lets you add React state to function components. useEffect lets you perform side effects in function components. Hooks can only be called at the top level of your React function. Don't call Hooks inside loops, conditions, or nested functions. By following this rule, you ensure that Hooks are called in the same order each time a component renders. This is what allows React to correctly preserve the state of Hooks between multiple useState and useEffect calls.",
      published_at: new Date().toISOString(),
    },
    {
      title: "Node.js Event Loop Explained",
      url: "https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick",
      content: "The Node.js event loop is what allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded. The event loop is responsible for executing the code, collecting and processing events, and executing queued sub-tasks. When Node.js starts, it initializes the event loop, processes the provided input script, and then begins processing the asynchronous requests. The event loop has six phases: timers, pending callbacks, idle/prepare, poll, check, and close callbacks. Understanding the event loop is crucial for writing efficient Node.js applications.",
      published_at: new Date().toISOString(),
    },
    {
      title: "Docker Containerization for Developers",
      url: "https://docs.docker.com/get-started/",
      content: "Docker is a platform for developing, shipping, and running applications in containers. Containers are lightweight, standalone packages that include everything needed to run an application. Docker containers can run anywhere, on any machine, and in any cloud environment. The key benefits of Docker include consistency across environments, faster deployment, resource efficiency, and isolation. Docker images are built from Dockerfiles, which contain instructions for creating the image. Docker Compose allows you to define and run multi-container Docker applications.",
      published_at: new Date().toISOString(),
    },
    {
      title: "TypeScript for JavaScript Developers",
      url: "https://www.typescriptlang.org/docs/",
      content: "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. TypeScript adds optional static typing, classes, and interfaces to JavaScript. This helps catch errors early during development and provides better tooling support. TypeScript supports all JavaScript features and adds additional features like type annotations, interfaces, enums, and generics. The TypeScript compiler (tsc) converts TypeScript code to JavaScript that can run in any browser or Node.js environment. TypeScript is especially useful for large-scale applications.",
      published_at: new Date().toISOString(),
    },
  ];

  for (const article of testArticles) {
    const contentHash = generateContentHash(article.title + article.content);
    
    await supabase
      .from("discovered_content")
      .insert({
        source_id: sources.id,
        title: article.title,
        url: article.url,
        content_summary: article.content.substring(0, 200),
        content_full: article.content,
        published_at: article.published_at,
        status: "pending",
        content_hash: contentHash,
        trust_score: 0.80,
        freshness_score: 1.0,
        authority_score: 0.90,
        originality_score: 0.85,
        spam_score: 0.00,
      });
    
    console.log(`✓ Inserted: ${article.title}`);
  }

  console.log("\nDone");
}

function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

insertTestContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
