/**
 * Topic Domain Classifier
 *
 * Classifies a topic title into a domain so the expansion engine
 * can generate domain-specific article plans.
 *
 * Separate from agentPipeline's classifyIntent (which classifies per-article).
 * This operates at the TOPIC level.
 */

export type TopicDomain =
  | "technology"
  | "finance_concept"
  | "finance_product"
  | "health_condition"
  | "health_nutrition"
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

  // Technology
  if (/docker|kubernetes|linux|bash|python|javascript|typescript|react|node\.?js|api|sql|git|css|html|programming|coding|software|algorithm|database|server|cloud|aws|devops|cli|terminal|command|function|variable|class|framework|logits|softmax|epoch|kubectl|ingress|dockerfile|terraform|ansible|redis|nginx|apache|mongodb|postgresql|graphql|rest|microservice|webpack|vite|nextjs|nuxt|vue|angular|svelte|flutter|swift|kotlin|java|golang|rust|c\+\+|c#|\.net|php|ruby|rails|django|fastapi|spring/.test(k))
    return "technology";

  // Finance product (credit card, mortgage, specific products — before finance_concept)
  if (/credit card|mortgage|home loan|personal loan|auto loan|car loan|student loan|etf|index fund|mutual fund|401k|ira|roth ira|savings account|checking account|money market|treasury bond|treasury bill|cd account|certificate of deposit/.test(k))
    return "finance_product";

  // Finance concept
  if (/invest|stock market|bond|crypto|bitcoin|ethereum|finance|money|tax|budget|compound interest|dividend|portfolio|bank|insurance|inflation|recession|gdp|economics|hedge fund|venture capital|private equity|ipo|forex|commodity|derivative|option trading|debt|equity|net worth|passive income|financial/.test(k))
    return "finance_concept";

  // Health condition (specific diseases/conditions — before health_nutrition)
  if (/diabetes|cancer|anxiety|depression|cortisol|hypertension|asthma|arthritis|alzheimer|parkinson|adhd|autism|obesity|cholesterol|thyroid|hormone imbalance|heart disease|stroke|copd|epilepsy|migraine|psoriasis|eczema|ibs|crohn|celiac|lupus|fibromyalgia|insomnia|ptsd|ocd|bipolar|schizophrenia|anemia|kidney disease|liver disease|hiv|aids/.test(k))
    return "health_condition";

  // Health nutrition/fitness
  if (/diet|nutrition|vitamin|supplement|protein|calorie|carbohydrate|fat|keto|vegan|vegetarian|intermittent fasting|weight loss|muscle|exercise|workout|fitness|yoga|meditation|sleep|hydration|probiotic|antioxidant|omega-3|collagen|creatine|magnesium|zinc|iron|calcium/.test(k))
    return "health_nutrition";

  // Movie / TV
  if (/movie|film|series|miniseries|mini.series|tv show|television|season|episode|streaming|netflix|hulu|disney\+|hbo|prime video|documentary|anime|sitcom|drama|thriller|horror film|comedy film|action film|\(film\)|\(series\)|\(miniseries\)|\(tv\)|\(\d{4} film\)/.test(k) ||
    /\(miniseries\)|\(film\)|\(series\)/.test(k))
    return "movie_tv";

  // Person / Celebrity
  if (/biography|born in|who is|actor|actress|singer|musician|athlete|politician|ceo|founder|president|prime minister|director|author|scientist|inventor|philosopher|entrepreneur/.test(k))
    return "person_celebrity";

  // Place / Travel
  if (/eiffel tower|statue of liberty|great wall|taj mahal|colosseum|pyramids|stonehenge|machu picchu|angkor wat|mount everest|grand canyon|niagara falls|travel to|visit|tourism|destination guide|national park|island|beach|mountain|city guide/.test(k))
    return "place_travel";

  // Product review
  if (/iphone \d|samsung galaxy|macbook|ipad|apple watch|airpods|tesla model|nintendo switch|playstation|xbox|pixel \d|galaxy tab|surface pro|review|specifications|specs/.test(k) &&
    !/credit card|mortgage/.test(k))
    return "product_review";

  // Historical event
  if (/world war|ww1|ww2|wwii|wwi|cold war|civil war|revolution|battle of|fall of|rise of|history of|ancient|medieval|empire|dynasty|independence|holocaust|colonialism|slavery|segregation|apartheid|great depression|industrial revolution/.test(k))
    return "historical_event";

  // News / Current events
  if (/2024|2025|2026|fifa world cup \d{4}|olympics \d{4}|election \d{4}|summit|championship|tournament|oscar \d{4}|grammy \d{4}|super bowl \d/.test(k))
    return "news_current";

  // Scientific concept
  if (/quantum|dna|rna|evolution|gravity|photosynthesis|atom|molecule|cell biology|genetics|neuroscience|thermodynamics|relativity|string theory|black hole|dark matter|crispr|vaccine science|germ theory|plate tectonics/.test(k))
    return "scientific_concept";

  // Legal
  if (/law|legal|copyright|patent|trademark|contract|constitution|amendment|rights|court|lawsuit|regulation|compliance|gdpr|hipaa|attorney|lawyer/.test(k))
    return "legal_topic";

  // Educational concept
  if (/gerrymandering|democracy|socialism|capitalism|communism|fascism|philosophy|psychology|sociology|anthropology|political science|economics theory|supply and demand|keynesian|free market|globalization|human rights|civil rights|feminism|climate change/.test(k))
    return "educational_concept";

  return "general";
}
