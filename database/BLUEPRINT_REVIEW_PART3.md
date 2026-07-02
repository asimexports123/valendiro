# KNOWLEDGE BLUEPRINT REVIEW — PART 3
# Categories: Personal Finance + Education
# Parent document: KNOWLEDGE_BLUEPRINT_REVIEW.md

---

## PERSONAL FINANCE

**Category Objective:** Build a complete personal financial system — banking, credit, investing, insurance, retirement, and taxes.
**Reader Profile:** Ranges from 18-year-olds opening their first account to 50-year-olds building a retirement income plan.

---

### banking
**Reader Objective:** Understand how banking works and make informed decisions about accounts, fees, and security.
**Canonical Learning Goal:** A reader understands the banking system, selects the right account types, builds an emergency fund, and protects their money.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Banking Fundamentals | `banking-fundamentals` | Checking vs savings accounts, interest mechanics, FDIC insurance, how banks operate | B | — | choosing-a-bank |
| 2 | Choosing a Bank | `choosing-a-bank` | Evaluate banks on fees, APY, digital features, ATM access; credit unions vs commercial banks | A | banking-fundamentals | savings-accounts |
| 3 | Savings Accounts | `savings-accounts` | High-yield savings accounts, money market accounts, CD laddering, building an emergency fund | A | choosing-a-bank | banking-security |
| 4 | Banking Security | `banking-security` | Identifying fraud, enabling 2FA, FDIC insurance limits, protecting accounts from phishing | BP | banking-fundamentals | wire-transfers-and-payments |
| 5 | Wire Transfers & Payments | `wire-transfers-and-payments` | ACH vs wire transfers, Zelle, payment rails, speed and fee comparisons | A | banking-fundamentals | — |

**Validation Findings:**
- ✅ Practical and beginner-friendly throughout
- ✅ Covers all major banking touchpoints a consumer needs
- ⚠️ **Missing:** Overdraft protection and fee avoidance — common pain point for beginners, especially young adults

**Coverage Score: 85/100**

**Beginner Completeness:** ✅ Topics 1→2 are immediately actionable for anyone new to managing finances.

---

### credit-cards
**Reader Objective:** Use credit cards effectively — build credit, earn rewards, and avoid the debt trap.
**Canonical Learning Goal:** A reader understands how credit cards work, can select the right card, maximize rewards, avoid debt, and use cards to build credit.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Credit Card Fundamentals | `credit-card-fundamentals` | APR, grace periods, minimum payments, statement cycles, how revolving debt accumulates | B | — | choosing-a-credit-card |
| 2 | Choosing a Credit Card | `choosing-a-credit-card` | Match card to spending profile, evaluate rewards vs annual fee, cashback vs travel cards | A | credit-card-fundamentals | credit-card-rewards |
| 3 | Credit Card Rewards | `credit-card-rewards` | Points and miles valuation, redemption strategies, sign-up bonus math, travel hacking basics | A | choosing-a-credit-card | credit-card-debt |
| 4 | Credit Card Debt | `credit-card-debt` | Debt avalanche and snowball methods, interest compounding math, balance transfer strategy | A | credit-card-fundamentals | building-credit-with-cards |
| 5 | Building Credit with Cards | `building-credit-with-cards` | Credit utilization ratio, payment history impact, credit age, how a credit score is built | BP | credit-card-fundamentals | — |

**Validation Findings:**
- ✅ Well-designed for beginners — covers both opportunity (rewards) and risk (debt) explicitly
- ⚠️ **Prerequisite gap:** Credit scores and credit reports should ideally precede this path; readers need to know what they're building toward. Consider cross-linking from topic 5 to an existing credit topic.
- ✅ Covers traps explicitly — topic 4 is a genuine public good

**Coverage Score: 83/100**

**Beginner Completeness:** ✅ Strong for beginners. Topic 1 explains the mechanics that make credit cards dangerous before the rewards section.

---

