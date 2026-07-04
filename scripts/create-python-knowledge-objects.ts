/**
 * Create High-Quality Knowledge Objects for Python Programming Fundamentals
 *
 * Technology Category Personality: Teach, Build, Debug, Show Code
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the topic
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id')
    .eq('slug', 'python-programming-fundamentals')
    .single();

  if (topicError || !topic) {
    console.error('Error: Topic not found');
    process.exit(1);
  }

  // Get the knowledge package
  const { data: packageData, error: packageError } = await supabase
    .from('knowledge_packages')
    .select('id')
    .eq('topic_id', topic.id)
    .single();

  if (packageError || !packageData) {
    console.error('Error: Knowledge Package not found');
    process.exit(1);
  }

  // High-quality facts for Python Programming Fundamentals
  const facts = [
    // Definitions
    {
      id: uuidv4(),
      statement: "Python is a high-level, interpreted programming language known for its clean syntax and readability, making it ideal for beginners and experts alike.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["programming", "language", "beginner"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Variables in Python are containers for storing data values. Unlike other languages, you don't need to declare variable types - Python determines this automatically.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["variables", "data", "basics"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Functions are reusable blocks of code that perform specific tasks. They help you avoid repeating code and make your programs more organized and easier to debug.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["functions", "code-organization", "reusability"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Lists are ordered, mutable collections in Python that can hold multiple items of different types. They're like arrays in other languages but more flexible.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["lists", "data-structures", "collections"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Dictionaries are key-value pairs in Python, similar to real-world dictionaries where you look up a word (key) to find its definition (value). They're perfect for storing structured data.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["dictionaries", "data-structures", "key-value"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Loops allow you to execute code repeatedly. Python has for loops (for iterating over sequences) and while loops (for repeating while a condition is true).",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["loops", "control-flow", "iteration"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Conditionals (if/elif/else) let your program make decisions based on different conditions. They're the foundation of program logic and control flow.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["conditionals", "control-flow", "logic"],
      domain: "technology",
    },

    // Procedural (How it works)
    {
      id: uuidv4(),
      statement: "To create a variable in Python, simply write the variable name followed by an equals sign and the value: name = 'John'. Python automatically assigns the appropriate data type.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["variables", "syntax", "basics"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "To define a function, use the def keyword followed by the function name and parentheses: def greet(name):. Always end the function definition with a colon and indent the function body.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["functions", "syntax", "definition"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "To create a list, use square brackets with comma-separated values: fruits = ['apple', 'banana', 'orange']. You can access items using index numbers starting from 0.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["lists", "syntax", "data-structures"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "To create a dictionary, use curly braces with key-value pairs: person = {'name': 'John', 'age': 30}. Access values using their keys in square brackets: person['name'].",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["dictionaries", "syntax", "key-value"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "To write a for loop, use the for keyword followed by a variable and the sequence to iterate over: for item in list:. Indent the code you want to repeat.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["loops", "syntax", "iteration"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "To write an if statement, use the if keyword followed by a condition and a colon: if age >= 18:. Always indent the code block that should execute when the condition is true.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["conditionals", "syntax", "logic"],
      domain: "technology",
    },

    // Causal (Why it works)
    {
      id: uuidv4(),
      statement: "Python uses indentation instead of braces to define code blocks because it enforces readable, consistent code structure. This makes Python code naturally more readable than languages with arbitrary brace placement.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["indentation", "code-style", "readability"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Python is dynamically typed because the interpreter determines variable types at runtime. This makes coding faster and more flexible, but it also means type errors only appear when the code runs.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["typing", "dynamic", "runtime"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Functions are essential for debugging because they isolate specific functionality. When something goes wrong, you can test each function individually instead of searching through a massive block of code.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["functions", "debugging", "code-organization"],
      domain: "technology",
    },

    // Property (Characteristics)
    {
      id: uuidv4(),
      statement: "Python is cross-platform, meaning the same Python code runs on Windows, Mac, and Linux without modification. This makes it ideal for developing applications that need to work everywhere.",
      factType: "property",
      confidence: "high",
      scope: "universal",
      tags: ["cross-platform", "portability", "compatibility"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Python has a massive standard library with built-in modules for common tasks like file handling, web requests, and data processing. You rarely need to install external packages for basic operations.",
      factType: "property",
      confidence: "high",
      scope: "universal",
      tags: ["standard-library", "modules", "built-in"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Python is beginner-friendly because its syntax reads like English. Concepts that require complex syntax in other languages (like file reading or web requests) are often one-liners in Python.",
      factType: "property",
      confidence: "high",
      scope: "universal",
      tags: ["beginner-friendly", "syntax", "readability"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Python is slower than compiled languages like C++ because it's interpreted at runtime. However, for most applications, this performance difference is negligible compared to development speed gains.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["performance", "speed", "interpreted"],
      domain: "technology",
    },

    // Rule (Best practices)
    {
      id: uuidv4(),
      statement: "Always use descriptive variable names. Instead of x = 5, use age = 5 or price = 5. This makes your code self-documenting and easier for others (and future you) to understand.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["naming", "readability", "best-practices"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Keep functions small and focused on doing one thing well. If a function is doing multiple unrelated tasks, split it into smaller functions. This makes testing and debugging much easier.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["functions", "code-organization", "best-practices"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Always add docstrings to your functions. A docstring is a brief explanation of what the function does, placed right after the function definition in triple quotes. This helps others understand your code.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["documentation", "functions", "best-practices"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Use list comprehensions instead of for loops when creating new lists from existing ones. They're more Pythonic and often faster: squares = [x**2 for x in numbers].",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["list-comprehensions", "performance", "pythonic"],
      domain: "technology",
    },

    // Warning (Common mistakes)
    {
      id: uuidv4(),
      statement: "Never use mutable default arguments in functions like def add_item(item, items=[]). This creates a shared list across all function calls. Instead, use None and create a new list inside the function.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["functions", "mutable-defaults", "bugs"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Don't modify a list while iterating over it with a for loop. This causes unexpected behavior and skipped items. Create a copy of the list first or iterate over indices instead.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["lists", "iteration", "bugs"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Avoid using single-letter variable names except for loop counters (i, j, k) in simple loops. In production code, descriptive names prevent confusion and make debugging easier.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["naming", "readability", "maintenance"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Don't ignore indentation errors. Python is strict about indentation, and inconsistent spacing will cause your program to fail. Always use 4 spaces (not tabs) for consistency.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["indentation", "syntax-errors", "best-practices"],
      domain: "technology",
    },

    // Comparison (Python vs others)
    {
      id: uuidv4(),
      statement: "Python vs JavaScript: Python is better for data science, machine learning, and backend development due to its extensive libraries. JavaScript is essential for frontend web development and Node.js backends.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["python", "javascript", "comparison"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Python vs Java: Python is simpler to write and read, with less boilerplate code. Java is faster and more strictly typed, making it better for large enterprise applications where performance and type safety are critical.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["python", "java", "comparison"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Python vs C++: C++ is much faster and gives you low-level memory control, but requires manual memory management. Python is slower but handles memory automatically, making it safer and faster to develop with.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["python", "cpp", "comparison"],
      domain: "technology",
    },

    // Historical (Context)
    {
      id: uuidv4(),
      statement: "Python was created by Guido van Rossum in 1991 and named after the British comedy series 'Monty Python's Flying Circus', not the snake. This reflects its fun, approachable design philosophy.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["history", "guido-van-rossum", "origin"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Python 2 was the dominant version for many years, but Python 3 (released in 2008) introduced major improvements and is now the standard. Python 2 reached end-of-life in 2020 and is no longer supported.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["python-3", "version-history", "migration"],
      domain: "technology",
    },
  ];

  console.log(`Creating ${facts.length} Knowledge Objects for Python Programming Fundamentals...`);

  // Insert knowledge facts
  let created = 0;
  let errors = 0;

  for (const fact of facts) {
    const { error: insertError } = await supabase
      .from('knowledge_facts')
      .insert({
        id: fact.id,
        package_id: packageData.id,
        statement: fact.statement,
        fact_type: fact.factType,
        confidence: fact.confidence,
        domain: fact.domain,
        scope: fact.scope,
        tags: fact.tags,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`Error inserting fact: ${insertError.message}`);
      errors++;
    } else {
      created++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Created: ${created}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${facts.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
