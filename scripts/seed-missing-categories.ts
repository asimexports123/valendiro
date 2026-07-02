/**
 * Seed topics + knowledge packages for all empty categories.
 * Creates the minimum viable content to make every category navigable.
 * Each topic gets enough facts to produce 300+ word articles via the renderer.
 */

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;

import { createClient } from "@supabase/supabase-js";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Topic definitions per subcategory ─────────────────────────────────────────
// Each entry: subcategorySlug, topicSlug, title, subtitle, facts[]
// Facts must be real educational sentences (7+ words, contains a verb).

interface TopicSeed {
  subcategorySlug: string;
  topicSlug: string;
  title: string;
  subtitle: string;
  facts: { fact_type: string; statement: string; confidence: string }[];
}

const TOPIC_SEEDS: TopicSeed[] = [
  // ── PERSONAL FINANCE ──────────────────────────────────────────────────────
  {
    subcategorySlug: "personal-finance-basics",
    topicSlug: "budgeting-fundamentals",
    title: "Budgeting Fundamentals",
    subtitle: "How to track income, manage expenses, and build financial control",
    facts: [
      { fact_type: "definition", statement: "A budget is a financial plan that estimates income and expenses over a specific period.", confidence: "verified" },
      { fact_type: "definition", statement: "Budgeting is the process of creating a plan for how to spend your money.", confidence: "verified" },
      { fact_type: "property", statement: "The 50/30/20 rule allocates 50 percent of income to needs, 30 percent to wants, and 20 percent to savings.", confidence: "verified" },
      { fact_type: "property", statement: "Zero-based budgeting requires every dollar of income to be assigned a specific purpose.", confidence: "verified" },
      { fact_type: "property", statement: "A budget helps identify unnecessary expenses and redirect money toward financial goals.", confidence: "verified" },
      { fact_type: "historical", statement: "Envelope budgeting was popularized in the early 20th century as a physical cash management system.", confidence: "medium" },
      { fact_type: "rule", statement: "An emergency fund should cover three to six months of living expenses before investing aggressively.", confidence: "verified" },
      { fact_type: "property", statement: "Fixed expenses such as rent and loan payments remain constant each month.", confidence: "verified" },
      { fact_type: "property", statement: "Variable expenses such as groceries and entertainment change from month to month.", confidence: "verified" },
      { fact_type: "procedural", statement: "To create a budget, list all income sources, then list all monthly expenses and subtract expenses from income.", confidence: "verified" },
      { fact_type: "property", statement: "Budgeting apps like YNAB and Mint help automate expense tracking across bank accounts.", confidence: "verified" },
      { fact_type: "rule", statement: "Tracking spending for at least one month reveals patterns that help build a realistic budget.", confidence: "verified" },
      { fact_type: "property", statement: "Pay yourself first means automatically transferring savings before spending on discretionary items.", confidence: "verified" },
      { fact_type: "definition", statement: "Net income is total earnings minus taxes and other mandatory deductions.", confidence: "verified" },
      { fact_type: "property", statement: "A budget deficit occurs when expenses exceed income, leading to debt accumulation.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "investing",
    topicSlug: "investing-basics",
    title: "Investing Basics",
    subtitle: "Core principles of growing wealth through financial markets",
    facts: [
      { fact_type: "definition", statement: "Investing is the act of allocating money into assets with the expectation of generating a return over time.", confidence: "verified" },
      { fact_type: "definition", statement: "Compound interest is the process where investment returns generate additional returns over time.", confidence: "verified" },
      { fact_type: "property", statement: "Stocks represent ownership shares in a company and can generate returns through price appreciation and dividends.", confidence: "verified" },
      { fact_type: "property", statement: "Bonds are debt instruments that pay fixed interest to investors and return principal at maturity.", confidence: "verified" },
      { fact_type: "property", statement: "Diversification reduces portfolio risk by spreading investments across different asset classes.", confidence: "verified" },
      { fact_type: "property", statement: "An index fund tracks a market index such as the S&P 500 and provides broad diversification at low cost.", confidence: "verified" },
      { fact_type: "rule", statement: "Higher potential returns in investing typically come with higher risk of loss.", confidence: "verified" },
      { fact_type: "property", statement: "Dollar-cost averaging involves investing a fixed amount regularly regardless of market conditions.", confidence: "verified" },
      { fact_type: "historical", statement: "Warren Buffett built his fortune primarily through long-term value investing in undervalued companies.", confidence: "verified" },
      { fact_type: "property", statement: "A brokerage account allows individuals to buy and sell stocks, bonds, and other securities.", confidence: "verified" },
      { fact_type: "rule", statement: "Investors should only invest money they will not need for at least three to five years.", confidence: "verified" },
      { fact_type: "property", statement: "Asset allocation describes the percentage of a portfolio divided between stocks, bonds, and cash.", confidence: "verified" },
      { fact_type: "definition", statement: "A mutual fund pools money from many investors to purchase a diversified portfolio of securities.", confidence: "verified" },
      { fact_type: "property", statement: "Expense ratios measure the annual cost of managing a fund as a percentage of assets.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "cryptocurrency",
    topicSlug: "cryptocurrency-fundamentals",
    title: "Cryptocurrency Fundamentals",
    subtitle: "How digital currencies work and what makes them different from traditional money",
    facts: [
      { fact_type: "definition", statement: "Cryptocurrency is a digital or virtual currency that uses cryptography to secure transactions.", confidence: "verified" },
      { fact_type: "historical", statement: "Bitcoin was created in 2009 by the pseudonymous Satoshi Nakamoto as the first decentralized cryptocurrency.", confidence: "verified" },
      { fact_type: "definition", statement: "A blockchain is a distributed ledger that records all transactions across a network of computers.", confidence: "verified" },
      { fact_type: "property", statement: "Decentralization means no single authority controls cryptocurrency transactions or supply.", confidence: "verified" },
      { fact_type: "property", statement: "Bitcoin has a fixed supply cap of 21 million coins, which creates scarcity similar to precious metals.", confidence: "verified" },
      { fact_type: "definition", statement: "Ethereum is a programmable blockchain platform that supports smart contracts and decentralized applications.", confidence: "verified" },
      { fact_type: "definition", statement: "A smart contract is self-executing code stored on a blockchain that automatically enforces agreement terms.", confidence: "verified" },
      { fact_type: "property", statement: "Cryptocurrency wallets store private keys that allow users to access and transfer their digital assets.", confidence: "verified" },
      { fact_type: "property", statement: "Mining is the process of validating cryptocurrency transactions by solving complex mathematical problems.", confidence: "verified" },
      { fact_type: "property", statement: "Proof of stake replaces mining by having validators lock up coins as collateral to confirm transactions.", confidence: "verified" },
      { fact_type: "rule", statement: "Cryptocurrency markets are highly volatile and prices can change dramatically within hours.", confidence: "verified" },
      { fact_type: "property", statement: "A stablecoin is a cryptocurrency pegged to a stable asset such as the US dollar to reduce volatility.", confidence: "verified" },
      { fact_type: "property", statement: "DeFi or decentralized finance refers to financial services built on blockchain without traditional intermediaries.", confidence: "verified" },
    ],
  },

  // ── EDUCATION & LEARNING ──────────────────────────────────────────────────
  {
    subcategorySlug: "study-skills",
    topicSlug: "effective-study-techniques",
    title: "Effective Study Techniques",
    subtitle: "Evidence-based methods that improve learning retention and academic performance",
    facts: [
      { fact_type: "definition", statement: "Spaced repetition is a learning technique that involves reviewing material at increasing intervals to strengthen memory.", confidence: "verified" },
      { fact_type: "definition", statement: "Active recall is the practice of testing yourself on material rather than passively rereading it.", confidence: "verified" },
      { fact_type: "property", statement: "The Pomodoro technique uses 25-minute focused work sessions separated by short breaks to maintain concentration.", confidence: "verified" },
      { fact_type: "property", statement: "Interleaving different subjects during a study session improves long-term retention compared to blocked practice.", confidence: "verified" },
      { fact_type: "property", statement: "The Feynman technique involves explaining a concept in simple terms to identify gaps in understanding.", confidence: "verified" },
      { fact_type: "historical", statement: "Hermann Ebbinghaus discovered the forgetting curve in 1885, showing that memory decays rapidly without review.", confidence: "verified" },
      { fact_type: "rule", statement: "Retrieval practice produces stronger memory traces than simply reviewing notes multiple times.", confidence: "verified" },
      { fact_type: "property", statement: "Mind mapping organizes information visually to help learners see connections between concepts.", confidence: "verified" },
      { fact_type: "property", statement: "Sleep consolidates newly learned information into long-term memory during the night.", confidence: "verified" },
      { fact_type: "property", statement: "Elaborative interrogation involves asking why a fact is true, which deepens understanding.", confidence: "verified" },
      { fact_type: "rule", statement: "Studying in varied locations can improve memory by creating multiple retrieval cues.", confidence: "medium" },
      { fact_type: "property", statement: "Cornell note-taking divides the page into notes, cues, and a summary section for structured review.", confidence: "verified" },
      { fact_type: "definition", statement: "Metacognition is the awareness and regulation of one's own thinking and learning processes.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "online-learning",
    topicSlug: "online-learning-strategies",
    title: "Online Learning Strategies",
    subtitle: "How to learn effectively through digital courses and self-directed study",
    facts: [
      { fact_type: "definition", statement: "Online learning is education delivered through digital platforms, allowing students to learn at their own pace.", confidence: "verified" },
      { fact_type: "property", statement: "MOOCs or Massive Open Online Courses provide free or low-cost access to university-level content.", confidence: "verified" },
      { fact_type: "property", statement: "Platforms like Coursera, edX, and Udemy host thousands of courses across every major subject area.", confidence: "verified" },
      { fact_type: "property", statement: "Asynchronous learning allows students to complete coursework on their own schedule without live sessions.", confidence: "verified" },
      { fact_type: "property", statement: "Setting specific weekly learning goals improves course completion rates in self-paced programs.", confidence: "verified" },
      { fact_type: "rule", statement: "Taking notes by hand rather than typing improves comprehension and retention during video lectures.", confidence: "verified" },
      { fact_type: "property", statement: "Discussion forums in online courses allow learners to engage with peers and reinforce understanding.", confidence: "verified" },
      { fact_type: "property", statement: "Microlearning breaks content into short focused lessons that are easier to absorb and retain.", confidence: "verified" },
      { fact_type: "definition", statement: "A learning management system or LMS organizes course content, assignments, and progress tracking in one platform.", confidence: "verified" },
      { fact_type: "property", statement: "Project-based online courses that produce real outputs lead to stronger skill development than theory alone.", confidence: "verified" },
      { fact_type: "rule", statement: "Blocking distractions by turning off notifications significantly improves focus during online study sessions.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "career-development",
    topicSlug: "career-development-fundamentals",
    title: "Career Development Fundamentals",
    subtitle: "Building skills, reputation, and direction throughout your professional life",
    facts: [
      { fact_type: "definition", statement: "Career development is the ongoing process of managing and directing your professional growth and learning.", confidence: "verified" },
      { fact_type: "property", statement: "Networking involves building relationships with professionals who can provide advice, referrals, and opportunities.", confidence: "verified" },
      { fact_type: "property", statement: "A strong resume summarizes relevant skills, experience, and achievements tailored to a specific role.", confidence: "verified" },
      { fact_type: "property", statement: "LinkedIn is the leading professional networking platform used by recruiters and hiring managers worldwide.", confidence: "verified" },
      { fact_type: "definition", statement: "A personal brand is the unique combination of skills, values, and reputation that distinguishes you professionally.", confidence: "verified" },
      { fact_type: "property", statement: "Informational interviews involve speaking with professionals in a field to learn about career paths and industries.", confidence: "verified" },
      { fact_type: "rule", statement: "Continuously developing skills keeps professionals competitive as industries evolve and automate.", confidence: "verified" },
      { fact_type: "property", statement: "Mentorship connects less experienced professionals with senior leaders who can guide their growth.", confidence: "verified" },
      { fact_type: "property", statement: "SMART goals are specific, measurable, achievable, relevant, and time-bound career objectives.", confidence: "verified" },
      { fact_type: "property", statement: "Soft skills such as communication, teamwork, and adaptability are valued across all industries.", confidence: "verified" },
      { fact_type: "property", statement: "A portfolio showcases real work and projects that demonstrate competency beyond credentials.", confidence: "verified" },
      { fact_type: "definition", statement: "Upskilling refers to learning new skills to advance within your current profession or industry.", confidence: "verified" },
    ],
  },

  // ── BUSINESS ──────────────────────────────────────────────────────────────
  {
    subcategorySlug: "entrepreneurship",
    topicSlug: "entrepreneurship-fundamentals",
    title: "Entrepreneurship Fundamentals",
    subtitle: "The core principles behind starting, building, and sustaining a business",
    facts: [
      { fact_type: "definition", statement: "Entrepreneurship is the process of identifying a market opportunity and building a business to address it.", confidence: "verified" },
      { fact_type: "definition", statement: "A startup is a young company designed to grow quickly by offering a scalable product or service.", confidence: "verified" },
      { fact_type: "property", statement: "A business model describes how a company creates, delivers, and captures value from its customers.", confidence: "verified" },
      { fact_type: "definition", statement: "Product-market fit means a product satisfies strong demand within a specific target market.", confidence: "verified" },
      { fact_type: "property", statement: "The lean startup methodology emphasizes building a minimum viable product and learning from customer feedback.", confidence: "verified" },
      { fact_type: "historical", statement: "Steve Jobs and Steve Wozniak founded Apple Computer in a garage in 1976 with initial capital of $1,350.", confidence: "verified" },
      { fact_type: "property", statement: "Bootstrapping means funding a startup from personal savings and revenue rather than outside investment.", confidence: "verified" },
      { fact_type: "property", statement: "Venture capital firms provide funding to high-growth startups in exchange for equity ownership.", confidence: "verified" },
      { fact_type: "rule", statement: "Most startups fail due to lack of market demand rather than technical or operational problems.", confidence: "verified" },
      { fact_type: "property", statement: "A value proposition clearly explains what problem a product solves and why customers should choose it.", confidence: "verified" },
      { fact_type: "property", statement: "Customer discovery involves interviewing potential customers before building a product to validate assumptions.", confidence: "verified" },
      { fact_type: "definition", statement: "A pivot is a fundamental change in business strategy based on lessons learned from early customers.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "marketing",
    topicSlug: "marketing-fundamentals",
    title: "Marketing Fundamentals",
    subtitle: "How businesses attract, engage, and retain customers",
    facts: [
      { fact_type: "definition", statement: "Marketing is the process of identifying customer needs and communicating how a product or service meets them.", confidence: "verified" },
      { fact_type: "definition", statement: "The marketing mix consists of four Ps: product, price, place, and promotion.", confidence: "verified" },
      { fact_type: "property", statement: "Target market segmentation divides a broad audience into groups based on demographics, behavior, or needs.", confidence: "verified" },
      { fact_type: "property", statement: "Brand positioning defines how a company wants customers to perceive its product relative to competitors.", confidence: "verified" },
      { fact_type: "property", statement: "Content marketing creates valuable information to attract and engage audiences rather than directly promoting products.", confidence: "verified" },
      { fact_type: "property", statement: "Search engine optimization improves a website's ranking in search results to drive organic traffic.", confidence: "verified" },
      { fact_type: "definition", statement: "A customer persona is a fictional profile representing a key segment of a company's target audience.", confidence: "verified" },
      { fact_type: "property", statement: "Email marketing delivers targeted messages directly to subscribers and consistently produces high return on investment.", confidence: "verified" },
      { fact_type: "property", statement: "Social media marketing builds brand awareness and customer relationships through platforms like Instagram and LinkedIn.", confidence: "verified" },
      { fact_type: "property", statement: "A conversion rate measures the percentage of visitors who complete a desired action such as making a purchase.", confidence: "verified" },
      { fact_type: "rule", statement: "Marketing messages must address customer pain points to generate attention and drive purchasing decisions.", confidence: "verified" },
      { fact_type: "property", statement: "Customer lifetime value estimates the total revenue a customer generates throughout their relationship with a business.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "project-management",
    topicSlug: "project-management-fundamentals",
    title: "Project Management Fundamentals",
    subtitle: "Planning, executing, and delivering projects on time and within scope",
    facts: [
      { fact_type: "definition", statement: "Project management is the discipline of planning, organizing, and directing resources to achieve specific goals within constraints.", confidence: "verified" },
      { fact_type: "property", statement: "The project management triangle balances scope, time, and cost as the three core constraints of any project.", confidence: "verified" },
      { fact_type: "property", statement: "A project charter formally authorizes a project and defines its objectives, stakeholders, and high-level scope.", confidence: "verified" },
      { fact_type: "property", statement: "A work breakdown structure decomposes a project into smaller, manageable tasks and deliverables.", confidence: "verified" },
      { fact_type: "definition", statement: "The critical path is the longest sequence of dependent tasks that determines the minimum project duration.", confidence: "verified" },
      { fact_type: "property", statement: "Agile project management delivers work in short iterative cycles called sprints rather than one large delivery.", confidence: "verified" },
      { fact_type: "property", statement: "A Gantt chart displays project tasks against a timeline to visualize scheduling and dependencies.", confidence: "verified" },
      { fact_type: "property", statement: "Risk management identifies potential problems and plans mitigation strategies before they impact delivery.", confidence: "verified" },
      { fact_type: "property", statement: "Stakeholder management ensures that key decision-makers and affected parties are informed and aligned throughout the project.", confidence: "verified" },
      { fact_type: "property", statement: "Scrum is an agile framework that uses roles such as product owner, scrum master, and development team.", confidence: "verified" },
      { fact_type: "rule", statement: "Clear scope definition at the start of a project prevents scope creep and budget overruns.", confidence: "verified" },
      { fact_type: "property", statement: "A retrospective meeting reviews what worked and what could improve after each project phase or sprint.", confidence: "verified" },
    ],
  },

  // ── HEALTH & WELLNESS ─────────────────────────────────────────────────────
  {
    subcategorySlug: "nutrition",
    topicSlug: "nutrition-fundamentals",
    title: "Nutrition Fundamentals",
    subtitle: "How food fuels the body and supports long-term health",
    facts: [
      { fact_type: "definition", statement: "Nutrition is the science of how the body uses food to sustain life, grow, and repair tissue.", confidence: "verified" },
      { fact_type: "property", statement: "Macronutrients include carbohydrates, proteins, and fats, which the body requires in large amounts for energy.", confidence: "verified" },
      { fact_type: "definition", statement: "Carbohydrates are the body's primary energy source, providing four calories per gram.", confidence: "verified" },
      { fact_type: "property", statement: "Proteins are essential for building and repairing muscles, enzymes, and hormones throughout the body.", confidence: "verified" },
      { fact_type: "property", statement: "Dietary fats support brain function, hormone production, and absorption of fat-soluble vitamins.", confidence: "verified" },
      { fact_type: "property", statement: "Micronutrients include vitamins and minerals that regulate body processes despite being required in small quantities.", confidence: "verified" },
      { fact_type: "property", statement: "Fiber promotes digestive health, regulates blood sugar, and reduces the risk of cardiovascular disease.", confidence: "verified" },
      { fact_type: "rule", statement: "A balanced diet rich in vegetables, whole grains, lean proteins, and healthy fats reduces chronic disease risk.", confidence: "verified" },
      { fact_type: "definition", statement: "The glycemic index measures how quickly a food raises blood sugar levels compared to pure glucose.", confidence: "verified" },
      { fact_type: "property", statement: "Hydration is critical for every physiological process including digestion, circulation, and temperature regulation.", confidence: "verified" },
      { fact_type: "property", statement: "Processed foods often contain added sugars, sodium, and unhealthy fats that contribute to chronic conditions.", confidence: "verified" },
      { fact_type: "rule", statement: "Caloric balance determines body weight, with sustained excess leading to fat storage and deficits causing fat loss.", confidence: "verified" },
      { fact_type: "property", statement: "The Mediterranean diet emphasizes olive oil, vegetables, legumes, fish, and whole grains and is associated with longevity.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "fitness",
    topicSlug: "fitness-fundamentals",
    title: "Fitness Fundamentals",
    subtitle: "Building strength, endurance, and physical health through structured exercise",
    facts: [
      { fact_type: "definition", statement: "Physical fitness is the ability to perform daily activities with vigor and without undue fatigue.", confidence: "verified" },
      { fact_type: "property", statement: "The five components of fitness are cardiovascular endurance, muscular strength, muscular endurance, flexibility, and body composition.", confidence: "verified" },
      { fact_type: "property", statement: "Cardiovascular exercise such as running, cycling, and swimming strengthens the heart and improves endurance.", confidence: "verified" },
      { fact_type: "property", statement: "Resistance training builds muscle mass and bone density by stressing muscles with external load.", confidence: "verified" },
      { fact_type: "property", statement: "Progressive overload is the principle of gradually increasing training stress to drive continued fitness adaptation.", confidence: "verified" },
      { fact_type: "rule", statement: "Adults should accumulate at least 150 minutes of moderate aerobic activity per week according to health guidelines.", confidence: "verified" },
      { fact_type: "property", statement: "Rest and recovery are essential components of a fitness program because muscles grow during rest, not during exercise.", confidence: "verified" },
      { fact_type: "definition", statement: "VO2 max is the maximum rate at which the body can consume oxygen during intense exercise and measures aerobic fitness.", confidence: "verified" },
      { fact_type: "property", statement: "High intensity interval training alternates short bursts of intense effort with recovery periods to improve fitness efficiently.", confidence: "verified" },
      { fact_type: "property", statement: "Stretching and flexibility work reduce injury risk and improve range of motion across all joints.", confidence: "verified" },
      { fact_type: "rule", statement: "Consistent moderate exercise provides greater long-term health benefits than occasional intense training sessions.", confidence: "verified" },
      { fact_type: "property", statement: "Sleep quality directly affects athletic performance, recovery speed, and motivation to exercise.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "mental-health",
    topicSlug: "mental-health-fundamentals",
    title: "Mental Health Fundamentals",
    subtitle: "Understanding emotional wellbeing, stress, and evidence-based coping strategies",
    facts: [
      { fact_type: "definition", statement: "Mental health encompasses emotional, psychological, and social wellbeing that affects thinking, feeling, and behavior.", confidence: "verified" },
      { fact_type: "property", statement: "Anxiety is characterized by persistent worry, fear, and physical tension that interferes with daily functioning.", confidence: "verified" },
      { fact_type: "definition", statement: "Depression is a mood disorder involving persistent sadness, loss of interest, and reduced energy that lasts for weeks.", confidence: "verified" },
      { fact_type: "property", statement: "Cognitive behavioral therapy helps individuals identify and change negative thought patterns that drive emotional distress.", confidence: "verified" },
      { fact_type: "property", statement: "Mindfulness meditation reduces stress by training attention on the present moment without judgment.", confidence: "verified" },
      { fact_type: "rule", statement: "Regular physical exercise has been shown to reduce symptoms of anxiety and depression as effectively as some medications.", confidence: "verified" },
      { fact_type: "property", statement: "Social connection is a fundamental human need and strong relationships are among the best predictors of mental wellbeing.", confidence: "verified" },
      { fact_type: "property", statement: "Sleep deprivation significantly worsens mood regulation, anxiety, and cognitive performance.", confidence: "verified" },
      { fact_type: "property", statement: "Stress management techniques include deep breathing, progressive muscle relaxation, and journaling.", confidence: "verified" },
      { fact_type: "definition", statement: "Resilience is the capacity to recover quickly from difficulties and adapt positively to adversity.", confidence: "verified" },
      { fact_type: "rule", statement: "Seeking professional help early prevents mental health conditions from becoming more severe and difficult to treat.", confidence: "verified" },
      { fact_type: "property", statement: "Boundaries protect mental health by limiting exposure to relationships or situations that cause consistent stress.", confidence: "verified" },
    ],
  },

  // ── HOME & LIFESTYLE ──────────────────────────────────────────────────────
  {
    subcategorySlug: "cooking",
    topicSlug: "cooking-fundamentals",
    title: "Cooking Fundamentals",
    subtitle: "Core techniques and principles that make you a more confident home cook",
    facts: [
      { fact_type: "definition", statement: "Cooking is the process of applying heat or other preparation methods to transform raw ingredients into edible food.", confidence: "verified" },
      { fact_type: "property", statement: "Mise en place is the culinary practice of preparing and organizing all ingredients before cooking begins.", confidence: "verified" },
      { fact_type: "property", statement: "The Maillard reaction is a chemical process between amino acids and sugars that creates the brown crust and complex flavors on seared meat.", confidence: "verified" },
      { fact_type: "property", statement: "Salt enhances flavor in cooking by suppressing bitterness and amplifying other taste compounds.", confidence: "verified" },
      { fact_type: "property", statement: "Sautéing cooks food quickly in a small amount of fat over high heat to develop flavor and texture.", confidence: "verified" },
      { fact_type: "property", statement: "Braising cooks tough cuts of meat slowly in liquid to break down collagen into tender gelatin.", confidence: "verified" },
      { fact_type: "property", statement: "Knife skills including proper grip and the pinch hold improve both safety and cutting efficiency in the kitchen.", confidence: "verified" },
      { fact_type: "rule", statement: "Resting meat after cooking allows juices to redistribute throughout the flesh, improving moisture.", confidence: "verified" },
      { fact_type: "property", statement: "Emulsification combines oil and water-based liquids into a stable mixture, forming sauces like mayonnaise.", confidence: "verified" },
      { fact_type: "property", statement: "Acids such as lemon juice and vinegar brighten flavors and balance the richness of fatty dishes.", confidence: "verified" },
      { fact_type: "definition", statement: "Caramelization is the browning of sugars when heated above 160 degrees Celsius, creating sweet and complex flavors.", confidence: "verified" },
      { fact_type: "property", statement: "Seasoning at each stage of cooking builds layers of flavor rather than relying only on final seasoning.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "home-organization",
    topicSlug: "home-organization-fundamentals",
    title: "Home Organization Fundamentals",
    subtitle: "Systems and strategies for creating a functional, clutter-free living space",
    facts: [
      { fact_type: "definition", statement: "Home organization is the practice of arranging living spaces to make them functional, efficient, and comfortable.", confidence: "verified" },
      { fact_type: "property", statement: "Decluttering removes unnecessary possessions to free space and reduce the mental load of maintaining a home.", confidence: "verified" },
      { fact_type: "property", statement: "The KonMari method encourages keeping only items that spark joy and organizing by category rather than location.", confidence: "verified" },
      { fact_type: "rule", statement: "Every item in a home should have a designated place to prevent clutter from accumulating over time.", confidence: "verified" },
      { fact_type: "property", statement: "Vertical storage using shelves and wall organizers maximizes space in rooms with limited floor area.", confidence: "verified" },
      { fact_type: "property", statement: "Labeling storage containers and shelves helps all household members return items to their correct locations.", confidence: "verified" },
      { fact_type: "property", statement: "One-in, one-out rule means removing an existing item whenever a new item of the same type enters the home.", confidence: "verified" },
      { fact_type: "property", statement: "Daily reset routines such as a ten-minute tidy before bed prevent disorder from building up over time.", confidence: "verified" },
      { fact_type: "property", statement: "Zoning divides a room into distinct areas for specific activities to create visual order and improve functionality.", confidence: "verified" },
      { fact_type: "definition", statement: "A capsule wardrobe consists of a small collection of versatile, high-quality clothing items that mix and match easily.", confidence: "verified" },
      { fact_type: "rule", statement: "Starting organization by category rather than room avoids moving clutter from one space to another.", confidence: "verified" },
    ],
  },

  // ── TRAVEL ────────────────────────────────────────────────────────────────
  {
    subcategorySlug: "travel-planning",
    topicSlug: "travel-planning-fundamentals",
    title: "Travel Planning Fundamentals",
    subtitle: "How to plan, budget, and prepare for memorable trips",
    facts: [
      { fact_type: "definition", statement: "Travel planning is the process of researching and organizing all elements of a trip before departure.", confidence: "verified" },
      { fact_type: "property", statement: "Booking flights and accommodation early typically provides lower prices and more availability.", confidence: "verified" },
      { fact_type: "property", statement: "A travel itinerary outlines the day-by-day schedule including transport, accommodation, and activities.", confidence: "verified" },
      { fact_type: "property", statement: "Travel insurance covers unexpected costs from trip cancellation, medical emergencies, and lost luggage.", confidence: "verified" },
      { fact_type: "rule", statement: "Researching local laws, customs, and safety conditions helps travelers avoid problems at their destination.", confidence: "verified" },
      { fact_type: "property", statement: "Flexible travel dates allow travelers to find significantly cheaper flight options by avoiding peak periods.", confidence: "verified" },
      { fact_type: "property", statement: "A budget tracker separates fixed travel costs such as flights from variable costs such as food and activities.", confidence: "verified" },
      { fact_type: "property", statement: "Packing light with a carry-on avoids baggage fees and reduces time lost waiting at luggage carousels.", confidence: "verified" },
      { fact_type: "property", statement: "Notifying banks before travel prevents credit card blocks triggered by foreign transaction activity.", confidence: "verified" },
      { fact_type: "property", statement: "Offline maps downloaded before departure allow navigation without relying on expensive roaming data.", confidence: "verified" },
      { fact_type: "rule", statement: "Keeping digital copies of important documents such as passport and insurance in cloud storage protects against loss.", confidence: "verified" },
    ],
  },
  {
    subcategorySlug: "budget-travel",
    topicSlug: "budget-travel-strategies",
    title: "Budget Travel Strategies",
    subtitle: "How to travel more while spending less without sacrificing the experience",
    facts: [
      { fact_type: "definition", statement: "Budget travel is the practice of exploring destinations while minimizing expenses through careful planning and flexible choices.", confidence: "verified" },
      { fact_type: "property", statement: "Hostels offer dormitory-style accommodation at a fraction of hotel prices and are popular with solo travelers.", confidence: "verified" },
      { fact_type: "property", statement: "Flight search engines like Google Flights and Skyscanner compare prices across airlines to find the cheapest options.", confidence: "verified" },
      { fact_type: "property", statement: "Shoulder season travel between peak and off-peak periods offers lower prices with fewer crowds.", confidence: "verified" },
      { fact_type: "property", statement: "Cooking meals in hostel kitchens or eating at local markets significantly reduces daily food costs while traveling.", confidence: "verified" },
      { fact_type: "property", statement: "Travel reward credit cards accumulate points on everyday spending that can be redeemed for free flights and hotels.", confidence: "verified" },
      { fact_type: "rule", statement: "Setting a daily spending limit and tracking expenses prevents budget overruns during extended trips.", confidence: "verified" },
      { fact_type: "property", statement: "Free walking tours available in most major cities provide local knowledge without a fixed fee.", confidence: "verified" },
      { fact_type: "property", statement: "House sitting and Couchsurfing platforms provide free accommodation in exchange for services or cultural exchange.", confidence: "verified" },
      { fact_type: "property", statement: "Slow travel staying in one location for a week rather than visiting many cities reduces transport costs.", confidence: "verified" },
      { fact_type: "rule", statement: "Exchanging currency at local ATMs typically provides better rates than airport exchange kiosks.", confidence: "verified" },
    ],
  },
];

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getSubcategoryBySlug(slug: string) {
  const { data } = await sb
    .from("subcategories")
    .select("id, slug, category_id")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function topicExists(slug: string): Promise<boolean> {
  const { data } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
  return !!data;
}

async function createTopic(seed: TopicSeed, subcategoryId: string): Promise<string> {
  const { data, error } = await sb
    .from("topics")
    .insert({
      slug: seed.topicSlug,
      canonical_path: `/en/topics/${seed.topicSlug}`,
      subcategory_id: subcategoryId,
      status: "published",
      difficulty: "beginner",
      estimated_read_time: 8,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create topic ${seed.topicSlug}: ${error.message}`);
  return data.id;
}

async function createTopicTranslation(topicId: string, seed: TopicSeed) {
  const { error } = await sb.from("topic_translations").upsert({
    topic_id: topicId,
    language_code: "en",
    title: seed.title,
    subtitle: seed.subtitle,
    content: null,
  }, { onConflict: "topic_id,language_code" });
  if (error) throw new Error(`Failed to create translation for ${seed.topicSlug}: ${error.message}`);
}

async function createPackageAndFacts(topicId: string, seed: TopicSeed): Promise<string> {
  // Check if package already exists for this topic
  const { data: existing } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topicId)
    .maybeSingle();
  if (existing) return existing.id;

  // Create package
  const hash = seed.facts.map(f => f.statement).join("|").split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, "0");

  const { data: pkg, error: pkgErr } = await sb
    .from("knowledge_packages")
    .insert({
      slug: seed.topicSlug,
      topic_id: topicId,
      status: "ready",
      version: 1,
      source_count: 1,
      fact_count: seed.facts.length,
      relationship_count: 0,
      knowledge_hash: hash,
      discovery_run_ids: [],
    })
    .select("id")
    .single();
  if (pkgErr) throw new Error(`Failed to create package for ${seed.topicSlug}: ${pkgErr.message}`);

  // Create facts
  const topicTag = seed.topicSlug.replace(/-/g, " ");
  const factRows = seed.facts.map((f) => ({
    package_id: pkg.id,
    fact_type: f.fact_type,
    statement: f.statement,
    confidence: f.confidence,
    domain: seed.title,
    scope: f.fact_type === "rule" ? "universal" : "contextual",
    tags: [topicTag],
  }));
  const { error: factErr } = await sb.from("knowledge_facts").insert(factRows);
  if (factErr) throw new Error(`Failed to insert facts for ${seed.topicSlug}: ${factErr.message}`);

  return pkg.id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Dynamic import AFTER env vars are set
  const { render } = await import("@/services/renderer/orchestrator");

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  SEED MISSING CATEGORIES");
  console.log(`  ${TOPIC_SEEDS.length} topics across 6 categories`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  let created = 0, skipped = 0, failed = 0;

  for (const seed of TOPIC_SEEDS) {
    const sub = await getSubcategoryBySlug(seed.subcategorySlug);
    if (!sub) {
      console.log(`  ⚠️  subcategory not found: ${seed.subcategorySlug} — skipping`);
      skipped++;
      continue;
    }

    const exists = await topicExists(seed.topicSlug);
    if (exists) {
      console.log(`  ⏭  already exists: ${seed.topicSlug}`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  Creating: ${seed.title} ... `);

      // 1. Topic row
      const topicId = await createTopic(seed, sub.id);
      // 2. Translation (empty content — will be filled by renderer)
      await createTopicTranslation(topicId, seed);
      // 3. Package + facts
      const packageId = await createPackageAndFacts(topicId, seed);

      // 4. Render immediately
      const result = await render({
        packageId,
        format: "markdown",
        rendererId: "long-article",
        style: ["intermediate"],
        forceRerender: true,
      });

      const words = result.content.split(/\s+/).filter(Boolean).length;

      // 5. Publish to topic_translations
      await sb
        .from("topic_translations")
        .update({ content: result.content })
        .eq("topic_id", topicId)
        .eq("language_code", "en");

      console.log(`✅ ${words}w`);
      created++;
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      failed++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`  Created:  ${created}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch(console.error);