### etfs
**Reader Objective:** Understand ETFs deeply — how they trade, how to select them, and how to use them in a portfolio.
**Canonical Learning Goal:** A reader understands ETF mechanics, can evaluate and select ETFs, understands passive vs thematic approaches, and manages tax implications.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | ETF Fundamentals | `etf-fundamentals` | What an ETF is, intraday trading, bid-ask spread, NAV, advantages over mutual funds | B | — | index-etfs |
| 2 | Index ETFs | `index-etfs` | Passive index investing, market-cap weighting, major index funds (S&P 500, total market). **Scope note:** ETF structure — intraday pricing, no sales load, tax efficiency via in-kind creation. Distinct from mutual fund index funds covered in mutual-funds subcategory. | C | etf-fundamentals | sector-and-thematic-etfs |
| 3 | Sector & Thematic ETFs | `sector-and-thematic-etfs` | Factor investing, sector ETF concentration risk, thematic ETF lifecycle, when they fit | A | etf-fundamentals | bond-etfs |
| 4 | Bond ETFs | `bond-etfs` | Fixed income fundamentals, duration risk, yield, credit quality, bond ETF role in portfolio | A | etf-fundamentals | etf-selection-and-comparison |
| 5 | ETF Selection & Comparison | `etf-selection-and-comparison` | Expense ratio, tracking error, liquidity (AUM, spread), tax efficiency, comparing similar ETFs | BP | index-etfs | — |

**Validation Findings:**
- ✅ Strong and practical
- ⚠️ **Near-duplicate C4 handled:** `index-etfs` subtitle and scope note clarify ETF-specific mechanics (intraday trading, in-kind creation, no sales load) — distinct from `index-funds` in the mutual-funds subcategory

**Coverage Score: 87/100**

**Beginner Completeness:** ✅ Topics 1→2 are accessible and immediately useful.

---

### insurance
**Reader Objective:** Understand how insurance works and select appropriate coverage across health, life, auto, and home.
**Canonical Learning Goal:** A reader understands the risk-transfer model, can evaluate and purchase the four core insurance products, and knows what's missing from their coverage.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Insurance Fundamentals | `insurance-fundamentals` | Premiums, deductibles, copays, coinsurance, risk pooling, the purpose of insurance | B | — | health-insurance |
| 2 | Health Insurance | `health-insurance` | HMO/PPO/HDHP/EPO plans, in-network vs out-of-network, HSA, FSA, navigating coverage | C | insurance-fundamentals | life-insurance |
| 3 | Life Insurance | `life-insurance` | Term vs whole vs universal life, coverage amount calculation, beneficiary designations, when necessary | C | insurance-fundamentals | auto-insurance |
| 4 | Auto Insurance | `auto-insurance` | Liability, comprehensive, collision, uninsured/underinsured motorist, how premiums are rated | A | insurance-fundamentals | homeowners-and-renters-insurance |
| 5 | Homeowners & Renters Insurance | `homeowners-and-renters-insurance` | Dwelling coverage, personal property, liability, ACV vs replacement cost, common exclusions | A | insurance-fundamentals | — |

**Validation Findings:**
- ✅ Covers the four major personal insurance categories completely
- ⚠️ **Missing:** `disability-insurance` — statistically, a working-age person is more likely to experience a long-term disability than to die before retirement; most people have no coverage
- ⚠️ **Missing:** Claims process — how to file, document, negotiate; knowing coverage exists is different from knowing how to use it

**Coverage Score: 82/100**

**Beginner Completeness:** ✅ Topics 1→2 give beginners what they need most (health insurance is the most complex and most critical).

---

