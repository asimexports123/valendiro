export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizDefinition {
  slug: string;
  title: string;
  passScorePercent: number;
  questions: QuizQuestion[];
}

export const PROGRAMMING_QUIZ: QuizDefinition = {
  slug: "programming-quiz",
  title: "Programming Basics Quiz",
  passScorePercent: 70,
  questions: [
    {
      id: "p1",
      question: "What does a variable store in a program?",
      options: ["A network address", "Data that can change while the program runs", "Only text files", "CPU temperature"],
      correctIndex: 1,
      explanation: "Variables hold data values that your program reads and updates during execution.",
    },
    {
      id: "p2",
      question: "Which structure repeats code while a condition is true?",
      options: ["Array", "Loop", "Compiler", "Comment"],
      correctIndex: 1,
      explanation: "Loops (for, while) repeat a block of code until a condition becomes false.",
    },
    {
      id: "p3",
      question: "What is a function?",
      options: ["A reusable block of code that performs a task", "A type of virus", "A database table", "A CSS colour"],
      correctIndex: 0,
      explanation: "Functions bundle logic so you can call it by name instead of duplicating code.",
    },
    {
      id: "p4",
      question: "Which data structure stores items in order with indexes?",
      options: ["Stack trace", "Array / list", "Firewall", "Pixel"],
      correctIndex: 1,
      explanation: "Arrays (or lists) keep ordered elements accessible by position, starting at index 0 in most languages.",
    },
    {
      id: "p5",
      question: "What does 'debugging' mean?",
      options: ["Deleting all code", "Finding and fixing errors in code", "Publishing to production", "Encrypting passwords"],
      correctIndex: 1,
      explanation: "Debugging is the process of locating defects and correcting them.",
    },
  ],
};

export const WEB_DEV_QUIZ: QuizDefinition = {
  slug: "web-development-quiz",
  title: "Web Development Quiz",
  passScorePercent: 70,
  questions: [
    {
      id: "w1",
      question: "What does HTML primarily define?",
      options: ["Page structure and content", "Server database queries", "GPU drivers", "Email delivery"],
      correctIndex: 0,
      explanation: "HTML marks up structure — headings, paragraphs, links, forms, and semantic sections.",
    },
    {
      id: "w2",
      question: "CSS is mainly used for:",
      options: ["Styling and layout", "Compiling C++", "Storing user passwords", "DNS routing"],
      correctIndex: 0,
      explanation: "CSS controls visual presentation: colours, spacing, typography, and responsive layout.",
    },
    {
      id: "w3",
      question: "Which HTTP method is typically used to fetch data?",
      options: ["GET", "DELETE", "PATCH", "CONNECT"],
      correctIndex: 0,
      explanation: "GET requests retrieve resources without changing server state.",
    },
    {
      id: "w4",
      question: "What is responsive design?",
      options: ["Layout that adapts to different screen sizes", "Faster CPU clocks", "A type of malware", "Server-side caching only"],
      correctIndex: 0,
      explanation: "Responsive sites reflow content so phones, tablets, and desktops all remain usable.",
    },
    {
      id: "w5",
      question: "An API allows:",
      options: ["Programs to communicate and exchange data", "Monitors to display 4K video", "Hard drives to spin faster", "HTML to replace CSS"],
      correctIndex: 0,
      explanation: "APIs define how clients and servers (or services) request and return structured data.",
    },
  ],
};

export const AI_BASICS_QUIZ: QuizDefinition = {
  slug: "ai-basics-quiz",
  title: "AI & Machine Learning Quiz",
  passScorePercent: 70,
  questions: [
    {
      id: "a1",
      question: "Machine learning models improve by:",
      options: ["Learning patterns from data", "Randomly guessing forever", "Ignoring all inputs", "Only reading manuals"],
      correctIndex: 0,
      explanation: "ML systems adjust internal parameters using examples so predictions improve on similar data.",
    },
    {
      id: "a2",
      question: "Labeled examples for training are called:",
      options: ["Supervised learning data", "Firewall rules", "HTML tags", "Cache keys"],
      correctIndex: 0,
      explanation: "In supervised learning each input is paired with the correct output label.",
    },
    {
      id: "a3",
      question: "Overfitting means the model:",
      options: ["Memorises training data but fails on new data", "Always performs perfectly", "Uses no parameters", "Runs without electricity"],
      correctIndex: 0,
      explanation: "Overfit models capture noise in training data and generalise poorly.",
    },
    {
      id: "a4",
      question: "A neural network consists of:",
      options: ["Interconnected layers of nodes (neurons)", "Only spreadsheets", "Physical robots only", "DNS servers"],
      correctIndex: 0,
      explanation: "Layers transform inputs step-by-step until the network produces an output.",
    },
    {
      id: "a5",
      question: "Large language models (LLMs) primarily predict:",
      options: ["The next token (word piece) in a sequence", "Stock prices with certainty", "Hardware temperatures", "Legal verdicts"],
      correctIndex: 0,
      explanation: "LLMs model language by estimating likely continuations — which enables text generation.",
    },
  ],
};

