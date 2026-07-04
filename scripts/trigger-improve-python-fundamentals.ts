import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improvePythonFundamentals() {
  console.log("Improving Python Programming Fundamentals knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "Python is a high-level, general-purpose programming language designed for readability and simplicity.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "programming", "fundamentals"],
      },
      {
        statement: "Python was created by Guido van Rossum and first released in 1991.",
        fact_type: "historical",
        confidence: "high",
        domain: "Software Development",
        scope: "contextual",
        tags: ["python", "history", "guido-van-rossum"],
      },
      {
        statement: "Python uses indentation to define code blocks instead of braces or keywords.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "syntax", "indentation"],
      },
      {
        statement: "Python is an interpreted language, meaning code is executed line-by-line without compilation.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "interpreted", "execution"],
      },
      {
        statement: "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "paradigms", "programming"],
      },
      
      // Installation and Setup
      {
        statement: "Python can be installed from python.org for Windows, macOS, and Linux.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "contextual",
        tags: ["python", "installation", "setup"],
      },
      {
        statement: "Virtual environments in Python isolate project dependencies using venv or conda.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "contextual",
        tags: ["python", "virtual-environment", "dependencies"],
      },
      {
        statement: "pip is Python's package installer for managing third-party libraries.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "contextual",
        tags: ["python", "pip", "packages"],
      },
      
      // Basic Syntax and Data Types
      {
        statement: "Python variables are dynamically typed and do not require explicit type declaration.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "variables", "types"],
      },
      {
        statement: "Python supports basic data types: int, float, str, bool, and None.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "data-types", "types"],
      },
      {
        statement: "Python strings can be created using single quotes, double quotes, or triple quotes for multi-line strings.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "strings", "syntax"],
      },
      {
        statement: "Python uses the print() function to output text and values to the console.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "print", "output"],
      },
      {
        statement: "Python uses input() function to get user input from the console.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "input", "user-interaction"],
      },
      
      // Control Flow
      {
        statement: "Python uses if, elif, and else statements for conditional execution.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "conditionals", "if-else"],
      },
      {
        statement: "Python uses for loops to iterate over sequences and while loops for conditional iteration.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "loops", "iteration"],
      },
      {
        statement: "Python supports break to exit loops and continue to skip to the next iteration.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "break", "continue", "loops"],
      },
      {
        statement: "Python range() function generates sequences of numbers for iteration.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "range", "sequences"],
      },
      
      // Data Structures
      {
        statement: "Python lists are ordered, mutable sequences that can hold mixed data types.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "lists", "data-structures"],
      },
      {
        statement: "Python lists support methods like append(), remove(), sort(), and pop() for manipulation.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "lists", "methods"],
      },
      {
        statement: "Python list indexing starts at 0 and supports negative indexing from the end.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "lists", "indexing"],
      },
      {
        statement: "Python list slicing uses syntax list[start:stop:step] to extract subsequences.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "lists", "slicing"],
      },
      {
        statement: "Python tuples are ordered, immutable sequences that cannot be modified after creation.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "tuples", "data-structures"],
      },
      {
        statement: "Python dictionaries are key-value pairs that provide fast lookups by key.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "dictionaries", "data-structures"],
      },
      {
        statement: "Python dictionaries support methods like keys(), values(), items(), and get() for access.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "dictionaries", "methods"],
      },
      {
        statement: "Python sets are unordered collections of unique elements used for membership testing.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "sets", "data-structures"],
      },
      {
        statement: "Python sets support mathematical operations like union, intersection, and difference.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "sets", "operations"],
      },
      
      // Functions
      {
        statement: "Python functions are defined using the def keyword followed by function name and parameters.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "functions", "def"],
      },
      {
        statement: "Python functions can return values using the return statement or return None implicitly.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "functions", "return"],
      },
      {
        statement: "Python supports default parameter values and keyword arguments in function definitions.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "functions", "parameters"],
      },
      {
        statement: "Python supports lambda functions for anonymous, single-expression functions.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "lambda", "functions"],
      },
      
      // Modules and Packages
      {
        statement: "Python modules are files containing Python definitions and statements that can be imported.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "modules", "imports"],
      },
      {
        statement: "Python uses import statement to load modules and from...import to import specific components.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "import", "modules"],
      },
      {
        statement: "Python packages are collections of modules organized in directories with __init__.py files.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "packages", "modules"],
      },
      
      // Error Handling
      {
        statement: "Python uses try-except blocks to handle exceptions and prevent program crashes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "exceptions", "error-handling"],
      },
      {
        statement: "Python supports finally blocks to execute code regardless of exception occurrence.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "exceptions", "finally"],
      },
      {
        statement: "Python can raise custom exceptions using the raise keyword.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "exceptions", "raise"],
      },
      
      // File Operations
      {
        statement: "Python uses open() function to read and write files with different modes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "files", "i-o"],
      },
      {
        statement: "Python file modes include 'r' for reading, 'w' for writing, and 'a' for appending.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "files", "modes"],
      },
      {
        statement: "Python context managers with 'with' statement ensure files are properly closed after operations.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "files", "context-managers"],
      },
      
      // Practical Examples
      {
        statement: "Python can be used as a calculator for arithmetic operations like addition, subtraction, multiplication, and division.",
        fact_type: "example",
        confidence: "high",
        domain: "Software Development",
        scope: "contextual",
        tags: ["python", "calculator", "examples"],
      },
      {
        statement: "Python list comprehensions provide concise syntax for creating lists from existing sequences.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Development",
        scope: "universal",
        tags: ["python", "list-comprehensions", "syntax"],
      },
      {
        statement: "Python is widely used in web development, data science, automation, and machine learning.",
        fact_type: "application",
        confidence: "high",
        domain: "Software Development",
        scope: "contextual",
        tags: ["python", "applications", "use-cases"],
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
        topic_id: "55c9e8eb-9d8b-48e5-a037-1aa729789e02",
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

improvePythonFundamentals();