### loans-mortgages
**Reader Objective:** Understand major debt instruments — mortgages, student loans, personal loans — and make informed borrowing decisions.
**Canonical Learning Goal:** A reader understands mortgage mechanics and the home-buying process, can evaluate student loan repayment options, and knows when a personal loan is appropriate.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Mortgage Fundamentals | `mortgage-fundamentals` | Fixed vs ARM, amortization schedule, mortgage points, the loan origination process | B | — | home-buying-process |
| 2 | Home Buying Process | `home-buying-process` | Pre-approval, making offers, home inspection, escrow, closing costs, ownership transfer | A | mortgage-fundamentals | refinancing |
| 3 | Refinancing | `refinancing` | Break-even calculation, rate-and-term vs cash-out refi, when to refinance, costs | Adv | mortgage-fundamentals | — |
| 4 | Student Loans | `student-loans` | Federal vs private loans, income-driven repayment plans, PSLF, payoff strategies | C | — | personal-loans |
| 5 | Personal Loans | `personal-loans` | Personal loans vs credit cards vs HELOCs, rate factors, appropriate use cases | A | — | — |

**Validation Findings:**
- ⚠️ **Structural note:** Topics 1–3 form a mortgage cluster; topics 4–5 are separate loan types. The path has an implicit fork. Both clusters are valuable but a debt fundamentals primer at position 1 (covering creditworthiness, DTI ratio, borrowing costs) would unify them and serve beginners better.
- ✅ All five topics represent high-stakes, high-value knowledge

**Coverage Score: 81/100**

**Beginner Completeness:** ⚠️ Mortgage Fundamentals is accessible but assumes intent to buy a home. A debt overview topic would serve broader beginners.

---

### mutual-funds
**Reader Objective:** Understand mutual funds — how they work, how to select them, and their role in a long-term portfolio.
**Canonical Learning Goal:** A reader understands mutual fund structure, the active vs passive debate, how to select funds, and manages tax implications specific to mutual funds.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Mutual Fund Fundamentals | `mutual-fund-fundamentals` | How mutual funds pool capital, NAV pricing, expense ratios, fund categories | B | — | actively-managed-funds |
| 2 | Actively Managed Funds | `actively-managed-funds` | Fund manager selection, alpha generation, performance persistence, SPIVA data on active vs passive | C | mutual-fund-fundamentals | index-funds |
| 3 | Index Funds | `index-funds` | Index fund mechanics, Vanguard's philosophy, low-cost investing. **Scope note:** Mutual fund structure — end-of-day NAV pricing, no intraday trading, automatic reinvestment, share classes. Distinct from ETF index funds in the etfs subcategory. | C | mutual-fund-fundamentals | fund-selection |
| 4 | Fund Selection | `fund-selection` | Expense ratio analysis, Sharpe ratio, performance consistency, Morningstar star ratings | A | actively-managed-funds | tax-efficient-investing |
| 5 | Tax-Efficient Investing | `tax-efficient-investing` | **[Narrowed per C3]** Mutual-fund-specific tax mechanics: portfolio turnover, capital gains distributions, avoiding high-turnover funds in taxable accounts, tax-managed funds | BP | fund-selection | — |

**Validation Findings:**
- ✅ Clean and complete
- ⛔ **Critical C3 applied:** `tax-efficient-investing` scope narrowed to mutual-fund-specific tax mechanics only
- ⚠️ **Critical C4 applied:** `index-funds` scope note added to explicitly distinguish from ETF index funds

**Coverage Score: 84/100**

**Beginner Completeness:** ✅ Topics 1→2 are accessible with no prior investing knowledge.

---

