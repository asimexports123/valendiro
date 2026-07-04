/**
 * Direct Topic Content Update
 *
 * Bypasses the rendering pipeline to directly update topics.content
 * with structured knowledge, eliminating placeholder text.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  { slug: "python-programming-fundamentals", name: "Python Programming Fundamentals" },
  { slug: "git-version-control", name: "Git Version Control" },
  { slug: "investing-basics", name: "Investing Basics" },
  { slug: "data-structures", name: "Data Structures" },
];

const STRUCTURED_CONTENT: Record<string, string> = {
  "python-programming-fundamentals": `# Python Programming Fundamentals

## Overview

Python is a high-level, interpreted programming language known for its readability and simplicity. Python is dynamically typed, meaning variable types are determined at runtime. Python uses indentation to define code blocks instead of braces or keywords.

## Syntax Basics

To define a variable in Python, use the syntax \`variable_name = value\`. Data types in Python include integers, floats, strings, booleans, lists, tuples, dictionaries, and sets.

### Key Concepts

- Python uses indentation to define code blocks instead of braces or keywords
- Python is dynamically typed, meaning variable types are determined at runtime
- Python supports multiple programming paradigms including procedural, object-oriented, and functional programming
- Python has a comprehensive standard library that provides tools for many common programming tasks
- Python uses garbage collection for automatic memory management

## Control Flow

### Procedures

- To define a function, use \`def function_name(parameters):\` followed by indented code block
- To handle exceptions, use try, except, finally blocks to catch and manage errors
- To create a list, use square brackets: \`my_list = [1, 2, 3]\`
- To create a dictionary, use curly braces: \`my_dict = {'key': 'value'}\`

### Examples

- Example: \`x = 5\` assigns the integer 5 to variable x
- Example: \`def greet(name): return f'Hello, {name}!'\` defines a simple function
- Example: \`numbers = [1, 2, 3]\` creates a list with three integers
- Example: \`for i in range(5): print(i)\` prints numbers 0 through 4

### Warnings

- Never use mutable default arguments in function definitions as they retain state between calls
- Avoid using the same variable name for different types in the same scope to prevent confusion
- Do not modify a list while iterating over it, as this can cause unexpected behavior
- Never use \`from module import *\` as it pollutes the namespace and makes code hard to understand

## Functions

Functions in Python are reusable blocks of code that perform a specific task, defined using the def keyword.

### Best Practices

- Use meaningful variable names that describe the data they hold
- Write docstrings for all functions and classes to explain their purpose
- Follow PEP 8 style guidelines for consistent, readable Python code
- Keep functions small and focused on a single responsibility

### Common Mistakes

- Forgetting to use self as the first parameter in instance methods
- Modifying a list while iterating over it, causing skipped elements or errors
- Using mutable default arguments which retain state between function calls
- Confusing assignment (=) with equality comparison (==)

## Modules & Packages

Modules in Python are files containing Python definitions and statements that can be imported.

### Procedures

- To import a module, use \`import module_name\` or \`from module_name import specific_function\`

### Examples

- Example: \`import math\` imports the math module for mathematical functions
- Example: \`try: x = 1/0 except ZeroDivisionError: print('Cannot divide by zero')\` handles exceptions

## Common Libraries

Python has a comprehensive standard library that provides tools for many common programming tasks.

### Commands

- \`python script.py\` - Execute a Python script from command line
- \`pip install package_name\` - Install a Python package using pip
- \`python -m pip install --upgrade pip\` - Upgrade pip to latest version
- \`python -c 'print("Hello")'\` - Execute Python code directly from command line
- \`python -m venv myenv\` - Create a virtual environment
- \`pip list\` - List installed packages
- \`pip freeze > requirements.txt\` - Export package dependencies`,

  "git-version-control": `# Git Version Control

## Overview

Git is a distributed version control system that tracks changes in source code during software development. Git is distributed, meaning every developer has a complete copy of the repository history. Git uses a directed acyclic graph (DAG) to represent the history of commits.

## Basic Commands

### Commands

- \`git init\` - Initialize a new Git repository
- \`git clone url\` - Clone a remote repository to local machine
- \`git add .\` - Stage all changes for commit
- \`git commit -m 'message'\` - Commit staged changes with a message
- \`git push origin main\` - Push commits to remote repository
- \`git pull origin main\` - Pull changes from remote repository
- \`git branch\` - List all branches
- \`git checkout -b new-branch\` - Create and switch to new branch
- \`git merge branch-name\` - Merge specified branch into current branch
- \`git status\` - Show working tree status
- \`git log\` - Show commit history
- \`git diff\` - Show changes between commits

### Procedures

- To initialize a new Git repository, run \`git init\` in the project directory
- To stage changes for commit, use \`git add .\` or \`git add specific_file\`
- To commit staged changes, use \`git commit -m 'descriptive message'\`
- To create a new branch, use \`git branch branch_name\` and switch with \`git checkout branch_name\`
- To merge a branch, use \`git merge branch_name\` while on the target branch
- To clone a repository, use \`git clone repository_url\`
- To push changes to remote, use \`git push origin branch_name\`

### Examples

- Example: \`git init\` followed by \`git add .\` and \`git commit -m 'Initial commit'\` starts version control
- Example: \`git clone https://github.com/user/repo.git\` copies a remote repository locally
- Example: \`git checkout -b feature/login\` creates and switches to a new feature branch
- Example: \`git merge feature/login\` combines the feature branch into the current branch
- Example: \`git stash\` saves uncommitted changes temporarily
- Example: \`git pull --rebase\` integrates remote changes with local commits

## Branching

A branch in Git is an independent line of development that allows parallel work. Git branches allow multiple developers to work on features simultaneously without conflicts.

### Best Practices

- Write clear, descriptive commit messages that explain why a change was made
- Create separate branches for each feature or bug fix
- Use .gitignore to exclude unnecessary files from version control
- Pull before pushing to avoid merge conflicts
- Review code changes before committing to ensure quality
- Keep commits small and focused on a single logical change
- Use meaningful branch names that describe the feature or fix

### Common Mistakes

- Forgetting to stage files before committing
- Committing to the main branch instead of creating feature branches
- Not pulling the latest changes before pushing, causing merge conflicts
- Committing files that should be in .gitignore
- Using unclear commit messages that don't explain the purpose of changes
- Force pushing to shared branches and disrupting other developers
- Not resolving merge conflicts properly before committing

## Merge Conflicts

A merge in Git combines changes from different branches into a single branch.

### Warnings

- Never commit sensitive information like API keys, passwords, or configuration files with secrets
- Avoid rewriting public history as it causes problems for other collaborators
- Do not commit large binary files directly to Git repositories
- Never force push to shared branches unless absolutely necessary
- Avoid committing files that can be generated (node_modules, build artifacts, etc.)
- Never commit debugging code or console.log statements in production code
- Do not ignore merge conflicts - resolve them properly before continuing`,

  "investing-basics": `# Investing Basics

## Overview

Investing involves allocating money with the expectation of generating income or profit. Risk in investing refers to the potential for losing money or not achieving expected returns. Return in investing is the profit or loss from an investment over a specific period.

## Investment Types

### Definitions

- A stock represents ownership in a corporation and a claim on part of the corporation's assets and earnings
- A bond is a debt security where an investor loans money to an entity for a defined period at a fixed interest rate
- An ETF (Exchange-Traded Fund) is a basket of securities that trades on an exchange like a single stock
- A mutual fund is a professionally managed investment fund that pools money from many investors to purchase securities
- An index fund is a mutual fund or ETF designed to track the performance of a specific market index

### Key Concepts

- Diversification reduces risk by spreading investments across different asset classes and sectors
- Compound interest allows investments to grow exponentially as interest earns interest on itself
- Risk and return are positively correlated - higher potential returns come with higher risk
- Asset allocation determines the mix of stocks, bonds, and other assets in a portfolio
- Market volatility refers to the degree of variation in trading prices over time
- Liquidity refers to how quickly an investment can be converted to cash without significant loss
- Time horizon is the length of time an investor expects to hold an investment before needing the money

## Risk & Return

### Procedures

- To start investing, open a brokerage account and fund it with money you can afford to invest long-term
- To build a diversified portfolio, allocate investments across different asset classes based on risk tolerance
- To implement dollar-cost averaging, invest a fixed amount at regular intervals regardless of market conditions
- To rebalance a portfolio, sell assets that have grown beyond target allocation and buy underweight assets
- To assess investment performance, compare returns against appropriate benchmarks over the same period
- To minimize taxes, use tax-advantaged accounts like IRAs and 401(k)s when possible

### Examples

- Example: Buying shares of an S&P 500 index fund provides exposure to 500 large US companies
- Example: A 60/40 portfolio allocates 60% to stocks and 40% to bonds for balanced growth and income
- Example: Dollar-cost averaging $500 monthly reduces impact of market timing
- Example: Rebalancing annually maintains target asset allocation
- Example: Tax-advantaged accounts like IRAs and 401(k)s offer tax benefits for retirement savings
- Example: A diversified portfolio might include stocks, bonds, real estate, and commodities

### Warnings

- Never invest money you cannot afford to lose, especially in high-risk investments
- Avoid trying to time the market as even professionals struggle to consistently predict market movements
- Do not put all your money in a single investment or sector - diversification is essential
- Never make investment decisions based on emotions like fear or greed
- Avoid high-fee investment products that significantly reduce long-term returns
- Never invest in something you don't understand - always research thoroughly first
- Do not chase past performance - it doesn't guarantee future results

## Getting Started

### Best Practices

- Invest for the long term and avoid reacting to short-term market fluctuations
- Maintain an emergency fund of 3-6 months expenses before investing
- Understand your risk tolerance and invest accordingly
- Take advantage of employer matching in 401(k) plans - this is free money
- Regularly review and rebalance your portfolio to maintain target allocations
- Keep investment costs low by choosing low-fee index funds and ETFs
- Automate your investments through regular contributions to dollar-cost average

### Common Mistakes

- Investing without understanding the underlying investment or its risks
- Chasing past performance instead of focusing on future potential
- Paying high fees that eat into investment returns
- Not diversifying adequately and concentrating risk in too few investments
- Panic selling during market downturns and locking in losses
- Investing money needed for short-term expenses in long-term investments
- Ignoring tax implications of investment decisions`,

  "data-structures": `# Data Structures

## Overview

Data structures are ways of organizing and storing data to enable efficient access and modification. Data structure choice affects algorithm efficiency for specific operations. Time complexity measures how algorithm performance scales with input size. Space complexity measures the memory usage of an algorithm relative to input size.

## Key Concepts

### Definitions

- An array is a collection of elements identified by index, typically stored in contiguous memory
- A linked list is a linear data structure where elements are stored in nodes with pointers to the next node
- A stack is a linear data structure following Last-In-First-Out (LIFO) principle, with push and pop operations
- A queue is a linear data structure following First-In-First-Out (FIFO) principle, with enqueue and dequeue operations
- A hash table is a data structure that maps keys to values using a hash function for efficient lookup
- A tree is a hierarchical data structure with nodes connected by edges, with a single root node
- A graph is a collection of vertices connected by edges, representing relationships between objects

### Key Concepts

- Big O notation describes the upper bound of algorithm complexity in the worst case
- Balanced trees maintain logarithmic height for efficient operations
- Collision resolution in hash tables uses chaining or open addressing to handle key conflicts
- Graph traversal uses depth-first search (DFS) or breadth-first search (BFS) algorithms

## Implementation

### Procedures

- To choose a data structure, consider the operations needed (insert, delete, search) and their frequency
- To implement a hash table, choose a good hash function and handle collisions with chaining or open addressing
- To traverse a tree, use depth-first (pre-order, in-order, post-order) or breadth-first search
- To balance a binary search tree, use algorithms like AVL or Red-Black tree rotations
- To implement a graph, use adjacency matrix for dense graphs or adjacency list for sparse graphs
- To search in a sorted array, use binary search for O(log n) complexity
- To sort data, choose an algorithm based on data size and constraints (quick sort, merge sort, etc.)

### Examples

- Example: Array access is O(1) while searching is O(n) in unsorted arrays
- Example: Hash tables provide average O(1) lookup, insert, and delete operations
- Example: Stacks are used in function call management and undo operations
- Example: Queues are used in task scheduling and breadth-first search
- Example: Binary search trees enable O(log n) search, insert, and delete when balanced
- Example: Adjacency lists are efficient for sparse graphs while matrices work well for dense graphs

### Warnings

- Never use an array for frequent insertions and deletions as these are O(n) operations
- Avoid recursion depth issues with deep recursive algorithms on large data structures
- Do not use hash tables when ordered data access is required
- Never assume default time complexity without considering edge cases
- Avoid naive implementations that ignore memory locality and cache performance
- Never use recursion without considering stack overflow for large inputs
- Do not use complex data structures when simpler ones would suffice

## Best Practices

### Best Practices

- Choose data structures based on the most frequent operations in your use case
- Consider both time and space complexity when selecting data structures
- Use built-in library implementations when available as they are usually optimized
- Document the rationale for data structure choices in code comments
- Profile actual performance rather than relying solely on theoretical complexity
- Test edge cases like empty structures, single elements, and maximum capacity
- Consider thread safety if the data structure will be accessed concurrently

### Common Mistakes

- Using arrays for dynamic data when linked lists or dynamic arrays would be more efficient
- Choosing complex data structures when simpler ones would suffice
- Ignoring the impact of data structure choice on cache performance
- Not considering worst-case scenarios in data structure operations
- Implementing data structures from scratch when standard library implementations exist
- Using the wrong data structure for the problem requirements
- Not accounting for memory overhead of complex data structures`,
};

async function updateTopicContent(slug: string, name: string) {
  console.log(`\n=== Updating ${name} (${slug}) ===`);

  try {
    const content = STRUCTURED_CONTENT[slug];
    if (!content) {
      console.log("❌ No content available");
      return { success: false, error: "No content available" };
    }

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

    // Update topics.content
    const { error: topicError } = await supabase
      .from("topics")
      .update({
        content: content,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    if (topicError) {
      console.log(`❌ Topic update failed: ${topicError.message}`);
      return { success: false, error: topicError.message };
    }

    // Update topic_translations.content
    const { error: translationError } = await supabase
      .from("topic_translations")
      .update({
        content: content,
        updated_at: new Date().toISOString(),
      })
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (translationError) {
      console.log(`❌ Translation update failed: ${translationError.message}`);
      return { success: false, error: translationError.message };
    }

    console.log("✓ Content updated successfully (both topic and translation)");
    return { success: true };

  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runUpdate() {
  console.log("=== Direct Topic Content Update ===\n");

  const results = [];
  
  for (const topic of TOPICS) {
    const result = await updateTopicContent(topic.slug, topic.name);
    results.push({ ...topic, ...result });
  }

  console.log("\n=== RESULTS ===\n");
  
  for (const result of results) {
    if (result.success) {
      console.log(`✓ ${result.name}`);
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

runUpdate()
  .then(() => {
    console.log("\n=== Update Complete ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
