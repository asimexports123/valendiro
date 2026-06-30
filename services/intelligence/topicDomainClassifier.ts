/**
 * Topic Domain Classifier
 *
 * Classifies a topic title into an ENTITY TYPE so the expansion engine
 * can generate entity-specific article plans.
 *
 * Entity types are more granular than broad domains:
 *   Finance → investment_instrument | financial_formula | banking_product | tax_concept | investment_strategy
 *   Technology → programming_language | framework | tool_cli | cloud_service | programming_concept
 *   Health → disease | medication | nutrition_topic | fitness_topic | medical_concept
 *   etc.
 */

export type TopicDomain =
  // ── Technology entity types ──────────────────────────────────────────────
  | "tech_programming_language"   // Python, JavaScript, TypeScript, Go, Rust
  | "tech_framework"              // React, Vue, Django, Spring, Rails
  | "tech_tool_cli"               // Docker, Git, kubectl, Terraform, Webpack
  | "tech_cloud_service"          // AWS, GCP, Azure, S3, Lambda
  | "tech_programming_concept"    // Algorithm, Data Structure, OOP, REST, API
  | "tech_database"               // PostgreSQL, MongoDB, Redis, SQL
  // ── Finance entity types ─────────────────────────────────────────────────
  | "finance_investment_instrument"  // Index Fund, ETF, Mutual Fund, 401k, IRA
  | "finance_financial_formula"      // Compound Interest, NPV, IRR, Rule of 72
  | "finance_investment_strategy"    // Dollar Cost Averaging, Value Investing, FIRE
  | "finance_banking_product"        // Mortgage, Credit Card, Savings Account, CD
  | "finance_tax_concept"            // Capital Gains Tax, Tax Deductions, Tax Brackets
  | "finance_market_concept"         // Bull Market, Inflation, GDP, Stock Market
  // ── Health entity types ──────────────────────────────────────────────────
  | "health_disease"               // Diabetes, Cancer, Hypertension, Anxiety
  | "health_medication"            // Metformin, Statins, Ibuprofen, Ozempic
  | "health_nutrition_topic"       // Protein, Vitamin D, Omega-3, Fiber
  | "health_fitness_topic"         // HIIT, Strength Training, Yoga, Cardio
  | "health_medical_concept"       // Blood Pressure, BMI, Inflammation, Hormones
  // ── Other domains ────────────────────────────────────────────────────────
  | "movie_tv"
  | "person_celebrity"
  | "place_travel"
  | "product_review"
  | "historical_event"
  | "news_current"
  | "educational_concept"
  | "scientific_concept"
  | "legal_topic"
  | "general";