### retirement-planning
**Reader Objective:** Build a complete retirement plan — accounts, Social Security, income strategies, and estate basics.
**Canonical Learning Goal:** A reader understands why to start early, knows the major tax-advantaged accounts, can optimize Social Security, model retirement income, and establish basic estate documents.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Retirement Planning Fundamentals | `retirement-planning-fundamentals` | The compounding argument, savings rate math, retirement timeline, the cost of waiting | B | — | 401k-fundamentals |
| 2 | 401(k) Fundamentals | `401k-fundamentals` | Contribution limits, employer match (free money), vesting schedules, Roth vs Traditional 401k | C | retirement-planning-fundamentals | ira-fundamentals |
| 3 | IRA Fundamentals | `ira-fundamentals` | Traditional vs Roth IRA, contribution limits, income limits, backdoor Roth strategy | C | 401k-fundamentals | social-security |
| 4 | Social Security | `social-security` | Benefit calculation formula, claiming age (62 vs 67 vs 70) trade-offs, spousal benefits, break-even | Adv | retirement-planning-fundamentals | retirement-income-strategies |
| 5 | Retirement Income Strategies | `retirement-income-strategies` | The 4% rule, sequence of returns risk, the bucket strategy, tax-efficient withdrawal sequencing | Adv | social-security | estate-planning-basics |
| 6 | Estate Planning Basics | `estate-planning-basics` | Wills, revocable trusts, beneficiary designations, durable power of attorney, avoiding probate | Adv | retirement-income-strategies | — |

**Validation Findings:**
- ✅ One of the most complete and well-structured paths in the entire blueprint
- ✅ 6 topics is justified by the breadth and life-stage importance of this subject
- ✅ Full beginner-to-advanced arc — topics 1–3 serve a 25-year-old; topics 4–6 serve someone at 55+

**Coverage Score: 92/100**

**Beginner Completeness:** ✅ Topics 1→2→3 give a reader in their 20s everything they need to start correctly.

---

### stock-market
**Reader Objective:** Understand equity markets — how they work, how to analyze stocks, construct a portfolio, and manage market psychology.
**Canonical Learning Goal:** A reader can explain how stock markets function, apply fundamental and technical analysis, build a diversified portfolio, and avoid behavioral traps.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Stock Market Fundamentals | `stock-market-fundamentals` | How stocks work, primary vs secondary markets, exchanges, order types, what drives prices | B | — | fundamental-analysis |
| 2 | Fundamental Analysis | `fundamental-analysis` | Reading income statements and balance sheets, P/E, EV/EBITDA, P/B, assessing business quality | C | stock-market-fundamentals | technical-analysis |
| 3 | Technical Analysis | `technical-analysis` | Chart patterns, support/resistance, moving averages, RSI, MACD, the limits and critiques of TA | C | stock-market-fundamentals | portfolio-construction |
| 4 | Portfolio Construction | `portfolio-construction` | Asset allocation, diversification, correlation, rebalancing, single-stock concentration risk | A | fundamental-analysis | market-cycles-and-psychology |
| 5 | Market Cycles & Psychology | `market-cycles-and-psychology` | Bull and bear market phases, the four stages of a market cycle, investor psychology biases (FOMO, panic selling) | BP | portfolio-construction | — |

**Validation Findings:**
- ✅ Complete and well-ordered — covers both analytical and behavioral dimensions
- ⚠️ **Missing:** Stock screening and research process — the practical step between "understand analysis" and "build a portfolio"; how to find and filter ideas

**Coverage Score: 86/100**

**Beginner Completeness:** ✅ Topics 1→2 are foundational and accessible.

---

### taxes
**Reader Objective:** Understand the tax system, maximize legal deductions, and plan proactively.
**Canonical Learning Goal:** A reader can file taxes correctly, identify major deduction opportunities, understand investment and self-employment tax treatment, and apply proactive tax planning strategies.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Tax Fundamentals | `tax-fundamentals` | Marginal vs effective tax rate, W-2 vs 1099, filing status, standard deduction, the filing process | B | — | tax-deductions |
| 2 | Tax Deductions | `tax-deductions` | Itemized vs standard deduction decision, Schedule A, common itemized deductions, deduction strategies | C | tax-fundamentals | investment-taxes |
| 3 | Investment Taxes | `investment-taxes` | Short-term vs long-term capital gains rates, qualified dividends, wash-sale rule, tax-advantaged accounts | A | tax-fundamentals | self-employment-taxes |
| 4 | Self-Employment Taxes | `self-employment-taxes` | Self-employment tax calculation, quarterly estimated payments, Schedule C deductions, business structure tax implications | A | tax-fundamentals | tax-planning-strategies |
| 5 | Tax Planning Strategies | `tax-planning-strategies` | Roth conversion ladders, income timing, charitable giving strategies, bunching deductions, when to hire a CPA | Adv | tax-deductions | — |

