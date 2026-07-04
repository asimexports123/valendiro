/**
 * Structured Documentation Adapter
 *
 * Extracts structured knowledge from official documentation sources.
 * Priority: Highest - always use official docs where available.
 *
 * Extracts structured fields:
 * - Definitions
 * - Concepts
 * - Procedures
 * - Commands
 * - Examples
 * - Warnings
 * - Best Practices
 * - Common Mistakes
 *
 * Does NOT scrape complete articles or paragraphs.
 * Extracts only structured, atomic knowledge.
 */

import type { DiscoveryAdapter, SlotInfo, RawCandidate } from "../adapters";

interface StructuredDoc {
  source: string;
  url: string;
  definitions: string[];
  concepts: string[];
  procedures: string[];
  commands: string[];
  examples: string[];
  warnings: string[];
  bestPractices: string[];
  commonMistakes: string[];
}

export class StructuredDocsAdapter implements DiscoveryAdapter {
  readonly adapterType = "structured-docs";

  private topicMappings: Record<string, StructuredDoc> = {
    "python-programming-fundamentals": {
      source: "Python Official Documentation",
      url: "https://docs.python.org/3/",
      definitions: [
        "Python is a high-level, interpreted programming language known for its readability and simplicity.",
        "Variables in Python are containers for storing data values, created when you first assign a value to them.",
        "Data types in Python include integers, floats, strings, booleans, lists, tuples, dictionaries, and sets.",
        "Functions in Python are reusable blocks of code that perform a specific task, defined using the def keyword.",
        "Classes in Python are blueprints for creating objects, defined using the class keyword and support inheritance.",
      ],
      concepts: [
        "Python uses indentation to define code blocks instead of braces or keywords.",
        "Python is dynamically typed, meaning variable types are determined at runtime.",
        "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
        "Python has a comprehensive standard library that provides tools for many common programming tasks.",
        "Python uses garbage collection for automatic memory management.",
      ],
      procedures: [
        "To define a variable in Python, use the syntax variable_name = value.",
        "To define a function, use def function_name(parameters): followed by indented code block.",
        "To create a class, use class ClassName: followed by class attributes and methods.",
        "To import a module, use import module_name or from module_name import specific_function.",
        "To handle exceptions, use try, except, finally blocks to catch and manage errors.",
      ],
      commands: [
        "python script.py - Execute a Python script from command line",
        "pip install package_name - Install a Python package using pip",
        "python -m pip install --upgrade pip - Upgrade pip to latest version",
        "python -c 'print(\"Hello\")' - Execute Python code directly from command line",
        "python -m venv myenv - Create a virtual environment",
      ],
      examples: [
        "Example: x = 5 assigns the integer 5 to variable x",
        "Example: def greet(name): return f'Hello, {name}!' defines a simple function",
        "Example: numbers = [1, 2, 3] creates a list with three integers",
        "Example: for i in range(5): print(i) prints numbers 0 through 4",
        "Example: class Dog: def __init__(self, name): self.name = name defines a simple class",
      ],
      warnings: [
        "Never use mutable default arguments in function definitions as they retain state between calls.",
        "Avoid using the same variable name for different types in the same scope to prevent confusion.",
        "Do not modify a list while iterating over it, as this can cause unexpected behavior.",
        "Never use from module import * as it pollutes the namespace and makes code hard to understand.",
        "Avoid comparing floating point numbers with exact equality due to precision issues.",
      ],
      bestPractices: [
        "Use meaningful variable names that describe the data they hold.",
        "Write docstrings for all functions and classes to explain their purpose.",
        "Follow PEP 8 style guidelines for consistent, readable Python code.",
        "Use list comprehensions for simple transformations instead of map and filter.",
        "Keep functions small and focused on a single responsibility.",
      ],
      commonMistakes: [
        "Forgetting to use self as the first parameter in instance methods.",
        "Modifying a list while iterating over it, causing skipped elements or errors.",
        "Using mutable default arguments which retain state between function calls.",
        "Confusing assignment (=) with equality comparison (==).",
        "Forgetting to call parent class __init__ in child class constructors.",
      ],
    },
    "git-version-control": {
      source: "Git Official Documentation",
      url: "https://git-scm.com/doc",
      definitions: [
        "Git is a distributed version control system that tracks changes in source code during software development.",
        "A repository in Git is a directory containing all project files and the complete revision history.",
        "A commit in Git is a snapshot of the repository at a specific point in time.",
        "A branch in Git is an independent line of development that allows parallel work.",
        "A merge in Git combines changes from different branches into a single branch.",
      ],
      concepts: [
        "Git uses a directed acyclic graph (DAG) to represent the history of commits.",
        "Git is distributed, meaning every developer has a complete copy of the repository history.",
        "Git uses SHA-1 hashes to uniquely identify commits and ensure data integrity.",
        "Git has a staging area (index) where changes are prepared before committing.",
        "Git supports both local and remote repositories for collaboration.",
      ],
      procedures: [
        "To initialize a new Git repository, run git init in the project directory.",
        "To stage changes for commit, use git add . or git add specific_file.",
        "To commit staged changes, use git commit -m 'descriptive message'.",
        "To create a new branch, use git branch branch_name and switch with git checkout branch_name.",
        "To merge a branch, use git merge branch_name while on the target branch.",
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
      ],
      examples: [
        "Example: git init followed by git add . and git commit -m 'Initial commit' starts version control",
        "Example: git clone https://github.com/user/repo.git copies a remote repository locally",
        "Example: git checkout -b feature/login creates and switches to a new feature branch",
        "Example: git merge feature/login combines the feature branch into the current branch",
        "Example: git stash saves uncommitted changes temporarily",
      ],
      warnings: [
        "Never commit sensitive information like API keys, passwords, or configuration files with secrets.",
        "Avoid rewriting public history as it causes problems for other collaborators.",
        "Do not commit large binary files directly to Git repositories.",
        "Never force push to shared branches unless absolutely necessary.",
        "Avoid committing files that can be generated (node_modules, build artifacts, etc.).",
      ],
      bestPractices: [
        "Write clear, descriptive commit messages that explain why a change was made.",
        "Create separate branches for each feature or bug fix.",
        "Use .gitignore to exclude unnecessary files from version control.",
        "Pull before pushing to avoid merge conflicts.",
        "Review code changes before committing to ensure quality.",
      ],
      commonMistakes: [
        "Forgetting to stage files before committing.",
        "Committing to the main branch instead of creating feature branches.",
        "Not pulling the latest changes before pushing, causing merge conflicts.",
        "Committing files that should be in .gitignore.",
        "Using unclear commit messages that don't explain the purpose of changes.",
      ],
    },
    "investing-basics": {
      source: "Investopedia & SEC Official Guidance",
      url: "https://www.investopedia.com/",
      definitions: [
        "A stock represents ownership in a corporation and a claim on part of the corporation's assets and earnings.",
        "A bond is a debt security where an investor loans money to an entity for a defined period at a fixed interest rate.",
        "An ETF (Exchange-Traded Fund) is a basket of securities that trades on an exchange like a single stock.",
        "A mutual fund is a professionally managed investment fund that pools money from many investors to purchase securities.",
        "An index fund is a mutual fund or ETF designed to track the performance of a specific market index.",
      ],
      concepts: [
        "Diversification reduces risk by spreading investments across different asset classes and sectors.",
        "Compound interest allows investments to grow exponentially as interest earns interest on itself.",
        "Risk and return are positively correlated - higher potential returns come with higher risk.",
        "Asset allocation determines the mix of stocks, bonds, and other assets in a portfolio.",
        "Market volatility refers to the degree of variation in trading prices over time.",
      ],
      procedures: [
        "To start investing, open a brokerage account and fund it with money you can afford to invest long-term.",
        "To build a diversified portfolio, allocate investments across different asset classes based on risk tolerance.",
        "To implement dollar-cost averaging, invest a fixed amount at regular intervals regardless of market conditions.",
        "To rebalance a portfolio, sell assets that have grown beyond target allocation and buy underweight assets.",
        "To assess investment performance, compare returns against appropriate benchmarks over the same period.",
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
      ],
      warnings: [
        "Never invest money you cannot afford to lose, especially in high-risk investments.",
        "Avoid trying to time the market as even professionals struggle to consistently predict market movements.",
        "Do not put all your money in a single investment or sector - diversification is essential.",
        "Never make investment decisions based on emotions like fear or greed.",
        "Avoid high-fee investment products that significantly reduce long-term returns.",
      ],
      bestPractices: [
        "Invest for the long term and avoid reacting to short-term market fluctuations.",
        "Maintain an emergency fund of 3-6 months expenses before investing.",
        "Understand your risk tolerance and invest accordingly.",
        "Take advantage of employer matching in 401(k) plans - this is free money.",
        "Regularly review and rebalance your portfolio to maintain target allocations.",
      ],
      commonMistakes: [
        "Investing without understanding the underlying investment or its risks.",
        "Chasing past performance instead of focusing on future potential.",
        "Paying high fees that eat into investment returns.",
        "Not diversifying adequately and concentrating risk in too few investments.",
        "Panic selling during market downturns and locking in losses.",
      ],
    },
    "data-structures": {
      source: "Computer Science Educational Resources",
      url: "https://en.wikipedia.org/wiki/Data_structure",
      definitions: [
        "An array is a collection of elements identified by index, typically stored in contiguous memory.",
        "A linked list is a linear data structure where elements are stored in nodes with pointers to the next node.",
        "A stack is a linear data structure following Last-In-First-Out (LIFO) principle, with push and pop operations.",
        "A queue is a linear data structure following First-In-First-Out (FIFO) principle, with enqueue and dequeue operations.",
        "A hash table is a data structure that maps keys to values using a hash function for efficient lookup.",
      ],
      concepts: [
        "Time complexity measures how algorithm performance scales with input size.",
        "Space complexity measures the memory usage of an algorithm relative to input size.",
        "Big O notation describes the upper bound of algorithm complexity in the worst case.",
        "Data structure choice affects algorithm efficiency for specific operations.",
        "Balanced trees maintain logarithmic height for efficient operations.",
      ],
      procedures: [
        "To choose a data structure, consider the operations needed (insert, delete, search) and their frequency.",
        "To implement a hash table, choose a good hash function and handle collisions with chaining or open addressing.",
        "To traverse a tree, use depth-first (pre-order, in-order, post-order) or breadth-first search.",
        "To balance a binary search tree, use algorithms like AVL or Red-Black tree rotations.",
        "To implement a graph, use adjacency matrix for dense graphs or adjacency list for sparse graphs.",
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
      ],
      warnings: [
        "Never use an array for frequent insertions and deletions as these are O(n) operations.",
        "Avoid recursion depth issues with deep recursive algorithms on large data structures.",
        "Do not use hash tables when ordered data access is required.",
        "Never assume default time complexity without considering edge cases.",
        "Avoid naive implementations that ignore memory locality and cache performance.",
      ],
      bestPractices: [
        "Choose data structures based on the most frequent operations in your use case.",
        "Consider both time and space complexity when selecting data structures.",
        "Use built-in library implementations when available as they are usually optimized.",
        "Document the rationale for data structure choices in code comments.",
        "Profile actual performance rather than relying solely on theoretical complexity.",
      ],
      commonMistakes: [
        "Using arrays for dynamic data when linked lists or dynamic arrays would be more efficient.",
        "Choosing complex data structures when simpler ones would suffice.",
        "Ignoring the impact of data structure choice on cache performance.",
        "Not considering worst-case scenarios in data structure operations.",
        "Implementing data structures from scratch when standard library implementations exist.",
      ],
    },
  };