export function classifyTopicDomain(topicTitle: string): TopicDomain {
  const k = topicTitle.toLowerCase().trim();

  // ── Technology ─────────────────────────────────────────────────────────────

  // Programming language (must be before framework/tool)
  if (/\bpython\b|\bjavascript\b|\btypescript\b|\bgolang\b|\brust\b|\bswift\b|\bkotlin\b|\bphp\b|\bruby\b|\bscala\b|\bperl\b|\bhaskell\b|\belixir\b|\bc\+\+\b|\bc#\b|\.net\b|\br language\b|\bjulia\b|\bmatlablangu/.test(k))
    return "tech_programming_language";

  // Framework / library
  if (/\breact\b|\bvue\b|\bangular\b|\bsvelte\b|\bnext\.?js\b|\bnuxt\b|\bdjango\b|\bflask\b|\bfastapi\b|\bspring\b|\brails\b|\blaravel\b|\bexpress\b|\bnestjs\b|\bflutter\b|\btailwind\b|\bbootstrap\b|\bjquery\b|\bwebpack\b|\bvite\b/.test(k))
    return "tech_framework";

  // Tool / CLI / DevOps
  if (/\bdocker\b|\bkubernetes\b|\bkubectl\b|\bgit\b|\blinux\b|\bbash\b|\bterraform\b|\bansible\b|\bjenkins\b|\bgithub actions\b|\bnginx\b|\bapache\b|\bredis\b|\belasticsearch\b|\bkafka\b|\bdevops\b|\bci\/cd\b|dockerfile|ingress|helm chart|\bvim\b|\bemacs\b/.test(k))
    return "tech_tool_cli";

  // Cloud service
  if (/\baws\b|amazon web services|\bgcp\b|google cloud|\bazure\b|microsoft azure|\bs3\b|\blambda\b|\bec2\b|\brds\b|\bcloudfront\b|\biam\b|\bvpc\b|\bfirebase\b|\bvercel\b|\bnetlify\b|\bheroku\b|cloudflare/.test(k))
    return "tech_cloud_service";

  // Database
  if (/\bpostgresql\b|\bmysql\b|\bmongodb\b|\bsqlite\b|\bsupabase\b|\bprisma\b|\borm\b|\bsql\b|\bnosql\b|\bdynamodb\b|\bfirestore\b|\bcassandra\b|\belasticsearch\b/.test(k))
    return "tech_database";

  // Programming concept
  if (/programming|coding|software|algorithm|data structure|\bapi\b|\brest\b|\bgraphql\b|\boop\b|design pattern|\bcss\b|\bhtml\b|\bseo\b|\bserver\b|\bmicroservice\b|\bfunction\b|\bvariable\b|\brecursion\b|\bsorting\b|\blinked list\b|\bbig o\b|\btime complexity/.test(k))
    return "tech_programming_concept";

  // ── Finance ────────────────────────────────────────────────────────────────

  // Banking products (have application/eligibility processes)
  if (/mortgage|home loan|personal loan|auto loan|car loan|student loan|credit card|savings account|checking account|money market account|\bcd account\b|certificate of deposit|heloc|home equity/.test(k))
    return "finance_banking_product";

  // Investment instruments (specific tradeable instruments)
  if (/\betf\b|index fund|mutual fund|\b401k\b|roth ira|\bira\b|treasury bond|treasury bill|t-bill|t-bond|money market fund|hedge fund|\bstocks?\b|\bbonds?\b|\bsecurities\b|dividend stock|growth stock|value stock/.test(k))
    return "finance_investment_instrument";

  // Financial formulas (mathematical/calculable concepts)
  if (/compound interest|simple interest|\bnpv\b|net present value|\birr\b|internal rate of return|\broe\b|return on equity|\broi\b|return on investment|\bp\/e ratio\b|price.to.earnings|earnings per share|\beps\b|rule of 72|time value of money|\bcagr\b|compound annual growth|amortization formula|break.?even|\bwacc\b/.test(k))
    return "finance_financial_formula";

  // Investment strategies (methods/approaches)
  if (/dollar cost averaging|value investing|growth investing|\bfire movement\b|financial independence|passive income|asset allocation|portfolio rebalancing|diversification|debt snowball|debt avalanche|emergency fund|sinking fund|\blean fire\b|\bfat fire\b|buy and hold|momentum investing/.test(k))
    return "finance_investment_strategy";

  // Tax concepts
  if (/capital gains tax|income tax|\btax bracket\b|tax deduction|tax credit|\btax loss harvesting\b|\bw-2\b|\b1099\b|self.employment tax|\birs\b|\btax return\b|\bfiling taxes\b|\btax refund\b|estate tax|gift tax|\bvat\b|sales tax/.test(k))
    return "finance_tax_concept";

  // Market/macro concepts
  if (/stock market|bull market|bear market|\binflation\b|\brecession\b|\bgdp\b|interest rate|\bfed\b|federal reserve|monetary policy|fiscal policy|\bcpi\b|\bppi\b|supply and demand|market cap|liquidity|\bvolatility\b|crypto|bitcoin|ethereum|forex|commodity/.test(k))
    return "finance_market_concept";

  // ── Health ─────────────────────────────────────────────────────────────────

  // Specific medications
  if (/metformin|insulin|statin|ibuprofen|aspirin|acetaminophen|ozempic|wegovy|semaglutide|lisinopril|atorvastatin|omeprazole|sertraline|fluoxetine|adderall|ritalin|\bssri\b|\bsnri\b/.test(k))
    return "health_medication";

  // Disease / condition
  if (/diabetes|cancer|anxiety|depression|hypertension|asthma|arthritis|alzheimer|parkinson|adhd|autism|obesity|high cholesterol|thyroid|heart disease|stroke|copd|epilepsy|migraine|psoriasis|eczema|\bibs\b|crohn|celiac|lupus|fibromyalgia|insomnia|ptsd|\bocd\b|bipolar|schizophrenia|anemia|kidney disease|liver disease|\bhiv\b|\baids\b|cortisol imbalance|hormone imbalance/.test(k))
    return "health_disease";

  // Nutrition topic (specific nutrient/food/diet)
  if (/vitamin|\bprotein\b|\bfiber\b|omega-3|\bmagnesium\b|\bzinc\b|\biron\b|\bcalcium\b|\bpotassium\b|antioxidant|probiotic|prebiotic|collagen|creatine|\bbcaa\b|\bwhey\b|calorie|\bmacro\b|carbohydrate|healthy fat|\bketo diet\b|mediterranean diet|vegan diet|intermittent fasting|\bgluten\b|\blactose\b/.test(k))
    return "health_nutrition_topic";

  // Fitness / exercise topic
  if (/strength training|\bhiit\b|cardio|\byoga\b|\bpilates\b|progressive overload|muscle hypertrophy|\bworkout\b|\bexercise\b|\bfitness\b|weight loss|fat loss|\brunning\b|\bcycling\b|\bswimming\b|\bstretching\b|\bflexibility\b|\bmobility\b|\brest day\b/.test(k))
    return "health_fitness_topic";

  // Medical concept (general health concepts, not specific diseases)
  if (/blood pressure|\bbmi\b|inflammation|\bimmune system\b|metabolism|\bhormone\b|\bcholesterol\b|blood sugar|gut health|mental health|sleep health|\bstress\b|\bcortisol\b|\badrenaline\b|lymphatic|\bpain\b|\bfever\b|nutrition science/.test(k))
    return "health_medical_concept";

  // ── Other domains ──────────────────────────────────────────────────────────

  // Movie / TV
  if (/movie|film|series|miniseries|mini.series|tv show|television|season|episode|streaming|netflix|hulu|disney\+|hbo|prime video|documentary|anime|sitcom|drama|thriller|horror film|comedy film|action film|\(film\)|\(series\)|\(miniseries\)|\(tv\)|\(\d{4} film\)/.test(k) ||
    /\(miniseries\)|\(film\)|\(series\)/.test(k))
    return "movie_tv";

  // Person / Celebrity
  if (/biography|born in|who is|actor|actress|singer|musician|athlete|politician|\bceo\b|founder|president|prime minister|director|author|scientist|inventor|philosopher/.test(k))
    return "person_celebrity";

  // Place / Travel
  if (/eiffel tower|statue of liberty|great wall|taj mahal|colosseum|pyramids|stonehenge|machu picchu|angkor wat|mount everest|grand canyon|niagara falls|travel to|visit|tourism|destination guide|national park|island|beach|mountain|city guide/.test(k))
    return "place_travel";

  // Product review
  if (/iphone \d|samsung galaxy|macbook|\bipad\b|apple watch|airpods|tesla model|nintendo switch|playstation|\bxbox\b|pixel \d|galaxy tab|surface pro/.test(k))
    return "product_review";

  // Historical event
  if (/world war|\bww1\b|\bww2\b|\bwwii\b|\bwwi\b|cold war|civil war|revolution|battle of|fall of|rise of|history of|ancient|medieval|empire|dynasty|independence|holocaust|colonialism|slavery|segregation|apartheid|great depression|industrial revolution/.test(k))
    return "historical_event";

  // News / Current events
  if (/2024|2025|2026|fifa world cup \d{4}|olympics \d{4}|election \d{4}|summit|championship|tournament/.test(k))
    return "news_current";

  // Scientific concept
  if (/quantum|\bdna\b|\brna\b|evolution|gravity|photosynthesis|atom|molecule|cell biology|genetics|neuroscience|thermodynamics|relativity|string theory|black hole|dark matter|\bcrispr\b|plate tectonics/.test(k))
    return "scientific_concept";

  // Legal
  if (/\blaw\b|legal|copyright|patent|trademark|contract|constitution|amendment|rights|court|lawsuit|regulation|compliance|\bgdpr\b|\bhipaa\b|attorney|lawyer/.test(k))
    return "legal_topic";

  // Educational concept
  if (/gerrymandering|democracy|socialism|capitalism|communism|fascism|philosophy|psychology|sociology|anthropology|political science|supply and demand|keynesian|free market|globalization|human rights|civil rights|feminism|climate change/.test(k))
    return "educational_concept";

  return "general";
}