**Validation Findings:**
- ✅ High reader value — one of the most actionable subcategories in the entire blueprint
- ✅ Covers all major tax situations: employee, investor, and self-employed
- ⚠️ **Missing:** State and local taxes — SALT deduction, state income tax, property taxes; federal-only coverage is a gap

**Coverage Score: 87/100**

**Beginner Completeness:** ✅ Topic 1 is one of the most practically important in the entire blueprint — everyone files taxes.

---

## EDUCATION

**Category Objective:** Understand how learning works and how to succeed across all educational contexts — as a student, parent, or educator.
**Reader Profile:** Students, parents, teachers, lifelong learners, career changers.

---

### exams-certifications
**Reader Objective:** Prepare effectively for any exam or professional certification.
**Canonical Learning Goal:** A reader can apply evidence-based study methods, navigate standardized tests and professional certifications, and sequence credentials strategically.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Exam Preparation Strategies | `exam-preparation-strategies` | Spaced repetition, active recall, the Feynman technique, building a study schedule | B | — | practice-tests-and-mock-exams |
| 2 | Standardized Testing | `standardized-testing` | SAT, GRE, GMAT, IELTS/TOEFL — structure, scoring, and evidence-based prep approach | C | exam-preparation-strategies | practice-tests-and-mock-exams |
| 3 | Professional Certifications | `professional-certifications` | PMP, CFA, CPA, AWS, CompTIA — evaluating which certification to pursue and why | C | exam-preparation-strategies | certification-roadmaps |
| 4 | Practice Tests & Mock Exams | `practice-tests-and-mock-exams` | How to use practice exams diagnostically, interpreting results, targeting weak areas systematically | A | exam-preparation-strategies | — |
| 5 | Certification Roadmaps | `certification-roadmaps` | Sequencing certifications for a tech, finance, or project management career path | Adv | professional-certifications | — |

**Validation Findings:**
- ✅ Well-structured and practical for anyone preparing for any exam
- ⚠️ **Missing:** Test anxiety and performance psychology — managing nerves, sleep before exams, peak performance on test day

**Coverage Score: 84/100**

**Beginner Completeness:** ✅ Topic 1 is immediately applicable to any learner preparing for anything.

---

### higher-education
**Reader Objective:** Make informed decisions about college, financing, and academic success.
**Canonical Learning Goal:** A reader can evaluate college fit, navigate admissions, understand financing, succeed academically, and make informed graduate school decisions.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Choosing a College | `choosing-a-college` | Evaluate fit on rankings, location, cost, campus culture, major offerings | B | — | college-admissions |
| 2 | College Admissions | `college-admissions` | Application timeline, Common App, essay strategy, recommendation letters, holistic review | C | choosing-a-college | college-financing |
| 3 | College Financing | `college-financing` | FAFSA process, Expected Family Contribution, scholarships, grants, federal loans, net cost calculation | C | choosing-a-college | academic-success |
| 4 | Academic Success | `academic-success` | Time management, office hours, study habits, GPA strategy, managing college workload | A | choosing-a-college | graduate-school |
| 5 | Graduate School | `graduate-school` | When grad school makes financial and career sense, program types, applications, funding options | Adv | academic-success | — |

**Validation Findings:**
- ✅ Covers the full higher education journey from decision to graduate school
- ⚠️ **Ordering fix applied:** `academic-success` moved from position 5 to position 4 — this is needed from day 1 of college, not as an advanced capstone topic
- ⚠️ **Missing:** Choosing a major — one of the most consequential, and least-guided, decisions in college

**Coverage Score: 80/100**

**Beginner Completeness:** ✅ Strong with ordering correction applied.

---

