import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveJavaScriptFundamentals() {
  console.log("Improving JavaScript Fundamentals knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "JavaScript is a high-level, interpreted programming language primarily used for web development.",
        fact_type: "definition",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "programming", "web-development"],
      },
      {
        statement: "JavaScript was created by Brendan Eich in 1995 for Netscape Navigator.",
        fact_type: "historical",
        confidence: "high",
        domain: "Programming Languages",
        scope: "contextual",
        tags: ["javascript", "history", "brendan-eich"],
      },
      {
        statement: "JavaScript runs in web browsers and can also be used server-side with Node.js.",
        fact_type: "property",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "browsers", "nodejs"],
      },
      {
        statement: "JavaScript is dynamically typed and variables can hold values of any type.",
        fact_type: "property",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "types", "dynamic-typing"],
      },
      
      // Variables and Scope
      {
        statement: "JavaScript uses let and const for block-scoped variables, replacing var for modern code.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "variables", "let", "const"],
      },
      {
        statement: "let declares variables that can be reassigned, while const declares constants that cannot be reassigned.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "variables", "let", "const"],
      },
      {
        statement: "JavaScript has function scope and block scope, with let and const being block-scoped.",
        fact_type: "property",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "scope", "block-scope"],
      },
      
      // Data Types
      {
        statement: "JavaScript has primitive data types: string, number, boolean, null, undefined, symbol, and bigint.",
        fact_type: "property",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "data-types", "primitives"],
      },
      {
        statement: "JavaScript objects are collections of key-value pairs and are reference types.",
        fact_type: "definition",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "objects", "reference-types"],
      },
      {
        statement: "JavaScript arrays are ordered lists that can hold mixed data types and are objects with numeric indices.",
        fact_type: "definition",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "arrays", "data-structures"],
      },
      
      // Operators
      {
        statement: "JavaScript supports arithmetic operators: +, -, *, /, %, ** for exponentiation.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "operators", "arithmetic"],
      },
      {
        statement: "JavaScript supports comparison operators: ==, ===, !=, !==, >, <, >=, <=",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "operators", "comparison"],
      },
      {
        statement: "JavaScript uses === for strict equality (type and value) and == for loose equality (value only).",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "operators", "equality"],
      },
      {
        statement: "JavaScript supports logical operators: && (AND), || (OR), ! (NOT).",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "operators", "logical"],
      },
      
      // Control Flow
      {
        statement: "JavaScript uses if, else if, and else statements for conditional execution.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "conditionals", "if-else"],
      },
      {
        statement: "JavaScript uses switch statements for multiple conditional branches based on a single value.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "conditionals", "switch"],
      },
      {
        statement: "JavaScript supports for loops, while loops, and do-while loops for iteration.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "loops", "iteration"],
      },
      {
        statement: "JavaScript supports for...of loops for iterating over arrays and for...in loops for iterating over object properties.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "loops", "for-of", "for-in"],
      },
      {
        statement: "JavaScript uses break to exit loops and continue to skip to the next iteration.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "loops", "break", "continue"],
      },
      
      // Functions
      {
        statement: "JavaScript functions are defined using the function keyword or as arrow functions with => syntax.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "functions", "arrow-functions"],
      },
      {
        statement: "JavaScript arrow functions provide concise syntax and lexically bind the this keyword.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "functions", "arrow-functions", "this"],
      },
      {
        statement: "JavaScript functions can have default parameter values and rest parameters using ... syntax.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "functions", "parameters"],
      },
      {
        statement: "JavaScript functions return undefined by default if no return statement is provided.",
        fact_type: "property",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "functions", "return"],
      },
      
      // Objects
      {
        statement: "JavaScript objects are created using object literals {} or the new keyword with constructors.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "objects", "literals"],
      },
      {
        statement: "JavaScript object properties can be accessed using dot notation (obj.property) or bracket notation (obj['property']).",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "objects", "property-access"],
      },
      {
        statement: "JavaScript supports object destructuring to extract properties into variables.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "objects", "destructuring"],
      },
      
      // Arrays
      {
        statement: "JavaScript arrays support methods like push(), pop(), shift(), unshift(), map(), filter(), and reduce().",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "arrays", "methods"],
      },
      {
        statement: "JavaScript array methods map() and filter() return new arrays without modifying the original.",
        fact_type: "property",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "arrays", "functional-methods"],
      },
      {
        statement: "JavaScript supports array destructuring to extract elements into variables.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "arrays", "destructuring"],
      },
      
      // DOM Manipulation
      {
        statement: "JavaScript can access and manipulate HTML elements using the DOM (Document Object Model).",
        fact_type: "property",
        confidence: "high",
        domain: "Web Development",
        scope: "contextual",
        tags: ["javascript", "dom", "html"],
      },
      {
        statement: "JavaScript uses document.getElementById() and document.querySelector() to select HTML elements.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Web Development",
        scope: "contextual",
        tags: ["javascript", "dom", "selectors"],
      },
      {
        statement: "JavaScript can modify element content using innerHTML, textContent, and innerText properties.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Web Development",
        scope: "contextual",
        tags: ["javascript", "dom", "manipulation"],
      },
      {
        statement: "JavaScript can add, remove, and toggle CSS classes using classList methods.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Web Development",
        scope: "contextual",
        tags: ["javascript", "dom", "css-classes"],
      },
      
      // Events
      {
        statement: "JavaScript responds to user interactions using event listeners like addEventListener().",
        fact_type: "instruction",
        confidence: "high",
        domain: "Web Development",
        scope: "contextual",
        tags: ["javascript", "events", "event-handlers"],
      },
      {
        statement: "JavaScript common events include click, submit, change, keydown, and load.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Web Development",
        scope: "contextual",
        tags: ["javascript", "events", "event-types"],
      },
      
      // Async Patterns
      {
        statement: "JavaScript uses Promises for asynchronous operations and to handle values that may not be available yet.",
        fact_type: "definition",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "async", "promises"],
      },
      {
        statement: "JavaScript async/await provides syntactic sugar for working with Promises in a synchronous-looking manner.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "async", "async-await"],
      },
      {
        statement: "JavaScript fetch() API is used to make HTTP requests and returns Promises.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Web Development",
        scope: "contextual",
        tags: ["javascript", "http", "fetch-api"],
      },
      
      // Error Handling
      {
        statement: "JavaScript uses try-catch-finally blocks to handle errors and exceptions.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "error-handling", "try-catch"],
      },
      {
        statement: "JavaScript can throw custom errors using the throw keyword with Error objects.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "error-handling", "throw"],
      },
      
      // Modern ES6+ Features
      {
        statement: "JavaScript template literals use backticks and support string interpolation with ${} syntax.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "strings", "template-literals"],
      },
      {
        statement: "JavaScript spread operator (...) expands iterables into individual elements.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "operators", "spread-operator"],
      },
      {
        statement: "JavaScript modules use import and export statements to organize code into reusable files.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Programming Languages",
        scope: "universal",
        tags: ["javascript", "modules", "import-export"],
      },
    ],
  };

  try {
    const response = await fetch(`${BASE_URL}/api/admin/improve-knowledge-package`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
        topic_id: "b447ef95-8357-4269-80d8-e54904a146cf",
        improvements,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("=== IMPROVEMENT COMPLETE ===\n");
    console.log(`Facts added: ${data.facts_added}`);
    console.log(`Message: ${data.message}`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

improveJavaScriptFundamentals();