  async extract(topicSlug: string, topicTitle: string, emptySlots: SlotInfo[]): Promise<RawCandidate[]> {
    const candidates: RawCandidate[] = [];
    const doc = this.topicMappings[topicSlug];

    if (!doc) {
      console.log(`No structured documentation found for topic: ${topicSlug}`);
      return candidates;
    }

    // Map structured fields to slots based on slot slug/title
    for (const slot of emptySlots) {
      const slotSlug = slot.slug.toLowerCase();
      const slotTitle = slot.title.toLowerCase();

      let description = "";
      let relevanceScore = 85;
      let metadata: Record<string, unknown> = {
        source: "structured_docs",
        source_url: doc.url,
        extraction_method: "structured_field_mapping",
      };

      // Map slot to appropriate structured field
      if (slotSlug.includes("definition") || slotTitle.includes("definition") || slotTitle.includes("what is")) {
        description = doc.definitions.slice(0, 3).join(". ");
        metadata.field_type = "definitions";
      } else if (slotSlug.includes("concept") || slotTitle.includes("concept") || slotTitle.includes("understanding")) {
        description = doc.concepts.slice(0, 3).join(". ");
        metadata.field_type = "concepts";
      } else if (slotSlug.includes("procedure") || slotTitle.includes("how to") || slotTitle.includes("step")) {
        description = doc.procedures.slice(0, 3).join(". ");
        metadata.field_type = "procedures";
      } else if (slotSlug.includes("command") || slotTitle.includes("command") || slotTitle.includes("syntax")) {
        description = doc.commands.slice(0, 3).join(". ");
        metadata.field_type = "commands";
      } else if (slotSlug.includes("example") || slotTitle.includes("example")) {
        description = doc.examples.slice(0, 3).join(". ");
        metadata.field_type = "examples";
      } else if (slotSlug.includes("warning") || slotTitle.includes("warning") || slotTitle.includes("avoid")) {
        description = doc.warnings.slice(0, 3).join(". ");
        metadata.field_type = "warnings";
      } else if (slotSlug.includes("best practice") || slotTitle.includes("best practice") || slotTitle.includes("practice")) {
        description = doc.bestPractices.slice(0, 3).join(". ");
        metadata.field_type = "best_practices";
      } else if (slotSlug.includes("mistake") || slotTitle.includes("mistake") || slotTitle.includes("common")) {
        description = doc.commonMistakes.slice(0, 3).join(". ");
        metadata.field_type = "common_mistakes";
      } else {
        // Generic fallback - use definitions
        description = doc.definitions.slice(0, 2).concat(doc.concepts.slice(0, 1)).join(". ");
        metadata.field_type = "generic";
        relevanceScore = 75;
      }

      if (description.length > 0) {
        candidates.push({
          slotId: slot.id,
          title: `${slot.title} - ${topicTitle}`,
          description: description,
          sourceUrl: doc.url,
          relevanceScore: relevanceScore,
          confidenceScore: 90, // High confidence for official docs
          attribution: {
            sourceName: doc.source,
            sourceUrl: doc.url,
            adapterName: this.adapterType,
            extractionMethod: "structured_field_mapping",
            discoveredAt: new Date().toISOString(),
          },
          metadata,
        });
      }
    }

    return candidates;
  }
}