export const STOCK_MARKET_QUIZ: QuizDefinition = {
  slug: "stock-market-quiz",
  title: "Stock Market Basics Quiz",
  passScorePercent: 70,
  questions: [
    {
      id: "s1",
      question: "Owning a share of stock means you own:",
      options: ["A small piece of the company", "A government bond", "A fixed deposit", "The entire exchange"],
      correctIndex: 0,
      explanation: "Equity shares represent fractional ownership and often voting rights.",
    },
    {
      id: "s2",
      question: "A stock index (e.g. S&P 500) tracks:",
      options: ["A basket of representative companies", "One single stock only", "Currency exchange rates", "Commodity storage fees"],
      correctIndex: 0,
      explanation: "Indices summarise market segments by weighting many constituent stocks.",
    },
    {
      id: "s3",
      question: "Market capitalisation equals:",
      options: ["Share price × total shares outstanding", "Revenue ÷ debt", "Dividends × 10", "Employees × salary"],
      correctIndex: 0,
      explanation: "Market cap is the aggregate value the market assigns to all outstanding shares.",
    },
    {
      id: "s4",
      question: "Diversification helps:",
      options: ["Spread risk across many holdings", "Guarantee profits", "Eliminate all taxes", "Predict exact prices"],
      correctIndex: 0,
      explanation: "Holding varied assets reduces reliance on any single company's performance.",
    },
    {
      id: "s5",
      question: "A limit order:",
      options: ["Executes only at your specified price or better", "Always fills immediately at any price", "Cancels your brokerage account", "Pays dividends automatically"],
      correctIndex: 0,
      explanation: "Limit orders give price control but may not fill if the market never reaches your price.",
    },
  ],
};

export const FITNESS_QUIZ: QuizDefinition = {
  slug: "fitness-basics-quiz",
  title: "Fitness Fundamentals Quiz",
  passScorePercent: 70,
  questions: [
    {
      id: "f1",
      question: "Progressive overload means:",
      options: ["Gradually increasing training stress over time", "Never changing your workout", "Skipping rest days entirely", "Only training once a month"],
      correctIndex: 0,
      explanation: "Muscles adapt when load, volume, or intensity increases in a planned way.",
    },
    {
      id: "f2",
      question: "Rest days are important because:",
      options: ["They allow recovery and adaptation", "They erase all progress", "They replace nutrition", "They burn no calories so are useless"],
      correctIndex: 0,
      explanation: "Recovery is when tissues repair and strength gains consolidate.",
    },
    {
      id: "f3",
      question: "Compound exercises work:",
      options: ["Multiple joints and muscle groups", "Only one tiny muscle in isolation", "Nothing — only machines count", "Only your fingers"],
      correctIndex: 0,
      explanation: "Squats, deadlifts, and push-ups are compound movements that train coordinated patterns.",
    },
    {
      id: "f4",
      question: "Warm-ups before lifting help:",
      options: ["Prepare joints, muscles, and nervous system", "Guarantee zero soreness forever", "Replace proper form coaching", "Eliminate need for sleep"],
      correctIndex: 0,
      explanation: "Gradual warm-ups raise temperature and activate muscles for safer loading.",
    },
    {
      id: "f5",
      question: "Hydration during exercise matters because:",
      options: ["Fluid loss impairs performance and heat regulation", "Water builds muscle without training", "It removes all injury risk", "It replaces protein intake"],
      correctIndex: 0,
      explanation: "Even modest dehydration can reduce endurance and cognitive focus.",
    },
  ],
};

export const MENTAL_WELLNESS_QUIZ: QuizDefinition = {
  slug: "mental-wellness-quiz",
  title: "Mental Wellness Check-In Quiz",
  passScorePercent: 60,
  questions: [
    {
      id: "m1",
      question: "Mindfulness practice focuses on:",
      options: ["Paying attention to the present moment without harsh judgment", "Suppressing all emotions permanently", "Avoiding every stressful situation", "Diagnosing clinical disorders"],
      correctIndex: 0,
      explanation: "Mindfulness builds awareness of thoughts and sensations — not a substitute for therapy.",
    },
    {
      id: "m2",
      question: "Good sleep hygiene includes:",
      options: ["Consistent bed/wake times and a dark, cool room", "Caffeine before bed every night", "Screens in bed for hours", "Random sleep schedule daily"],
      correctIndex: 0,
      explanation: "Regular routines and environment cues help your body expect rest.",
    },
    {
      id: "m3",
      question: "Social connection can:",
      options: ["Support emotional resilience", "Replace professional care when needed", "Guarantee zero stress", "Remove need for exercise"],
      correctIndex: 0,
      explanation: "Supportive relationships buffer stress — but serious symptoms need qualified help.",
    },
    {
      id: "m4",
      question: "When stress feels overwhelming for weeks, you should:",
      options: ["Consider speaking with a qualified mental-health professional", "Ignore it until it disappears", "Self-diagnose using only online quizzes", "Isolate completely from everyone"],
      correctIndex: 0,
      explanation: "This quiz is educational only — persistent distress warrants professional support.",
    },
    {
      id: "m5",
      question: "Physical activity and mood are linked because:",
      options: ["Exercise can release endorphins and reduce stress hormones", "Exercise cures all mental illness alone", "Mood never affects the body", "Only medication changes mood"],
      correctIndex: 0,
      explanation: "Movement is one evidence-backed lifestyle factor alongside sleep, nutrition, and care.",
    },
  ],
};

export const QUIZ_BY_SLUG: Record<string, QuizDefinition> = {
  "programming-quiz": PROGRAMMING_QUIZ,
  "web-development-quiz": WEB_DEV_QUIZ,
  "ai-basics-quiz": AI_BASICS_QUIZ,
  "stock-market-quiz": STOCK_MARKET_QUIZ,
  "fitness-basics-quiz": FITNESS_QUIZ,
  "mental-wellness-quiz": MENTAL_WELLNESS_QUIZ,
};

export function getQuiz(slug: string): QuizDefinition | undefined {
  return QUIZ_BY_SLUG[slug];
}
