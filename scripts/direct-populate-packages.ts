/**
 * Direct Knowledge Package Population
 *
 * Bypasses the discovery system to directly populate knowledge packages
 * with structured facts from official documentation.
 *
 * This is more efficient than the full discovery pipeline and doesn't
 * require entity types or hub slots.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  { slug: "python-programming-fundamentals", name: "Python Programming Fundamentals" },
  { slug: "git-version-control", name: "Git Version Control" },
  { slug: "investing-basics", name: "Investing Basics" },
  { slug: "data-structures", name: "Data Structures" },
];

// Structured knowledge for each topic
const STRUCTURED_KNOWLEDGE: Record<string, {
  definitions: string[];
  concepts: string[];
  procedures: string[];
  commands: string[];
  examples: string[];
  warnings: string[];
  bestPractices: string[];
  commonMistakes: string[];
}> = {
  "python-programming-fundamentals": {
    definitions: [
      "Python is a high-level, interpreted programming language known for its readability and simplicity.",
      "Variables in Python are containers for storing data values, created when you first assign a value to them.",
      "Data types in Python include integers, floats, strings, booleans, lists, tuples, dictionaries, and sets.",
      "Functions in Python are reusable blocks of code that perform a specific task, defined using the def keyword.",
      "Classes in Python are blueprints for creating objects, defined using the class keyword and support inheritance.",
      "Modules in Python are files containing Python definitions and statements that can be imported.",
      "Exceptions in Python are events that disrupt the normal flow of program execution, handled with try-except blocks.",
    ],
    concepts: [
      "Python uses indentation to define code blocks instead of braces or keywords.",
      "Python is dynamically typed, meaning variable types are determined at runtime.",
      "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
      "Python has a comprehensive standard library that provides tools for many common programming tasks.",
      "Python uses garbage collection for automatic memory management.",
      "Python's interpreter reads and executes code line by line.",
      "Python supports list comprehensions for concise list creation.",
    ],
    procedures: [
      "To define a variable in Python, use the syntax variable_name = value.",
      "To define a function, use def function_name(parameters): followed by indented code block.",
      "To create a class, use class ClassName: followed by class attributes and methods.",
      "To import a module, use import module_name or from module_name import specific_function.",
      "To handle exceptions, use try, except, finally blocks to catch and manage errors.",
      "To create a list, use square brackets: my_list = [1, 2, 3].",
      "To create a dictionary, use curly braces: my_dict = {'key': 'value'}.",
    ],
    commands: [
      "python script.py - Execute a Python script from command line",
      "pip install package_name - Install a Python package using pip",
      "python -m pip install --upgrade pip - Upgrade pip to latest version",
      "python -c 'print(\"Hello\")' - Execute Python code directly from command line",
      "python -m venv myenv - Create a virtual environment",
      "pip list - List installed packages",
      "pip freeze > requirements.txt - Export package dependencies",
    ],
    examples: [
      "Example: x = 5 assigns the integer 5 to variable x",
      "Example: def greet(name): return f'Hello, {name}!' defines a simple function",
      "Example: numbers = [1, 2, 3] creates a list with three integers",
      "Example: for i in range(5): print(i) prints numbers 0 through 4",
      "Example: class Dog: def __init__(self, name): self.name = name defines a simple class",
      "Example: import math imports the math module for mathematical functions",
      "Example: try: x = 1/0 except ZeroDivisionError: print('Cannot divide by zero') handles exceptions",
    ],
    warnings: [
      "Never use mutable default arguments in function definitions as they retain state between calls.",
      "Avoid using the same variable name for different types in the same scope to prevent confusion.",
      "Do not modify a list while iterating over it, as this can cause unexpected behavior.",
      "Never use from module import * as it pollutes the namespace and makes code hard to understand.",
      "Avoid comparing floating point numbers with exact equality due to precision issues.",
      "Never ignore exceptions without proper handling, as this can hide bugs.",
      "Do not use reserved keywords as variable names in Python.",
    ],
    bestPractices: [
      "Use meaningful variable names that describe the data they hold.",
      "Write docstrings for all functions and classes to explain their purpose.",
      "Follow PEP 8 style guidelines for consistent, readable Python code.",
      "Use list comprehensions for simple transformations instead of map and filter.",
      "Keep functions small and focused on a single responsibility.",
      "Use virtual environments to isolate project dependencies.",
      "Write unit tests for critical functions to ensure correctness.",
    ],
    commonMistakes: [
      "Forgetting to use self as the first parameter in instance methods.",
      "Modifying a list while iterating over it, causing skipped elements or errors.",
      "Using mutable default arguments which retain state between function calls.",
      "Confusing assignment (=) with equality comparison (==).",
      "Forgetting to call parent class __init__ in child class constructors.",
      "Mixing tabs and spaces for indentation, which causes syntax errors.",
      "Forgetting to import required modules before using them.",
    ],
  },
  "git-version-control": {
    definitions: [
      "Git is a distributed version control system that tracks changes in source code during software development.",
      "A repository in Git is a directory containing all project files and the complete revision history.",
      "A commit in Git is a snapshot of the repository at a specific point in time.",
      "A branch in Git is an independent line of development that allows parallel work.",
      "A merge in Git combines changes from different branches into a single branch.",
      "A clone in Git creates a copy of a remote repository on your local machine.",
      "A pull in Git fetches changes from a remote repository and merges them into the current branch.",
      "A push in Git uploads local commits to a remote repository.",
    ],
    concepts: [
      "Git uses a directed acyclic graph (DAG) to represent the history of commits.",
      "Git is distributed, meaning every developer has a complete copy of the repository history.",
      "Git uses SHA-1 hashes to uniquely identify commits and ensure data integrity.",
      "Git has a staging area (index) where changes are prepared before committing.",
      "Git supports both local and remote repositories for collaboration.",
      "Git branches allow multiple developers to work on features simultaneously without conflicts.",
      "Git's commit history is immutable, ensuring a reliable audit trail.",
    ],
    procedures: [
      "To initialize a new Git repository, run git init in the project directory.",
      "To stage changes for commit, use git add . or git add specific_file.",
      "To commit staged changes, use git commit -m 'descriptive message'.",
      "To create a new branch, use git branch branch_name and switch with git checkout branch_name.",
      "To merge a branch, use git merge branch_name while on the target branch.",
      "To clone a repository, use git clone repository_url.",
      "To push changes to remote, use git push origin branch_name.",
    ],
    commands: [
      "git init - Initialize a new Git repository",
      "git clone url - Clone a remote repository to local machine",
      "git add . - Stage all changes for commit",
      "git commit -m 'message' - Commit staged changes with a message",
      "git push origin main - Push commits to remote repository",
      "git pull origin main - Pull changes from remote repository",
      "git branch - List all branches",
      "git checkout -b new-branch - Create and switch to new branch",
      "git merge branch-name - Merge specified branch into current branch",
      "git status - Show working tree status",
      "git log - Show commit history",
      "git diff - Show changes between commits",
    ],
    examples: [
      "Example: git init followed by git add . and git commit -m 'Initial commit' starts version control",
      "Example: git clone https://github.com/user/repo.git copies a remote repository locally",
      "Example: git checkout -b feature/login creates and switches to a new feature branch",
      "Example: git merge feature/login combines the feature branch into the current branch",
      "Example: git stash saves uncommitted changes temporarily",
      "Example: git pull --rebase integrates remote changes with local commits",
    ],
    warnings: [
      "Never commit sensitive information like API keys, passwords, or configuration files with secrets.",
      "Avoid rewriting public history as it causes problems for other collaborators.",
      "Do not commit large binary files directly to Git repositories.",
      "Never force push to shared branches unless absolutely necessary.",
      "Avoid committing files that can be generated (node_modules, build artifacts, etc.).",
      "Never commit debugging code or console.log statements in production code.",
      "Do not ignore merge conflicts - resolve them properly before continuing.",
    ],
    bestPractices: [
      "Write clear, descriptive commit messages that explain why a change was made.",
      "Create separate branches for each feature or bug fix.",
      "Use .gitignore to exclude unnecessary files from version control.",
      "Pull before pushing to avoid merge conflicts.",
      "Review code changes before committing to ensure quality.",
      "Keep commits small and focused on a single logical change.",
      "Use meaningful branch names that describe the feature or fix.",
    ],
    commonMistakes: [
      "Forgetting to stage files before committing.",
      "Committing to the main branch instead of creating feature branches.",
      "Not pulling the latest changes before pushing, causing merge conflicts.",
      "Committing files that should be in .gitignore.",
      "Using unclear commit messages that don't explain the purpose of changes.",
      "Force pushing to shared branches and disrupting other developers.",
      "Not resolving merge conflicts properly before committing.",
    ],
  },
  "investing-basics": {
    definitions: [
      "A stock represents ownership in a corporation and a claim on part of the corporation's assets and earnings.",
      "A bond is a debt security where an investor loans money to an entity for a defined period at a fixed interest rate.",
      "An ETF (Exchange-Traded Fund) is a basket of securities that trades on an exchange like a single stock.",
      "A mutual fund is a professionally managed investment fund that pools money from many investors to purchase securities.",
      "An index fund is a mutual fund or ETF designed to track the performance of a specific market index.",
      "Risk in investing refers to the potential for losing money or not achieving expected returns.",
      "Return in investing is the profit or loss from an investment over a specific period.",
    ],
    concepts: [
      "Diversification reduces risk by spreading investments across different asset classes and sectors.",
      "Compound interest allows investments to grow exponentially as interest earns interest on itself.",
      "Risk and return are positively correlated - higher potential returns come with higher risk.",
      "Asset allocation determines the mix of stocks, bonds, and other assets in a portfolio.",
      "Market volatility refers to the degree of variation in trading prices over time.",
      "Liquidity refers to how quickly an investment can be converted to cash without significant loss.",
      "Time horizon is the length of time an investor expects to hold an investment before needing the money.",
    ],
    procedures: [
      "To start investing, open a brokerage account and fund it with money you can afford to invest long-term.",
      "To build a diversified portfolio, allocate investments across different asset classes based on risk tolerance.",
      "To implement dollar-cost averaging, invest a fixed amount at regular intervals regardless of market conditions.",
      "To rebalance a portfolio, sell assets that have grown beyond target allocation and buy underweight assets.",
      "To assess investment performance, compare returns against appropriate benchmarks over the same period.",
      "To minimize taxes, use tax-advantaged accounts like IRAs and 401(k)s when possible.",
    ],
    commands: [
      "No CLI commands - investing requires platform-specific actions through brokerage accounts",
    ],
    examples: [
      "Example: Buying shares of an S&P 500 index fund provides exposure to 500 large US companies",
      "Example: A 60/40 portfolio allocates 60% to stocks and 40% to bonds for balanced growth and income",
      "Example: Dollar-cost averaging $500 monthly reduces impact of market timing",
      "Example: Rebalancing annually maintains target asset allocation",
      "Example: Tax-advantaged accounts like IRAs and 401(k)s offer tax benefits for retirement savings",
      "Example: A diversified portfolio might include stocks, bonds, real estate, and commodities",
    ],
    warnings: [
      "Never invest money you cannot afford to lose, especially in high-risk investments.",
      "Avoid trying to time the market as even professionals struggle to consistently predict market movements.",
      "Do not put all your money in a single investment or sector - diversification is essential.",
      "Never make investment decisions based on emotions like fear or greed.",
      "Avoid high-fee investment products that significantly reduce long-term returns.",
      "Never invest in something you don't understand - always research thoroughly first.",
      "Do not chase past performance - it doesn't guarantee future results.",
    ],
    bestPractices: [
      "Invest for the long term and avoid reacting to short-term market fluctuations.",
      "Maintain an emergency fund of 3-6 months expenses before investing.",
      "Understand your risk tolerance and invest accordingly.",
      "Take advantage of employer matching in 401(k) plans - this is free money.",
      "Regularly review and rebalance your portfolio to maintain target allocations.",
      "Keep investment costs low by choosing low-fee index funds and ETFs.",
      "Automate your investments through regular contributions to dollar-cost average.",
    ],
    commonMistakes: [
      "Investing without understanding the underlying investment or its risks.",
      "Chasing past performance instead of focusing on future potential.",
      "Paying high fees that eat into investment returns.",
      "Not diversifying adequately and concentrating risk in too few investments.",
      "Panic selling during market downturns and locking in losses.",
      "Investing money needed for short-term expenses in long-term investments.",
      "Ignoring tax implications of investment decisions.",
    ],
  },
  "data-structures": {
    definitions: [
      "An array is a collection of elements identified by index, typically stored in contiguous memory.",
      "A linked list is a linear data structure where elements are stored in nodes with pointers to the next node.",
      "A stack is a linear data structure following Last-In-First-Out (LIFO) principle, with push and pop operations.",
      "A queue is a linear data structure following First-In-First-Out (FIFO) principle, with enqueue and dequeue operations.",
      "A hash table is a data structure that maps keys to values using a hash function for efficient lookup.",
      "A tree is a hierarchical data structure with nodes connected by edges, with a single root node.",
      "A graph is a collection of vertices connected by edges, representing relationships between objects.",
    ],
    concepts: [
      "Time complexity measures how algorithm performance scales with input size.",
      "Space complexity measures the memory usage of an algorithm relative to input size.",
      "Big O notation describes the upper bound of algorithm complexity in the worst case.",
      "Data structure choice affects algorithm efficiency for specific operations.",
      "Balanced trees maintain logarithmic height for efficient operations.",
      "Collision resolution in hash tables uses chaining or open addressing to handle key conflicts.",
      "Graph traversal uses depth-first search (DFS) or breadth-first search (BFS) algorithms.",
    ],
    procedures: [
      "To choose a data structure, consider the operations needed (insert, delete, search) and their frequency.",
      "To implement a hash table, choose a good hash function and handle collisions with chaining or open addressing.",
      "To traverse a tree, use depth-first (pre-order, in-order, post-order) or breadth-first search.",
      "To balance a binary search tree, use algorithms like AVL or Red-Black tree rotations.",
      "To implement a graph, use adjacency matrix for dense graphs or adjacency list for sparse graphs.",
      "To search in a sorted array, use binary search for O(log n) complexity.",
      "To sort data, choose an algorithm based on data size and constraints (quick sort, merge sort, etc.).",
    ],
    commands: [
      "No CLI commands - data structures are programming concepts implemented in code",
    ],
    examples: [
      "Example: Array access is O(1) while searching is O(n) in unsorted arrays",
      "Example: Hash tables provide average O(1) lookup, insert, and delete operations",
      "Example: Stacks are used in function call management and undo operations",
      "Example: Queues are used in task scheduling and breadth-first search",
      "Example: Binary search trees enable O(log n) search, insert, and delete when balanced",
      "Example: Adjacency lists are efficient for sparse graphs while matrices work well for dense graphs",
    ],
    warnings: [
      "Never use an array for frequent insertions and deletions as these are O(n) operations.",
      "Avoid recursion depth issues with deep recursive algorithms on large data structures.",
      "Do not use hash tables when ordered data access is required.",
      "Never assume default time complexity without considering edge cases.",
      "Avoid naive implementations that ignore memory locality and cache performance.",
      "Never use recursion without considering stack overflow for large inputs.",
      "Do not use complex data structures when simpler ones would suffice.",
    ],
    bestPractices: [
      "Choose data structures based on the most frequent operations in your use case.",
      "Consider both time and space complexity when selecting data structures.",
      "Use built-in library implementations when available as they are usually optimized.",
      "Document the rationale for data structure choices in code comments.",
      "Profile actual performance rather than relying solely on theoretical complexity.",
      "Test edge cases like empty structures, single elements, and maximum capacity.",
      "Consider thread safety if the data structure will be accessed concurrently.",
    ],
    commonMistakes: [
      "Using arrays for dynamic data when linked lists or dynamic arrays would be more efficient.",
      "Choosing complex data structures when simpler ones would suffice.",
      "Ignoring the impact of data structure choice on cache performance.",
      "Not considering worst-case scenarios in data structure operations.",
      "Implementing data structures from scratch when standard library implementations exist.",
      "Using the wrong data structure for the problem requirements.",
      "Not accounting for memory overhead of complex data structures.",
    ],
  },
};

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  /type \d+/i,
  /description \d+/i,
  /key point \d+/i,
  /example \d+/i,
  /step \d+/i,
  /option [AB]/i,
  /pro \d+.*con \d+/i,
  /const result = \w+\(\);/i,
  /^\/\/ .* example \d+$/i,
  /lorem ipsum/i,
  /todo:/i,
  /placeholder/i,
];

function detectPlaceholders(content: string): string[] {
  const found: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      found.push(match[0]);
    }
  }
  return found;
}

function computeKnowledgeHash(facts: any[]): string {
  const sorted = facts.map(f => f.statement).sort().join("|");
  // Simple hash - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

async function populatePackage(slug: string, name: string) {
  console.log(`\n=== Populating ${name} (${slug}) ===`);

  try {
    // Get topic ID
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("❌ Topic not found");
      return { success: false, error: "Topic not found" };
    }

    const knowledge = STRUCTURED_KNOWLEDGE[slug];
    if (!knowledge) {
      console.log("❌ No structured knowledge available");
      return { success: false, error: "No structured knowledge available" };
    }

    // Create facts from structured knowledge
    const facts = [];
    const factTypes: Record<string, string> = {
      definitions: "definition",
      concepts: "property",
      procedures: "procedural",
      commands: "procedural",
      examples: "property",
      warnings: "warning",
      bestPractices: "rule",
      commonMistakes: "warning",
    };

    for (const [field, statements] of Object.entries(knowledge)) {
      const factType = factTypes[field] || "property";
      for (const statement of statements) {
        facts.push({
          id: uuidv4(),
          statement,
          fact_type: factType,
          confidence: "high",
          domain: slug,
          scope: "universal",
          tags: [slug, field],
        });
      }
    }

    console.log(`✓ Created ${facts.length} facts`);

    // Validate no placeholders
    const allStatements = facts.map(f => f.statement).join(" ");
    const placeholders = detectPlaceholders(allStatements);
    
    if (placeholders.length > 0) {
      console.log(`❌ Validation failed: placeholders detected: ${placeholders.join(", ")}`);
      return { success: false, error: `Placeholders detected: ${placeholders.join(", ")}` };
    }
    
    console.log(`✓ Validation passed: no placeholders detected`);

    // Check for existing package
    const { data: existingPkg } = await supabase
      .from("knowledge_packages")
      .select("id, version, knowledge_hash")
      .eq("slug", slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newHash = computeKnowledgeHash(facts);
    let packageId: string;
    let version = 1;

    if (existingPkg && existingPkg.knowledge_hash === newHash) {
      console.log("✓ Package unchanged, updating verification timestamp");
      await supabase
        .from("knowledge_packages")
        .update({ last_verified_at: new Date().toISOString() })
        .eq("id", existingPkg.id);
      packageId = existingPkg.id;
      version = existingPkg.version;
    } else {
      if (existingPkg) {
        console.log(`Archiving previous version ${existingPkg.version}`);
        await supabase
          .from("knowledge_packages")
          .update({ status: "archived" })
          .eq("id", existingPkg.id);
        version = existingPkg.version + 1;
      }

      // Create new package
      const { data: newPkg, error: insertError } = await supabase
        .from("knowledge_packages")
        .insert({
          topic_id: topic.id,
          slug,
          version,
          knowledge_hash: newHash,
          fact_count: facts.length,
          source_count: 1,
          relationship_count: 0,
          discovery_run_ids: [],
          status: "draft",
          last_verified_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`Failed to create package: ${insertError.message}`);
      }

      if (!newPkg) {
        throw new Error("Failed to create package: no data returned");
      }

      packageId = newPkg.id;
      console.log(`✓ Created package version ${version}`);

      // Insert facts
      for (const fact of facts) {
        const { error: factError } = await supabase.from("knowledge_facts").insert({
          package_id: packageId,
          statement: fact.statement,
          fact_type: fact.fact_type,
          confidence: fact.confidence,
          domain: fact.domain,
          scope: fact.scope,
          tags: fact.tags,
        });
        
        if (factError) {
          console.log(`❌ Failed to insert fact: ${factError.message}`);
          throw new Error(`Failed to insert fact: ${factError.message}`);
        }
      }

      console.log(`✓ Inserted ${facts.length} facts`);
    }

    return { 
      success: true, 
      packageId,
      version,
      factsCount: facts.length,
    };

  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runPopulation() {
  console.log("=== Direct Knowledge Package Population ===\n");

  const results = [];
  
  for (const topic of TOPICS) {
    const result = await populatePackage(topic.slug, topic.name);
    results.push({ ...topic, ...result });
  }

  console.log("\n=== RESULTS ===\n");
  
  for (const result of results) {
    if (result.success) {
      console.log(`✓ ${result.name}: v${result.version}, ${result.factsCount} facts`);
    } else {
      console.log(`❌ ${result.name}: ${result.error}`);
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nSummary: ${successful}/${results.length} successful, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPopulation()
  .then(() => {
    console.log("\n=== Population Complete ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
