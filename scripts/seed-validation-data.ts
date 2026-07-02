/**
 * Realistic Data Seeder — Product Validation Phase
 *
 * Seeds 25 Knowledge Packages across 5 domains:
 *   1. Programming Languages (5 topics)
 *   2. Web Development (5 topics)
 *   3. Data Science (5 topics)
 *   4. Computer Science Fundamentals (5 topics)
 *   5. Software Engineering (5 topics)
 *
 * All knowledge is realistic, deterministic, and factually grounded.
 * No lorem ipsum. No placeholders.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import { assemble } from "../services/knowledge/assembler";
import { clearGlossaryCache } from "../services/knowledge/normalizer";
import { render } from "../services/renderer/orchestrator";
import type { AssemblyInput, CandidateInput } from "../services/knowledge/types";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

// ─── Topic Definitions ────────────────────────────────────────────────────────

interface TopicSeed {
  slug: string;
  domain: string;
  candidates: Omit<CandidateInput, "discoveryRunId">[];
}

const TOPICS: TopicSeed[] = [

  // ─── 1. Programming Languages ──────────────────────────────────────────────

  {
    slug: "javascript-fundamentals",
    domain: "Programming Languages",
    candidates: [
      {
        id: "js-wiki",
        title: "JavaScript Overview",
        description: "JavaScript is a high-level, interpreted programming language. JavaScript was created by Brendan Eich in 1995. JavaScript was originally developed for Netscape Navigator. JavaScript is the primary language for client-side web development. JavaScript follows the ECMAScript specification. JavaScript supports object-oriented, functional, and event-driven programming paradigms. JavaScript uses dynamic typing. JavaScript has first-class functions, meaning functions can be passed as arguments and returned from other functions.",
        sourceUrl: "https://en.wikipedia.org/wiki/JavaScript",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Programming Languages" },
      },
      {
        id: "js-mdn",
        title: "JavaScript MDN Reference",
        description: "JavaScript runs in web browsers and on servers via Node.js. JavaScript variables can be declared with var, let, or const. JavaScript let and const are block-scoped, while var is function-scoped. JavaScript arrays are zero-indexed ordered lists. JavaScript objects store key-value pairs. JavaScript supports asynchronous programming via callbacks, promises, and async/await. JavaScript closures allow functions to retain access to their lexical scope. Warning: avoid using var in modern JavaScript due to hoisting issues.",
        sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        adapterName: "DocsAdapter",
        sourceSlug: "mdn-web-docs",
        sourceAuthority: "official",
        metadata: { domain: "Programming Languages" },
      },
      {
        id: "js-guide",
        title: "JavaScript Best Practices",
        description: "JavaScript strict mode enables better error detection. To enable strict mode, add 'use strict' at the top of a file. JavaScript modules use import and export syntax. JavaScript arrow functions provide a concise syntax for function expressions. JavaScript template literals use backticks and support multi-line strings. JavaScript has grown from a browser scripting language into a full-stack development platform. JavaScript was standardized by ECMA International as ECMAScript.",
        sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        adapterName: "DocsAdapter",
        sourceSlug: "mdn-web-docs",
        sourceAuthority: "official",
        metadata: { domain: "Programming Languages" },
      },
    ],
  },

  {
    slug: "typescript-language",
    domain: "Programming Languages",
    candidates: [
      {
        id: "ts-wiki",
        title: "TypeScript Overview",
        description: "TypeScript is a strongly typed programming language that builds on JavaScript. TypeScript was developed by Microsoft and first released in 2012. TypeScript adds optional static typing to JavaScript. TypeScript code is transpiled to JavaScript before execution. TypeScript supports interfaces, enums, generics, and decorators. TypeScript helps catch errors at compile time rather than runtime. TypeScript is a superset of JavaScript, meaning all valid JavaScript is valid TypeScript.",
        sourceUrl: "https://en.wikipedia.org/wiki/TypeScript",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Programming Languages" },
      },
      {
        id: "ts-docs",
        title: "TypeScript Documentation",
        description: "TypeScript interfaces define the shape of objects. TypeScript generics allow writing reusable type-safe code. TypeScript type inference automatically deduces types from context. TypeScript union types allow a value to be one of several types. TypeScript intersection types combine multiple types into one. TypeScript enums define named constant values. TypeScript strict mode enables the most comprehensive type checking. TypeScript is widely adopted in large-scale JavaScript projects.",
        sourceUrl: "https://www.typescriptlang.org/docs/",
        adapterName: "DocsAdapter",
        sourceSlug: "typescript-docs",
        sourceAuthority: "official",
        metadata: { domain: "Programming Languages" },
      },
    ],
  },

  {
    slug: "rust-programming-language",
    domain: "Programming Languages",
    candidates: [
      {
        id: "rust-wiki",
        title: "Rust Language Overview",
        description: "Rust is a systems programming language focused on safety, performance, and concurrency. Rust was created by Graydon Hoare and first appeared in 2010. Rust is sponsored by Mozilla Research. Rust achieves memory safety without a garbage collector through its ownership system. Rust ownership rules prevent data races at compile time. Rust uses a borrow checker to enforce memory safety rules. Rust is consistently voted the most loved programming language in Stack Overflow surveys. Rust's performance is comparable to C and C++.",
        sourceUrl: "https://en.wikipedia.org/wiki/Rust_(programming_language)",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Programming Languages" },
      },
      {
        id: "rust-book",
        title: "The Rust Programming Language Book",
        description: "Rust ownership system consists of three rules: each value has one owner, ownership is transferred on assignment, and values are dropped when the owner goes out of scope. Rust references allow borrowing without taking ownership. Rust lifetimes ensure references remain valid for the required duration. Rust structs are custom data types that group related data. Rust enums represent data that can be one of several variants. Rust pattern matching with match expressions provides exhaustive case handling. To start a Rust project, install the toolchain using rustup. Warning: Rust has a steep learning curve due to its ownership model.",
        sourceUrl: "https://doc.rust-lang.org/book/",
        adapterName: "DocsAdapter",
        sourceSlug: "rust-docs",
        sourceAuthority: "official",
        metadata: { domain: "Programming Languages" },
      },
    ],
  },

  {
    slug: "go-programming-language",
    domain: "Programming Languages",
    candidates: [
      {
        id: "go-wiki",
        title: "Go Language Overview",
        description: "Go is an open-source programming language designed at Google. Go was created by Robert Griesemer, Rob Pike, and Ken Thompson. Go was first released in 2009. Go is designed for simplicity, reliability, and efficiency. Go has built-in concurrency support through goroutines and channels. Go compiles to a single binary with no external dependencies. Go has a garbage collector for automatic memory management. Go is widely used for building web servers, cloud tools, and CLI applications.",
        sourceUrl: "https://en.wikipedia.org/wiki/Go_(programming_language)",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Programming Languages" },
      },
      {
        id: "go-tour",
        title: "A Tour of Go",
        description: "Go goroutines are lightweight threads managed by the Go runtime. Go channels are typed conduits for sending and receiving values between goroutines. Go interfaces are satisfied implicitly without explicit declaration. Go packages organize code into reusable units. Go modules define dependency management for projects. Go error handling is explicit using return values rather than exceptions. To start a Go program, define a main function in the main package. Go has a fast compilation time compared to other compiled languages.",
        sourceUrl: "https://go.dev/tour/",
        adapterName: "DocsAdapter",
        sourceSlug: "go-docs",
        sourceAuthority: "official",
        metadata: { domain: "Programming Languages" },
      },
    ],
  },

  {
    slug: "sql-fundamentals",
    domain: "Programming Languages",
    candidates: [
      {
        id: "sql-wiki",
        title: "SQL Overview",
        description: "SQL stands for Structured Query Language. SQL is used to manage and query relational databases. SQL was developed at IBM in the early 1970s. SQL was standardized by ANSI in 1986. SQL supports four main data manipulation operations: SELECT, INSERT, UPDATE, and DELETE. SQL databases organize data in tables with rows and columns. SQL joins combine rows from two or more tables based on a related column. SQL is the most widely used language for database interaction.",
        sourceUrl: "https://en.wikipedia.org/wiki/SQL",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Programming Languages" },
      },
      {
        id: "sql-guide",
        title: "SQL Reference Guide",
        description: "SQL SELECT retrieves data from one or more tables. SQL WHERE clause filters rows based on specified conditions. SQL GROUP BY groups rows with the same values into summary rows. SQL ORDER BY sorts the result set in ascending or descending order. SQL indexes improve query performance on large tables. SQL primary keys uniquely identify each row in a table. SQL foreign keys create referential integrity between tables. SQL transactions ensure atomicity through COMMIT and ROLLBACK. Warning: avoid using SELECT * in production queries as it retrieves unnecessary columns.",
        sourceUrl: "https://www.w3schools.com/sql/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "w3schools",
        sourceAuthority: "community",
        metadata: { domain: "Programming Languages" },
      },
    ],
  },

  // ─── 2. Web Development ────────────────────────────────────────────────────

  {
    slug: "react-library",
    domain: "Web Development",
    candidates: [
      {
        id: "react-wiki",
        title: "React Overview",
        description: "React is a free and open-source front-end JavaScript library for building user interfaces. React was developed by Jordan Walke at Facebook and first released in 2013. React uses a component-based architecture where UIs are built from reusable components. React uses a virtual DOM to efficiently update the actual DOM. React components can be class-based or function-based. React hooks allow function components to use state and other React features. React JSX is a syntax extension that allows writing HTML-like markup inside JavaScript.",
        sourceUrl: "https://en.wikipedia.org/wiki/React_(software)",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Web Development" },
      },
      {
        id: "react-docs",
        title: "React Documentation",
        description: "React useState hook manages local component state. React useEffect hook handles side effects in function components. React props pass data from parent to child components. React state should be treated as immutable and updated through setter functions. React context API shares data between components without passing props manually. React keys identify which list items have changed, been added, or removed. React controlled components keep form state in component state. Warning: avoid modifying React state directly as it bypasses React's update mechanism.",
        sourceUrl: "https://react.dev/",
        adapterName: "DocsAdapter",
        sourceSlug: "react-docs",
        sourceAuthority: "official",
        metadata: { domain: "Web Development" },
      },
    ],
  },

  {
    slug: "nextjs-framework",
    domain: "Web Development",
    candidates: [
      {
        id: "nextjs-wiki",
        title: "Next.js Overview",
        description: "Next.js is an open-source web development framework created by Vercel. Next.js builds on React and adds server-side rendering and static site generation. Next.js was first released in 2016. Next.js file-based routing maps files in the pages or app directory to URL routes. Next.js supports incremental static regeneration for updating static content without full rebuilds. Next.js API routes allow building backend endpoints within the same project. Next.js has built-in image optimization, code splitting, and prefetching.",
        sourceUrl: "https://en.wikipedia.org/wiki/Next.js",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Web Development" },
      },
      {
        id: "nextjs-docs",
        title: "Next.js Documentation",
        description: "Next.js App Router uses the app directory for file-based routing. Next.js Server Components render on the server and reduce JavaScript sent to the client. Next.js Client Components use the 'use client' directive and run in the browser. Next.js getStaticProps fetches data at build time for static pages. Next.js getServerSideProps fetches data on every request for dynamic pages. Next.js dynamic routes use square bracket notation in file names. Next.js middleware runs before a request is completed and can rewrite, redirect, or modify the response. Next.js is deployed most efficiently on Vercel.",
        sourceUrl: "https://nextjs.org/docs",
        adapterName: "DocsAdapter",
        sourceSlug: "nextjs-docs",
        sourceAuthority: "official",
        metadata: { domain: "Web Development" },
      },
    ],
  },

  {
    slug: "css-fundamentals",
    domain: "Web Development",
    candidates: [
      {
        id: "css-wiki",
        title: "CSS Overview",
        description: "CSS stands for Cascading Style Sheets. CSS describes the presentation of HTML documents. CSS was first proposed by Håkon Wium Lie in 1994. CSS selectors target HTML elements for styling. CSS uses a box model where each element is a rectangular box with content, padding, border, and margin. CSS flexbox provides a one-dimensional layout system. CSS grid provides a two-dimensional layout system. CSS specificity determines which rules apply when multiple rules target the same element.",
        sourceUrl: "https://en.wikipedia.org/wiki/CSS",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Web Development" },
      },
      {
        id: "css-mdn",
        title: "CSS MDN Reference",
        description: "CSS custom properties (variables) use the -- prefix. CSS media queries apply styles conditionally based on device characteristics. CSS transitions animate changes between property values. CSS animations allow complex multi-step animations. CSS inheritance allows child elements to inherit properties from parents. CSS cascade determines which declarations apply when multiple rules conflict. CSS position property controls how an element is positioned in the document. Warning: avoid using !important as it makes debugging styles difficult.",
        sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS",
        adapterName: "DocsAdapter",
        sourceSlug: "mdn-web-docs",
        sourceAuthority: "official",
        metadata: { domain: "Web Development" },
      },
    ],
  },

  {
    slug: "restful-apis",
    domain: "Web Development",
    candidates: [
      {
        id: "rest-wiki",
        title: "REST API Overview",
        description: "REST stands for Representational State Transfer. REST is an architectural style for distributed hypermedia systems defined by Roy Fielding in 2000. REST APIs use standard HTTP methods to perform operations on resources. REST GET requests retrieve a resource without modifying it. REST POST requests create a new resource. REST PUT requests replace an existing resource. REST DELETE requests remove a resource. REST APIs are stateless, meaning each request contains all information needed to process it. REST resources are identified by URIs.",
        sourceUrl: "https://en.wikipedia.org/wiki/REST",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Web Development" },
      },
      {
        id: "rest-guide",
        title: "REST API Design Guide",
        description: "REST API versioning prevents breaking changes for existing clients. REST API authentication commonly uses JWT tokens or API keys. REST API responses should use appropriate HTTP status codes. HTTP 200 means success, 201 means created, 400 means bad request, 401 means unauthorized, 404 means not found, and 500 means server error. REST API pagination handles large datasets by returning results in pages. REST APIs should return consistent error response formats. REST HATEOAS principle includes links in responses to guide clients. Warning: avoid exposing internal database IDs directly in REST API URLs.",
        sourceUrl: "https://restfulapi.net/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "restfulapi-net",
        sourceAuthority: "community",
        metadata: { domain: "Web Development" },
      },
    ],
  },

  {
    slug: "html-fundamentals",
    domain: "Web Development",
    candidates: [
      {
        id: "html-wiki",
        title: "HTML Overview",
        description: "HTML stands for HyperText Markup Language. HTML is the standard markup language for creating web pages. HTML was created by Tim Berners-Lee in 1991. HTML5 is the current standard, released in 2014. HTML documents are structured as a tree of elements. HTML semantic elements like header, nav, main, article, section, and footer describe content meaning. HTML attributes provide additional information about elements. HTML forms collect user input and submit data to servers.",
        sourceUrl: "https://en.wikipedia.org/wiki/HTML",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Web Development" },
      },
      {
        id: "html-mdn",
        title: "HTML MDN Reference",
        description: "HTML head element contains metadata not displayed on the page. HTML body element contains all visible page content. HTML heading elements h1 through h6 define six levels of headings. HTML anchor elements create hyperlinks to other pages or resources. HTML img elements embed images with a required alt attribute for accessibility. HTML input elements create interactive form controls. HTML div and span are generic container elements without semantic meaning. HTML accessibility requires proper use of ARIA attributes and semantic elements.",
        sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML",
        adapterName: "DocsAdapter",
        sourceSlug: "mdn-web-docs",
        sourceAuthority: "official",
        metadata: { domain: "Web Development" },
      },
    ],
  },

  // ─── 3. Data Science ───────────────────────────────────────────────────────

  {
    slug: "machine-learning-fundamentals",
    domain: "Data Science",
    candidates: [
      {
        id: "ml-wiki",
        title: "Machine Learning Overview",
        description: "Machine learning is a branch of artificial intelligence focused on building systems that learn from data. Machine learning was formally defined by Arthur Samuel in 1959. Machine learning algorithms improve through experience without being explicitly programmed. Machine learning has three main types: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning trains models on labeled data. Unsupervised learning finds patterns in unlabeled data. Reinforcement learning trains agents through rewards and penalties. Machine learning is widely applied in image recognition, natural language processing, and recommendation systems.",
        sourceUrl: "https://en.wikipedia.org/wiki/Machine_learning",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Data Science" },
      },
      {
        id: "ml-guide",
        title: "Machine Learning Fundamentals Guide",
        description: "Machine learning models learn from training data to make predictions on new data. Machine learning features are the input variables used for training. Machine learning labels are the output variables predicted by supervised models. Machine learning overfitting occurs when a model learns the training data too well and performs poorly on new data. Machine learning cross-validation evaluates model performance on multiple data splits. Machine learning regularization prevents overfitting by penalizing model complexity. Training set, validation set, and test set are the three standard data splits. Warning: never use test data during model training as it leads to overly optimistic performance estimates.",
        sourceUrl: "https://scikit-learn.org/stable/",
        adapterName: "DocsAdapter",
        sourceSlug: "sklearn-docs",
        sourceAuthority: "official",
        metadata: { domain: "Data Science" },
      },
    ],
  },

  {
    slug: "pandas-data-analysis",
    domain: "Data Science",
    candidates: [
      {
        id: "pandas-wiki",
        title: "Pandas Library Overview",
        description: "Pandas is an open-source data analysis and manipulation library for Python. Pandas was created by Wes McKinney and first released in 2008. Pandas provides two primary data structures: Series for one-dimensional data and DataFrame for two-dimensional data. Pandas is built on top of NumPy. Pandas is widely used for data cleaning, transformation, and analysis. Pandas supports reading and writing to CSV, Excel, JSON, SQL, and many other formats.",
        sourceUrl: "https://en.wikipedia.org/wiki/Pandas_(software)",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Data Science" },
      },
      {
        id: "pandas-docs",
        title: "Pandas Documentation",
        description: "Pandas DataFrame is a two-dimensional labeled data structure with columns of potentially different types. Pandas read_csv reads a CSV file into a DataFrame. Pandas groupby groups data by one or more columns for aggregate operations. Pandas merge combines DataFrames on common columns similar to SQL joins. Pandas dropna removes rows with missing values. Pandas fillna replaces missing values with specified values. Pandas apply applies a function along an axis of the DataFrame. To install pandas, run pip install pandas. Pandas loc selects rows and columns by label, while iloc selects by integer position.",
        sourceUrl: "https://pandas.pydata.org/docs/",
        adapterName: "DocsAdapter",
        sourceSlug: "pandas-docs",
        sourceAuthority: "official",
        metadata: { domain: "Data Science" },
      },
    ],
  },

  {
    slug: "neural-networks",
    domain: "Data Science",
    candidates: [
      {
        id: "nn-wiki",
        title: "Neural Networks Overview",
        description: "Artificial neural networks are computing systems loosely inspired by biological neural networks in animal brains. Neural networks consist of layers of interconnected nodes called neurons. Neural networks have an input layer, one or more hidden layers, and an output layer. Deep learning refers to neural networks with many hidden layers. Neural networks learn by adjusting weights through a process called backpropagation. Activation functions introduce non-linearity into neural networks. Convolutional neural networks are specialized for image processing tasks. Recurrent neural networks handle sequential data such as text and time series.",
        sourceUrl: "https://en.wikipedia.org/wiki/Artificial_neural_network",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Data Science" },
      },
      {
        id: "nn-guide",
        title: "Neural Network Fundamentals Guide",
        description: "Neural network training uses gradient descent to minimize a loss function. Neural network batch size determines how many samples are processed before updating weights. Neural network learning rate controls how much weights are adjusted during training. Neural network epochs define how many times the entire dataset is processed during training. Dropout regularization randomly disables neurons during training to prevent overfitting. Batch normalization stabilizes and accelerates neural network training. Neural networks require large amounts of labeled training data to perform well. Warning: deep neural networks require significant computational resources, typically GPUs.",
        sourceUrl: "https://www.deeplearning.ai/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "deeplearning-ai",
        sourceAuthority: "community",
        metadata: { domain: "Data Science" },
      },
    ],
  },

  {
    slug: "data-visualization",
    domain: "Data Science",
    candidates: [
      {
        id: "dataviz-wiki",
        title: "Data Visualization Overview",
        description: "Data visualization is the graphical representation of information and data. Data visualization tools provide an accessible way to identify patterns, trends, and outliers. Data visualization originated in cartography and statistical graphics in the 17th and 18th centuries. Effective data visualization communicates complex information clearly and efficiently. Common chart types include bar charts, line charts, scatter plots, pie charts, and heat maps. Data visualization is fundamental to exploratory data analysis.",
        sourceUrl: "https://en.wikipedia.org/wiki/Data_visualization",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Data Science" },
      },
      {
        id: "dataviz-guide",
        title: "Data Visualization Best Practices",
        description: "Bar charts compare discrete categories of data. Line charts show trends over time. Scatter plots reveal correlation between two continuous variables. Histograms show the distribution of a single continuous variable. Heat maps visualize magnitude across two dimensions using color intensity. Python matplotlib is the foundational plotting library for data science. Python seaborn builds on matplotlib for statistical visualization. JavaScript D3.js enables custom interactive data visualizations in the browser. Color choice in data visualization should be accessible to colorblind users. Warning: three-dimensional charts often distort data perception and should be avoided.",
        sourceUrl: "https://matplotlib.org/stable/",
        adapterName: "DocsAdapter",
        sourceSlug: "matplotlib-docs",
        sourceAuthority: "official",
        metadata: { domain: "Data Science" },
      },
    ],
  },

  {
    slug: "statistics-fundamentals",
    domain: "Data Science",
    candidates: [
      {
        id: "stats-wiki",
        title: "Statistics Overview",
        description: "Statistics is the science of collecting, analyzing, interpreting, and presenting data. Statistics is divided into descriptive statistics and inferential statistics. Descriptive statistics summarizes data using measures like mean, median, and standard deviation. Inferential statistics draws conclusions about a population from a sample. Mean is the arithmetic average of a dataset. Median is the middle value when data is sorted. Standard deviation measures how spread out values are from the mean. Normal distribution is a symmetric bell-shaped probability distribution fundamental to statistics.",
        sourceUrl: "https://en.wikipedia.org/wiki/Statistics",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Data Science" },
      },
      {
        id: "stats-guide",
        title: "Statistics for Data Science Guide",
        description: "Probability measures the likelihood of an event occurring on a scale from 0 to 1. Hypothesis testing evaluates claims about populations using sample data. P-value represents the probability of observing results at least as extreme as the actual results under the null hypothesis. A p-value below 0.05 is conventionally considered statistically significant. Correlation measures the strength of the linear relationship between two variables. Correlation ranges from -1 to 1, where 0 means no correlation. Regression models the relationship between dependent and independent variables. Warning: correlation does not imply causation.",
        sourceUrl: "https://scipy.org/",
        adapterName: "DocsAdapter",
        sourceSlug: "scipy-docs",
        sourceAuthority: "official",
        metadata: { domain: "Data Science" },
      },
    ],
  },

  // ─── 4. Computer Science Fundamentals ─────────────────────────────────────

  {
    slug: "algorithms-fundamentals",
    domain: "Computer Science",
    candidates: [
      {
        id: "algo-wiki",
        title: "Algorithms Overview",
        description: "An algorithm is a finite sequence of instructions to solve a problem or accomplish a task. Algorithms are fundamental to computer science. Algorithm time complexity measures how runtime grows with input size. Algorithm space complexity measures memory usage relative to input size. Big O notation describes algorithm complexity in terms of worst-case growth. Sorting algorithms arrange data in a defined order. Searching algorithms find elements within data structures. Efficient algorithms are critical for scalable software systems.",
        sourceUrl: "https://en.wikipedia.org/wiki/Algorithm",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Computer Science" },
      },
      {
        id: "algo-guide",
        title: "Algorithm Complexity Guide",
        description: "O(1) constant time algorithms execute in the same time regardless of input size. O(log n) logarithmic time algorithms halve the search space on each step, like binary search. O(n) linear time algorithms process each element once, like linear search. O(n log n) algorithms include efficient sorting algorithms like merge sort and quicksort. O(n²) quadratic time algorithms include bubble sort and insertion sort. Binary search requires a sorted array and runs in O(log n) time. Merge sort divides the array in half recursively and merges sorted halves. Quicksort selects a pivot and partitions elements around it.",
        sourceUrl: "https://www.cs.princeton.edu/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "princeton-cs",
        sourceAuthority: "community",
        metadata: { domain: "Computer Science" },
      },
    ],
  },

  {
    slug: "data-structures",
    domain: "Computer Science",
    candidates: [
      {
        id: "ds-wiki",
        title: "Data Structures Overview",
        description: "A data structure is a way of organizing data for efficient access and modification. Data structures are fundamental to algorithm design and computer science. Arrays store elements in contiguous memory locations with O(1) random access. Linked lists store elements in nodes connected by pointers. Stacks are last-in-first-out data structures. Queues are first-in-first-out data structures. Trees are hierarchical data structures with a root node and child nodes. Hash tables provide O(1) average-time lookups using hash functions. Graphs consist of vertices connected by edges.",
        sourceUrl: "https://en.wikipedia.org/wiki/Data_structure",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Computer Science" },
      },
      {
        id: "ds-guide",
        title: "Data Structures Implementation Guide",
        description: "Array insertion at the end is O(1), but insertion at the beginning is O(n). Linked list insertion at the head is O(1) but random access is O(n). Binary search tree lookup, insertion, and deletion are O(log n) on average. Hash table collisions can be resolved by chaining or open addressing. Stack operations push and pop are O(1). Queue enqueue and dequeue operations are O(1). Heap data structure enables O(log n) insertion and O(1) min or max retrieval. Graph breadth-first search explores nodes level by level. Graph depth-first search explores as far as possible along each branch.",
        sourceUrl: "https://www.geeksforgeeks.org/data-structures/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "geeksforgeeks",
        sourceAuthority: "community",
        metadata: { domain: "Computer Science" },
      },
    ],
  },

  {
    slug: "operating-systems",
    domain: "Computer Science",
    candidates: [
      {
        id: "os-wiki",
        title: "Operating Systems Overview",
        description: "An operating system is software that manages computer hardware and software resources. The operating system acts as an intermediary between programs and computer hardware. Operating systems provide process management, memory management, file systems, and I/O management. Linux is an open-source operating system kernel created by Linus Torvalds in 1991. Windows is the most widely used desktop operating system developed by Microsoft. macOS is the operating system for Apple computers. The kernel is the core component of an operating system with full hardware access.",
        sourceUrl: "https://en.wikipedia.org/wiki/Operating_system",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Computer Science" },
      },
      {
        id: "os-guide",
        title: "Operating System Concepts Guide",
        description: "Process is an instance of a program in execution with its own memory space. Thread is a unit of execution within a process that shares memory with other threads. CPU scheduling determines which process runs on the processor at a given time. Virtual memory extends available memory by using disk storage as overflow. File system organizes and stores files on storage devices. Deadlock occurs when processes wait indefinitely for resources held by each other. Mutex prevents multiple threads from accessing a shared resource simultaneously. Operating system context switching saves and restores process state when switching between processes.",
        sourceUrl: "https://www.os-book.com/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "os-book",
        sourceAuthority: "community",
        metadata: { domain: "Computer Science" },
      },
    ],
  },

  {
    slug: "computer-networks",
    domain: "Computer Science",
    candidates: [
      {
        id: "net-wiki",
        title: "Computer Networks Overview",
        description: "A computer network is a set of computers sharing resources located on or provided by network nodes. Computer networks enable communication and resource sharing between devices. The OSI model defines seven layers of network communication: Physical, Data Link, Network, Transport, Session, Presentation, and Application. TCP/IP is the foundational protocol suite of the internet. IP addresses uniquely identify devices on a network. DNS translates domain names to IP addresses. HTTP is the protocol for transferring hypertext over the web. HTTPS is the secure version of HTTP using TLS encryption.",
        sourceUrl: "https://en.wikipedia.org/wiki/Computer_network",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Computer Science" },
      },
      {
        id: "net-guide",
        title: "Networking Concepts Guide",
        description: "TCP provides reliable, ordered, and error-checked delivery of data between applications. UDP provides fast, connectionless communication without guaranteed delivery. IPv4 uses 32-bit addresses allowing approximately 4.3 billion unique addresses. IPv6 uses 128-bit addresses to address IPv4 address exhaustion. Subnet mask divides an IP address into network and host portions. Router forwards packets between different networks. Switch connects devices within the same network. Firewall monitors and controls incoming and outgoing network traffic based on rules. Latency measures the time for data to travel from source to destination.",
        sourceUrl: "https://www.cloudflare.com/learning/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "cloudflare-learning",
        sourceAuthority: "community",
        metadata: { domain: "Computer Science" },
      },
    ],
  },

  {
    slug: "database-design",
    domain: "Computer Science",
    candidates: [
      {
        id: "db-wiki",
        title: "Database Design Overview",
        description: "A database is an organized collection of structured data stored electronically. Relational databases store data in tables with predefined schemas. NoSQL databases store data in flexible formats like documents, key-value pairs, graphs, or column families. Database normalization reduces data redundancy and improves data integrity. First normal form requires atomic values and no repeating groups. Second normal form requires all non-key attributes to depend on the entire primary key. Third normal form requires no transitive dependencies between non-key attributes. ACID properties ensure reliable database transactions: Atomicity, Consistency, Isolation, and Durability.",
        sourceUrl: "https://en.wikipedia.org/wiki/Database",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Computer Science" },
      },
      {
        id: "db-guide",
        title: "Database Design Best Practices",
        description: "Entity-relationship diagrams model database structure before implementation. Primary key uniquely identifies each record in a table. Foreign key links records between related tables. Index structures improve query performance at the cost of additional storage. Composite index covers multiple columns for queries filtering on several fields. PostgreSQL is an advanced open-source relational database supporting complex queries. Database connection pooling reuses connections to avoid the overhead of creating new ones. Database transactions group multiple operations that either all succeed or all fail. Warning: avoid storing business logic in database stored procedures as it reduces portability.",
        sourceUrl: "https://www.postgresql.org/docs/",
        adapterName: "DocsAdapter",
        sourceSlug: "postgresql-docs",
        sourceAuthority: "official",
        metadata: { domain: "Computer Science" },
      },
    ],
  },

  // ─── 5. Software Engineering ───────────────────────────────────────────────

  {
    slug: "git-version-control",
    domain: "Software Engineering",
    candidates: [
      {
        id: "git-wiki",
        title: "Git Overview",
        description: "Git is a free and open-source distributed version control system. Git was created by Linus Torvalds in 2005 for managing Linux kernel development. Git tracks changes to source code over time. Git allows multiple developers to collaborate on the same codebase. Git repositories store the complete history of all changes. Git branching allows developers to work on features in isolation. GitHub, GitLab, and Bitbucket are popular hosting platforms for Git repositories. Git is the most widely used version control system in software development.",
        sourceUrl: "https://en.wikipedia.org/wiki/Git",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Software Engineering" },
      },
      {
        id: "git-guide",
        title: "Git Command Reference",
        description: "Git init creates a new repository. Git clone copies an existing repository. Git add stages changes for the next commit. Git commit saves staged changes with a descriptive message. Git push uploads local commits to a remote repository. Git pull fetches and merges remote changes into the current branch. Git branch creates, lists, or deletes branches. Git merge combines two branches into one. Git rebase replays commits on top of another branch for a cleaner history. Git stash temporarily saves uncommitted changes. To undo the last commit while keeping changes staged, run git reset --soft HEAD~1. Warning: avoid force-pushing to shared branches as it rewrites history for all collaborators.",
        sourceUrl: "https://git-scm.com/docs",
        adapterName: "DocsAdapter",
        sourceSlug: "git-docs",
        sourceAuthority: "official",
        metadata: { domain: "Software Engineering" },
      },
    ],
  },

  {
    slug: "docker-containers",
    domain: "Software Engineering",
    candidates: [
      {
        id: "docker-wiki",
        title: "Docker Overview",
        description: "Docker is an open-source platform for developing, shipping, and running applications in containers. Docker was created by Solomon Hykes and first released in 2013. Containers package code and its dependencies together for reliable execution across environments. Docker images are read-only templates used to create containers. Docker containers are running instances of images. Docker Hub is a registry for sharing and distributing Docker images. Containers are more lightweight than virtual machines as they share the host OS kernel. Docker Compose defines and manages multi-container applications.",
        sourceUrl: "https://en.wikipedia.org/wiki/Docker_(software)",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Software Engineering" },
      },
      {
        id: "docker-docs",
        title: "Docker Documentation",
        description: "Dockerfile defines the steps to build a Docker image. Docker FROM instruction sets the base image. Docker RUN instruction executes commands during image build. Docker COPY instruction copies files from host to the image. Docker EXPOSE instruction documents which port the container listens on. Docker CMD instruction sets the default command to run when starting a container. To build an image, run docker build -t image-name. To run a container, run docker run image-name. Docker volumes persist data between container restarts. Warning: avoid running containers as root in production as it creates security vulnerabilities.",
        sourceUrl: "https://docs.docker.com/",
        adapterName: "DocsAdapter",
        sourceSlug: "docker-docs",
        sourceAuthority: "official",
        metadata: { domain: "Software Engineering" },
      },
    ],
  },

  {
    slug: "software-testing",
    domain: "Software Engineering",
    candidates: [
      {
        id: "test-wiki",
        title: "Software Testing Overview",
        description: "Software testing is the process of evaluating a software system to find defects. Software testing improves quality and reduces the risk of failures in production. Unit testing verifies individual components or functions in isolation. Integration testing verifies that components work together correctly. End-to-end testing verifies complete user workflows from start to finish. Test-driven development writes tests before writing the implementation code. Code coverage measures how much of the codebase is executed by tests. Regression testing ensures new changes do not break existing functionality.",
        sourceUrl: "https://en.wikipedia.org/wiki/Software_testing",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Software Engineering" },
      },
      {
        id: "test-guide",
        title: "Testing Best Practices Guide",
        description: "Unit tests should be fast, isolated, and independent of external systems. Mocks replace real dependencies with controllable substitutes during testing. Test fixtures provide consistent starting data for tests. Assertions verify that actual output matches expected output. The testing pyramid recommends many unit tests, fewer integration tests, and minimal end-to-end tests. Continuous integration runs tests automatically on every code change. Mutation testing verifies test quality by introducing deliberate bugs. Test coverage above 80% is a commonly accepted threshold for production code. Warning: high test coverage does not guarantee correctness — tests must also verify meaningful behavior.",
        sourceUrl: "https://martinfowler.com/testing/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "martinfowler",
        sourceAuthority: "community",
        metadata: { domain: "Software Engineering" },
      },
    ],
  },

  {
    slug: "design-patterns",
    domain: "Software Engineering",
    candidates: [
      {
        id: "dp-wiki",
        title: "Software Design Patterns Overview",
        description: "Software design patterns are reusable solutions to commonly occurring problems in software design. Design patterns were popularized by the 'Gang of Four' book published in 1994. Design patterns are categorized as creational, structural, and behavioral patterns. Creational patterns deal with object creation mechanisms. Structural patterns deal with composition of classes or objects. Behavioral patterns deal with communication between objects. Singleton pattern ensures a class has only one instance. Factory pattern creates objects without specifying the exact class. Observer pattern notifies multiple objects when another object changes state.",
        sourceUrl: "https://en.wikipedia.org/wiki/Software_design_pattern",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Software Engineering" },
      },
      {
        id: "dp-guide",
        title: "Design Patterns Implementation Guide",
        description: "Singleton pattern restricts instantiation of a class to a single instance. Factory method pattern defines an interface for creating an object but lets subclasses decide which class to instantiate. Abstract factory provides an interface for creating families of related objects. Builder pattern constructs complex objects step by step. Decorator pattern attaches additional responsibilities to an object dynamically. Strategy pattern defines a family of algorithms and makes them interchangeable. Command pattern encapsulates a request as an object for parameterization and queuing. Repository pattern abstracts the data access layer from business logic. SOLID principles guide object-oriented design: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.",
        sourceUrl: "https://refactoring.guru/design-patterns",
        adapterName: "WikipediaAdapter",
        sourceSlug: "refactoring-guru",
        sourceAuthority: "community",
        metadata: { domain: "Software Engineering" },
      },
    ],
  },

  {
    slug: "agile-development",
    domain: "Software Engineering",
    candidates: [
      {
        id: "agile-wiki",
        title: "Agile Development Overview",
        description: "Agile software development is an iterative approach to software development. The Agile Manifesto was published in 2001 by seventeen software developers. Agile values individuals and interactions over processes and tools. Agile values working software over comprehensive documentation. Agile values customer collaboration over contract negotiation. Agile values responding to change over following a plan. Scrum is the most widely adopted Agile framework. Kanban is a visual workflow management method originating from Toyota manufacturing.",
        sourceUrl: "https://en.wikipedia.org/wiki/Agile_software_development",
        adapterName: "WikipediaAdapter",
        sourceSlug: "wikipedia-en",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "Software Engineering" },
      },
      {
        id: "agile-guide",
        title: "Agile Practices Guide",
        description: "Scrum sprint is a fixed time-box of one to four weeks for completing a set of work. Scrum sprint planning determines what work will be accomplished in the sprint. Daily standup is a short daily meeting where team members share progress and blockers. Sprint review demonstrates completed work to stakeholders at the end of each sprint. Sprint retrospective reflects on the process to improve for the next sprint. User stories describe features from the end-user perspective using the format: as a user, I want to, so that. Story points estimate the relative effort of user stories. Velocity measures how many story points a team completes per sprint. Continuous delivery deploys every code change that passes automated tests to production.",
        sourceUrl: "https://www.scrum.org/",
        adapterName: "WikipediaAdapter",
        sourceSlug: "scrum-org",
        sourceAuthority: "community",
        metadata: { domain: "Software Engineering" },
      },
    ],
  },

];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Product Validation Data Seeder ===\n");
  console.log(`Target: ${TOPICS.length} knowledge packages\n`);

  // Get a discovery run ID
  const { data: runs } = await sb.from("discovery_runs").select("id").limit(1);
  const runId = runs?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";

  let assembled = 0;
  let rendered = 0;
  let skipped = 0;
  let errors = 0;

  const results: Array<{
    slug: string;
    domain: string;
    facts: number;
    score: number;
    status: string;
  }> = [];

  for (const topic of TOPICS) {
    process.stdout.write(`  [${assembled + skipped + errors + 1}/${TOPICS.length}] ${topic.slug} ... `);

    // Check if already exists
    const { data: existing } = await sb
      .from("knowledge_packages")
      .select("id, fact_count")
      .eq("slug", topic.slug)
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log(`SKIP (exists, ${existing.fact_count} facts)`);
      skipped++;

      // Still render if needed
      try {
        const renderResult = await render({
          packageId: existing.id,
          format: "html",
          forceRerender: false,
        });
        results.push({
          slug: topic.slug, domain: topic.domain,
          facts: existing.fact_count, score: renderResult.qualityScore.overall,
          status: renderResult.status,
        });
        rendered++;
      } catch {}
      continue;
    }

    try {
      clearGlossaryCache();

      const candidates: CandidateInput[] = topic.candidates.map((c) => ({
        ...c,
        discoveryRunId: runId,
      }));

      const input: AssemblyInput = {
        slotId: null,
        topicId: null,
        slug: topic.slug,
        candidates,
      };

      const report = await assemble(input);

      // Render immediately
      const renderResult = await render({
        packageId: report.packageId,
        format: "html",
        forceRerender: true,
      });

      console.log(`OK (${report.factsCreated} facts, score: ${renderResult.qualityScore.overall})`);

      results.push({
        slug: topic.slug, domain: topic.domain,
        facts: report.factsCreated, score: renderResult.qualityScore.overall,
        status: renderResult.status,
      });

      assembled++;
      rendered++;
    } catch (err: any) {
      console.log(`ERROR: ${err?.message?.slice(0, 60)}`);
      errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  // Summary
  console.log(`\n${"─".repeat(60)}`);
  console.log(`\nSummary:`);
  console.log(`  Assembled:  ${assembled}`);
  console.log(`  Skipped:    ${skipped} (already existed)`);
  console.log(`  Rendered:   ${rendered}`);
  console.log(`  Errors:     ${errors}`);
  console.log(`  Total:      ${assembled + skipped}`);

  // By domain
  const byDomain: Record<string, typeof results> = {};
  for (const r of results) {
    if (!byDomain[r.domain]) byDomain[r.domain] = [];
    byDomain[r.domain].push(r);
  }

  console.log(`\nBy Domain:`);
  for (const [domain, items] of Object.entries(byDomain)) {
    const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
    const totalFacts = items.reduce((s, i) => s + i.facts, 0);
    console.log(`  ${domain}: ${items.length} packages, ${totalFacts} facts, avg score ${avgScore}`);
  }

  // Average quality score
  const allScores = results.map((r) => r.score).filter((s) => s > 0);
  if (allScores.length > 0) {
    const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    console.log(`\n  Average Quality Score: ${avg}/100`);
  }

  console.log(`\n=== Seeding Complete ===`);
}

main().catch(console.error);
