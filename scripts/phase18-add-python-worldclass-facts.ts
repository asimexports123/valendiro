/**
 * Phase 18: Add World-Class Knowledge Facts for Python Programming Fundamentals
 *
 * Adding mental models, analogies, runnable code examples with outputs,
 * debugging tips, FAQs, continue learning paths, and decision frameworks
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

  // World-class additional facts
  const facts = [
    // Mental Models
    {
      id: uuidv4(),
      statement: "Think of Python as a language that reads like English. When you read Python code, you're essentially reading sentences that the computer understands. This makes Python intuitive for beginners because you can guess what code does just by reading it.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "readability", "beginner"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Think of variables as labeled storage boxes. When you write 'age = 25', you're putting the number 25 in a box labeled 'age'. You can always look inside the box to see what's stored there, and you can change what's inside.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "variables", "beginner"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Think of functions as reusable recipes. A function is like a recipe for making a dish - you follow the instructions (the code inside the function) to get a result. You can use the recipe as many times as you want without rewriting it.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "functions", "reusability"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Think of lists as shopping lists with items in order. Just like a shopping list has items in a specific order and you can add or remove items, Python lists keep items in sequence and let you modify them.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "lists", "ordered"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Think of dictionaries as phone books. You look up a name (the key) to find a number (the value). Just like a phone book lets you find information by name, Python dictionaries let you find values using their keys.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "dictionaries", "key-value"],
      domain: "technology",
    },

    // Analogies (mapped to causal to explain why these comparisons work)
    {
      id: uuidv4(),
      statement: "Variables are like labeled storage boxes because they store data that you can access later using a name. This mental model helps you understand that variables are containers for information, not the information itself.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["analogy", "variables", "storage"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Functions are like reusable recipes because they contain instructions that can be followed repeatedly to produce consistent results. This explains why functions reduce code duplication and make programs more maintainable.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["analogy", "functions", "reusability"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Lists are like shopping lists with items in order because both maintain a specific sequence of items that can be added, removed, or accessed by position. This analogy helps explain why lists preserve order and support item-by-item processing.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["analogy", "lists", "ordered"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Dictionaries are like phone books because both use a lookup system where you search for a key to find associated information. This explains why dictionaries use key-value pairs and provide fast access to values.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["analogy", "dictionaries", "lookup"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Loops are like repeating a task for each item because they execute the same code block for every element in a collection. This analogy explains why loops are useful for processing lists, applying operations to multiple items, and avoiding repetitive code.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["analogy", "loops", "iteration"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Conditionals are like traffic lights because they control program flow based on conditions, just as traffic lights control vehicle flow based on signals. This analogy helps explain why conditionals make decisions and branch code execution.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["analogy", "conditionals", "decisions"],
      domain: "technology",
    },

    // Runnable Code Examples with Outputs
    {
      id: uuidv4(),
      statement: "Hello World example: print('Hello, World!') outputs: Hello, World!. This is the traditional first program in any language and demonstrates how to output text to the screen.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["code-example", "output", "beginner"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Variable assignment with print: name = 'John'; print(name) outputs: John. This shows how to store data in a variable and then display it. The output is the value stored in the variable.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["code-example", "output", "variables"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Function definition and call: def greet(name): return f'Hello, {name}!'; print(greet('Alice')) outputs: Hello, Alice!. This demonstrates creating a function, passing an argument, and receiving the return value.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["code-example", "output", "functions"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "List creation and iteration: fruits = ['apple', 'banana']; for fruit in fruits: print(fruit) outputs: apple then banana. This shows creating a list and looping through each item to display it.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["code-example", "output", "lists"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Dictionary operations: person = {'name': 'John', 'age': 30}; print(person['name']) outputs: John. This demonstrates creating a dictionary and accessing values using their keys.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["code-example", "output", "dictionaries"],
      domain: "technology",
    },

    // Debugging Tips
    {
      id: uuidv4(),
      statement: "Common syntax error: Missing colon after if/def/for/while. Error: 'SyntaxError: invalid syntax'. Fix: Always add a colon (:) at the end of if statements, function definitions, and loop declarations.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["debugging", "syntax-error", "common-mistake"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Indentation error: Inconsistent spacing causes 'IndentationError: unexpected indent'. Fix: Always use 4 spaces for indentation. Don't mix tabs and spaces. Python is strict about consistent indentation.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["debugging", "indentation", "common-mistake"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Variable naming mistake: Using Python keywords as variable names like 'class' or 'for'. Error: 'SyntaxError: invalid syntax'. Fix: Use descriptive names that aren't Python keywords. For example, use 'class_name' instead of 'class'.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["debugging", "naming", "common-mistake"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Type error: Adding a string to a number like '5' + 3 causes 'TypeError: can only concatenate str (not \"int\") to str'. Fix: Convert types explicitly using str(3) or int('5') to match the types before operating.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["debugging", "type-error", "common-mistake"],
      domain: "technology",
    },

    // Best Practices (Expanded)
    {
      id: uuidv4(),
      statement: "PEP 8 is Python's official style guide. It recommends using 4 spaces per indentation, limiting lines to 79 characters, using lowercase_with_underscores for variable names, and adding spaces around operators. Following PEP 8 makes your code readable and professional.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["best-practices", "pep-8", "style"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Naming conventions: Use lowercase_with_underscores for variables and functions (my_variable). Use CapitalizedWords for classes (MyClass). Use UPPER_CASE for constants (MAX_SIZE). This makes your code self-documenting and follows community standards.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["best-practices", "naming", "conventions"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Docstring format: Always include a docstring (triple-quoted string) as the first statement in a function. Format: '''Brief description. Args: param: description. Returns: description.'''. This helps others understand your function's purpose and usage.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["best-practices", "documentation", "docstrings"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Error handling patterns: Use try/except blocks to handle potential errors gracefully. Always specify the exception type (except ValueError) rather than catching all exceptions (except Exception). Include meaningful error messages to help debugging.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["best-practices", "error-handling", "exceptions"],
      domain: "technology",
    },

    // FAQs
    {
      id: uuidv4(),
      statement: "Is Python good for beginners? Yes, absolutely. Python's syntax reads like English, it has a supportive community, and it's widely used in real-world applications. Beginners can write working code quickly, which builds confidence and motivation.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "beginner", "learning"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "What can I build with Python? Python is incredibly versatile. You can build websites (Django, Flask), analyze data (pandas, numpy), create machine learning models (TensorFlow, PyTorch), automate tasks, build games, and much more. It's used in almost every industry.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "applications", "projects"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "How long does it take to learn Python? You can learn the basics in 2-4 weeks with consistent practice. To become job-ready for entry-level positions typically takes 3-6 months of dedicated learning and building projects. Mastery takes years of experience.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "learning-path", "timeline"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "What job opportunities exist? Python developers are in high demand. Common roles include Backend Developer, Data Scientist, Machine Learning Engineer, DevOps Engineer, Automation Engineer, and Full Stack Developer. Python is used at Google, Facebook, Netflix, and many other tech companies.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "careers", "jobs"],
      domain: "technology",
    },

    // Continue Learning
    {
      id: uuidv4(),
      statement: "Advanced Python concepts to learn next: Object-oriented programming (classes, inheritance), decorators, generators, context managers, async/await for asynchronous programming, and metaprogramming. These concepts will make you a more effective Python developer.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "advanced", "concepts"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Popular libraries to explore: pandas for data analysis, numpy for numerical computing, Django for web development, Flask for lightweight web apps, TensorFlow for machine learning, and requests for HTTP requests. These libraries extend Python's capabilities for specific domains.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "libraries", "ecosystem"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Building projects is the best way to learn. Start with simple projects like a calculator, to-do list, or weather app. Then progress to more complex projects like a web scraper, data analysis dashboard, or simple web application. Projects solidify your knowledge and build your portfolio.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "projects", "practice"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Career paths in Python: Data Science/Analytics (pandas, numpy, matplotlib), Web Development (Django, Flask), Machine Learning (TensorFlow, PyTorch, scikit-learn), DevOps/Automation (Ansible, Docker), and Software Engineering. Choose a path based on your interests and career goals.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "career", "paths"],
      domain: "technology",
    },

    // Decision Frameworks
    {
      id: uuidv4(),
      statement: "When to use Python vs other languages: Choose Python for data science, machine learning, web backends, automation, and rapid prototyping. Choose JavaScript for web frontends and Node.js backends. Choose C++ for high-performance systems and game development. Choose Java for enterprise applications.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "language-selection", "comparison"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Choosing the right data structure: Use lists for ordered collections when you need to access items by position. Use dictionaries for key-value lookups when you need fast access by key. Use sets for unique collections when you need to check membership quickly. Use tuples for immutable sequences.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "data-structures", "selection"],
      domain: "technology",
    },
    {
      id: uuidv4(),
      statement: "Selecting the right library for your project: For web development, choose Django for full-featured apps or Flask for lightweight apps. For data analysis, use pandas. For machine learning, start with scikit-learn. For web scraping, use BeautifulSoup. For automation, use Selenium. Research libraries before choosing to ensure they fit your needs.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "libraries", "selection"],
      domain: "technology",
    },
  ];

  console.log(`Adding ${facts.length} world-class knowledge facts for Python Programming Fundamentals...`);

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
  console.log(`\nPrevious total facts: 33`);
  console.log(`New total facts: ${33 + created}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