### language-learning
**Reader Objective:** Acquire a second language efficiently using evidence-based methods.
**Canonical Learning Goal:** A reader understands how adult language acquisition works, can build vocabulary systematically, develop grammar through patterns, practice speaking, and leverage the right tools.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Language Learning Fundamentals | `language-learning-fundamentals` | Input hypothesis, comprehensible input, CEFR levels (A1–C2), how adults differ from children in acquisition | B | — | vocabulary-building |
| 2 | Vocabulary Building | `vocabulary-building` | Anki setup, frequency-based word lists, spaced repetition intervals, vocabulary growth targets | C | language-learning-fundamentals | grammar-mastery |
| 3 | Grammar Mastery | `grammar-mastery` | Communicative grammar approach, pattern recognition, when explicit grammar study helps vs hinders | C | language-learning-fundamentals | speaking-and-pronunciation |
| 4 | Speaking & Pronunciation | `speaking-and-pronunciation` | Finding conversation partners (italki, Tandem), shadowing technique, phoneme practice | A | grammar-mastery | language-learning-tools |
| 5 | Language Learning Tools | `language-learning-tools` | Evaluate and combine Duolingo, Anki, italki, Netflix immersion, LingQ — what each is good for | A | language-learning-fundamentals | — |

**Validation Findings:**
- ✅ Strong methodology — mirrors serious polyglot and applied linguistics approaches
- ⚠️ **Missing:** `reading-and-listening-in-a-new-language` — reading and listening are two of the four core language skills; their absence leaves a significant gap in the path
- ⚠️ **Missing:** Immersion strategies — how to create a language environment without living abroad

**Coverage Score: 80/100**

**Beginner Completeness:** ✅ Topics 1→2 give a beginner a structured, evidence-based start.

---

### personal-development
**Reader Objective:** Build sustainable systems for growth, discipline, and personal effectiveness.
**Canonical Learning Goal:** A reader can set meaningful goals, build lasting habits, manage time effectively, cultivate a growth mindset, and develop self-discipline through systems.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Goal Setting | `goal-setting` | SMART goals, outcome vs process goals, OKR framework, writing goals that actually stick | B | — | habit-formation |
| 2 | Habit Formation | `habit-formation` | The habit loop (cue-routine-reward), identity-based habits, habit stacking, keystone habits | C | goal-setting | time-management |
| 3 | Time Management | `time-management` | Time blocking, the Eisenhower matrix, deep work vs shallow work, eliminating time waste | A | habit-formation | self-discipline |
| 4 | Mindset & Growth | `mindset-and-growth` | Fixed vs growth mindset, deliberate practice, building a learning identity, neuroplasticity | C | goal-setting | self-discipline |
| 5 | Self-Discipline | `self-discipline` | Willpower depletion (ego depletion research), environment design, building systems over relying on motivation | Adv | habit-formation | — |

**Validation Findings:**
- ✅ Well-validated by existing literature (Atomic Habits, Deep Work, Mindset, Willpower)
- ✅ Full beginner to advanced arc
- ⚠️ **Missing:** Energy management — productivity is not just time management; managing physical and mental energy (sleep, exercise, recovery cycles) is foundational

**Coverage Score: 86/100**

**Beginner Completeness:** ✅ Topics 1→2 are immediately actionable for anyone starting out.

---

### research-skills
**Reader Objective:** Find, evaluate, and use information effectively — from casual research to academic work.
**Canonical Learning Goal:** A reader can construct a research question, find credible sources, apply critical thinking, interpret data, and communicate findings clearly.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Research Fundamentals | `research-fundamentals` | Primary vs secondary sources, source credibility evaluation, constructing a research question | B | — | academic-research |
| 2 | Academic Research | `academic-research` | Google Scholar, PubMed, JSTOR, understanding peer review, citation formats, literature reviews | C | research-fundamentals | critical-thinking |
| 3 | Critical Thinking | `critical-thinking` | Identifying logical fallacies, evaluating argument structure, evidence quality standards, steel-manning | C | research-fundamentals | data-literacy |
| 4 | Data Literacy | `data-literacy` | Reading charts and graphs, understanding statistical significance, identifying misleading visualizations | A | critical-thinking | writing-and-communication |
| 5 | Writing & Communication | `writing-and-communication` | Structuring a clear argument, persuasive writing, making complex ideas accessible | A | data-literacy | — |

**Validation Findings:**
- ✅ Covers the full research-to-communication pipeline
- ✅ Strong arc from information finding to critical evaluation to communication
- ⚠️ **Missing:** Note-taking and knowledge management — how to capture and retain what you research (Zettelkasten, Notion, Obsidian)

**Coverage Score: 86/100**

**Beginner Completeness:** ✅ Topics 1→2 give immediate value to students and professionals alike.

---

### school-education
**Reader Objective:** Understand the school education system — for parents, educators, and administrators.
**Canonical Learning Goal:** A reader understands how K-12 education works, can support a child's learning, understands special education rights, and knows how technology fits in schools.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Primary Education | `primary-education` | K-6 curriculum design, learning milestones by age, reading and numeracy foundations | B | — | secondary-education |
| 2 | Secondary Education | `secondary-education` | High school curriculum, elective selection, GPA calculation, AP/IB programs, college prep | C | primary-education | special-education |
| 3 | Special Education | `special-education` | IDEA law, IEPs, 504 plans, learning disability types, inclusion vs pull-out models | C | primary-education | parental-involvement |
| 4 | Parental Involvement | `parental-involvement` | How to support homework without over-helping, parent-teacher communication, advocating for a child | A | primary-education | education-technology |
| 5 | Education Technology | `education-technology` | LMS platforms (Canvas, Google Classroom), EdTech tool evaluation, digital literacy, screen time | Adv | secondary-education | — |

**Validation Findings:**
- ✅ Covers the K-12 system comprehensively for its audience
- ⚠️ **Missing:** Homeschooling — a significant and growing segment with its own curriculum and legal frameworks
- ⚠️ **Missing:** Assessment and standardized testing in schools (distinct from the exams-certifications subcategory which is about personal test preparation)

**Coverage Score: 78/100**

**Beginner Completeness:** ✅ Topics 1→2 are accessible to any parent or new teacher.

---

### teaching
**Reader Objective:** Become a more effective educator — in classrooms, online, and in professional training contexts.
**Canonical Learning Goal:** A reader can design effective lessons, manage a classroom, build curricula, assess and provide feedback, and teach effectively online.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Teaching Fundamentals | `teaching-fundamentals` | Bloom's Taxonomy, learning styles (and the evidence against rigid styles), constructivism, evidence-based pedagogy | B | — | classroom-management |
| 2 | Classroom Management | `classroom-management` | Establishing routines, proactive behavior management, engagement strategies, restorative practices | C | teaching-fundamentals | curriculum-design |
| 3 | Curriculum Design | `curriculum-design` | Writing measurable learning objectives, content sequencing, backwards design (UbD), assessment alignment | A | teaching-fundamentals | assessment-and-feedback |
| 4 | Assessment & Feedback | `assessment-and-feedback` | Formative vs summative assessment, rubric design, feedback that closes the learning gap | A | curriculum-design | online-teaching |
| 5 | Online Teaching | `online-teaching` | Synchronous vs asynchronous design, LMS (Canvas, Moodle), engagement in virtual classrooms | Adv | assessment-and-feedback | — |

**Validation Findings:**
- ✅ Closely mirrors professional teacher certification curricula
- ✅ Full beginner to advanced arc — topic 1 is the pedagogy foundation, topic 5 is the modern advanced form
- ⚠️ **Missing:** Differentiated instruction — teaching diverse learners with different needs simultaneously is a core competency

**Coverage Score: 85/100**

**Beginner Completeness:** ✅ Topics 1→2 are essential for any new teacher and accessible with no prior experience.

---

*Continued in BLUEPRINT_REVIEW_PART4.md — Health & Wellness + Home & Lifestyle + Travel*
