-- Migration: Seed Master Taxonomy
-- 7 Categories + Official Master Taxonomy (82 Subcategories)
-- Architecture: Category → Subcategory → Topic → Article

-- ═══════════════════════════════════════════════════════════════════
-- Clear existing data (fresh seed)
-- ═══════════════════════════════════════════════════════════════════

DELETE FROM subcategory_translations;
DELETE FROM subcategories;
DELETE FROM category_translations;
DELETE FROM categories;

-- ═══════════════════════════════════════════════════════════════════
-- 1. Categories
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO categories (id, slug, sort_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'technology',        1),
  ('c0000001-0000-0000-0000-000000000002', 'business',          2),
  ('c0000001-0000-0000-0000-000000000003', 'personal-finance',  3),
  ('c0000001-0000-0000-0000-000000000004', 'health-wellness',   4),
  ('c0000001-0000-0000-0000-000000000005', 'education-learning', 5),
  ('c0000001-0000-0000-0000-000000000006', 'home-lifestyle',    6),
  ('c0000001-0000-0000-0000-000000000007', 'travel',            7);

INSERT INTO category_translations (category_id, language_code, name, description, meta_title, meta_description) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'en', 'Technology',          'Programming, AI, web development, cloud computing, cybersecurity and more.', 'Technology Articles & Guides', 'Learn programming, AI, web development, DevOps, cybersecurity and more with in-depth guides and tutorials.'),
  ('c0000001-0000-0000-0000-000000000002', 'en', 'Business',            'Entrepreneurship, marketing, sales, management, leadership and strategy.', 'Business Articles & Guides', 'Master entrepreneurship, marketing, sales, management and business strategy with expert guides.'),
  ('c0000001-0000-0000-0000-000000000003', 'en', 'Personal Finance',    'Investing, banking, credit, loans, insurance, taxes and retirement planning.', 'Personal Finance Articles & Guides', 'Learn investing, budgeting, credit management, taxes and retirement planning with practical guides.'),
  ('c0000001-0000-0000-0000-000000000004', 'en', 'Health & Wellness',   'Nutrition, fitness, mental health, diseases, medications and preventive care.', 'Health & Wellness Articles & Guides', 'Expert guides on nutrition, fitness, mental health, medical conditions and healthy living.'),
  ('c0000001-0000-0000-0000-000000000005', 'en', 'Education & Learning','Study skills, online learning, career development, exams and personal growth.', 'Education & Learning Articles & Guides', 'Improve your study skills, career development, exam preparation and lifelong learning.'),
  ('c0000001-0000-0000-0000-000000000006', 'en', 'Home & Lifestyle',    'Home improvement, cooking, gardening, DIY, parenting, fashion and beauty.', 'Home & Lifestyle Articles & Guides', 'Practical guides on home improvement, cooking, gardening, DIY projects and lifestyle tips.'),
  ('c0000001-0000-0000-0000-000000000007', 'en', 'Travel',              'Destinations, planning, budget travel, luxury travel, visa, safety and tips.', 'Travel Articles & Guides', 'Plan your travels with guides on destinations, budget tips, visa info, safety and cultural experiences.');

-- ═══════════════════════════════════════════════════════════════════
-- 2. Subcategories — Technology (13)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO subcategories (id, slug, category_id, sort_order) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'programming',          'c0000001-0000-0000-0000-000000000001', 1),
  ('s0000001-0000-0000-0000-000000000002', 'artificial-intelligence','c0000001-0000-0000-0000-000000000001', 2),
  ('s0000001-0000-0000-0000-000000000003', 'web-development',      'c0000001-0000-0000-0000-000000000001', 3),
  ('s0000001-0000-0000-0000-000000000004', 'mobile-development',   'c0000001-0000-0000-0000-000000000001', 4),
  ('s0000001-0000-0000-0000-000000000005', 'cloud-computing',      'c0000001-0000-0000-0000-000000000001', 5),
  ('s0000001-0000-0000-0000-000000000006', 'devops',               'c0000001-0000-0000-0000-000000000001', 6),
  ('s0000001-0000-0000-0000-000000000007', 'cybersecurity',        'c0000001-0000-0000-0000-000000000001', 7),
  ('s0000001-0000-0000-0000-000000000008', 'data-science',         'c0000001-0000-0000-0000-000000000001', 8),
  ('s0000001-0000-0000-0000-000000000009', 'networking',           'c0000001-0000-0000-0000-000000000001', 9),
  ('s0000001-0000-0000-0000-000000000010', 'databases',            'c0000001-0000-0000-0000-000000000001', 10),
  ('s0000001-0000-0000-0000-000000000011', 'operating-systems',    'c0000001-0000-0000-0000-000000000001', 11),
  ('s0000001-0000-0000-0000-000000000012', 'hardware-iot',         'c0000001-0000-0000-0000-000000000001', 12),
  ('s0000001-0000-0000-0000-000000000013', 'software-engineering', 'c0000001-0000-0000-0000-000000000001', 13);

INSERT INTO subcategory_translations (subcategory_id, language_code, name, description, meta_title, meta_description) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'en', 'Programming',           'Languages, frameworks, algorithms and coding fundamentals.',          'Programming Guides',           'Learn programming languages, algorithms, data structures and coding best practices.'),
  ('s0000001-0000-0000-0000-000000000002', 'en', 'Artificial Intelligence','Machine learning, deep learning, NLP and AI applications.',           'AI & Machine Learning Guides', 'Understand machine learning, deep learning, NLP and real-world AI applications.'),
  ('s0000001-0000-0000-0000-000000000003', 'en', 'Web Development',       'Frontend, backend, full-stack, APIs and web technologies.',           'Web Development Guides',       'Master frontend, backend, full-stack development and modern web technologies.'),
  ('s0000001-0000-0000-0000-000000000004', 'en', 'Mobile Development',    'iOS, Android, cross-platform and mobile-first development.',          'Mobile Development Guides',    'Build iOS, Android and cross-platform mobile applications.'),
  ('s0000001-0000-0000-0000-000000000005', 'en', 'Cloud Computing',       'AWS, Azure, GCP, serverless, containers and cloud architecture.',     'Cloud Computing Guides',       'Learn cloud platforms, serverless architecture, containers and cloud-native development.'),
  ('s0000001-0000-0000-0000-000000000006', 'en', 'DevOps',                'CI/CD, Docker, Kubernetes, monitoring and infrastructure as code.',   'DevOps Guides',                'Master CI/CD, Docker, Kubernetes, monitoring and infrastructure automation.'),
  ('s0000001-0000-0000-0000-000000000007', 'en', 'Cybersecurity',         'Network security, encryption, ethical hacking and threat prevention.','Cybersecurity Guides',         'Learn network security, encryption, ethical hacking and cyber threat prevention.'),
  ('s0000001-0000-0000-0000-000000000008', 'en', 'Data Science',          'Data analysis, visualisation, statistics and big data tools.',        'Data Science Guides',          'Master data analysis, statistics, visualisation and big data processing tools.'),
  ('s0000001-0000-0000-0000-000000000009', 'en', 'Networking',            'TCP/IP, DNS, routing, firewalls and network administration.',         'Networking Guides',            'Understand TCP/IP, DNS, routing, firewalls and network infrastructure.'),
  ('s0000001-0000-0000-0000-000000000010', 'en', 'Databases',             'SQL, NoSQL, query optimisation, indexing and database design.',       'Database Guides',              'Learn SQL, NoSQL, database design, query optimisation and data modelling.'),
  ('s0000001-0000-0000-0000-000000000011', 'en', 'Operating Systems',     'Linux, Windows, macOS, process management and system internals.',     'Operating System Guides',      'Understand Linux, Windows, macOS, process management and OS internals.'),
  ('s0000001-0000-0000-0000-000000000012', 'en', 'Hardware & IoT',        'Processors, embedded systems, Arduino, Raspberry Pi and IoT.',       'Hardware & IoT Guides',        'Learn about processors, embedded systems, Arduino, Raspberry Pi and IoT development.'),
  ('s0000001-0000-0000-0000-000000000013', 'en', 'Software Engineering',  'Design patterns, architecture, testing, code quality and workflows.','Software Engineering Guides',  'Master design patterns, software architecture, testing and engineering best practices.');

-- ═══════════════════════════════════════════════════════════════════
-- 3. Subcategories — Business (12)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO subcategories (id, slug, category_id, sort_order) VALUES
  ('s0000002-0000-0000-0000-000000000001', 'entrepreneurship',    'c0000001-0000-0000-0000-000000000002', 1),
  ('s0000002-0000-0000-0000-000000000002', 'marketing',           'c0000001-0000-0000-0000-000000000002', 2),
  ('s0000002-0000-0000-0000-000000000003', 'sales',               'c0000001-0000-0000-0000-000000000002', 3),
  ('s0000002-0000-0000-0000-000000000004', 'management',          'c0000001-0000-0000-0000-000000000002', 4),
  ('s0000002-0000-0000-0000-000000000005', 'leadership',          'c0000001-0000-0000-0000-000000000002', 5),
  ('s0000002-0000-0000-0000-000000000006', 'startups',            'c0000001-0000-0000-0000-000000000002', 6),
  ('s0000002-0000-0000-0000-000000000007', 'e-commerce',          'c0000001-0000-0000-0000-000000000002', 7),
  ('s0000002-0000-0000-0000-000000000008', 'operations',          'c0000001-0000-0000-0000-000000000002', 8),
  ('s0000002-0000-0000-0000-000000000009', 'human-resources',     'c0000001-0000-0000-0000-000000000002', 9),
  ('s0000002-0000-0000-0000-000000000010', 'customer-service',    'c0000001-0000-0000-0000-000000000002', 10),
  ('s0000002-0000-0000-0000-000000000011', 'business-strategy',   'c0000001-0000-0000-0000-000000000002', 11),
  ('s0000002-0000-0000-0000-000000000012', 'project-management',  'c0000001-0000-0000-0000-000000000002', 12);

INSERT INTO subcategory_translations (subcategory_id, language_code, name, description, meta_title, meta_description) VALUES
  ('s0000002-0000-0000-0000-000000000001', 'en', 'Entrepreneurship',   'Starting, growing and scaling a business from idea to execution.',     'Entrepreneurship Guides',  'Learn how to start, grow and scale a business with practical entrepreneurship guides.'),
  ('s0000002-0000-0000-0000-000000000002', 'en', 'Marketing',          'Digital marketing, SEO, social media, content and brand strategy.',    'Marketing Guides',         'Master digital marketing, SEO, social media, content marketing and brand building.'),
  ('s0000002-0000-0000-0000-000000000003', 'en', 'Sales',              'Sales techniques, negotiation, CRM and revenue generation.',          'Sales Guides',             'Improve your sales skills with guides on techniques, negotiation and CRM tools.'),
  ('s0000002-0000-0000-0000-000000000004', 'en', 'Management',         'Team management, decision-making, delegation and organisational skills.','Management Guides',      'Learn team management, decision-making, delegation and organisational best practices.'),
  ('s0000002-0000-0000-0000-000000000005', 'en', 'Leadership',         'Leadership styles, communication, vision and team motivation.',       'Leadership Guides',        'Develop your leadership skills with guides on communication, vision and motivation.'),
  ('s0000002-0000-0000-0000-000000000006', 'en', 'Startups',           'Startup funding, MVP, product-market fit and scaling strategies.',    'Startup Guides',           'Navigate startup challenges from funding and MVP to product-market fit and scaling.'),
  ('s0000002-0000-0000-0000-000000000007', 'en', 'E-commerce',         'Online stores, payment processing, logistics and conversion.',        'E-commerce Guides',        'Build and grow your online store with guides on payments, logistics and conversions.'),
  ('s0000002-0000-0000-0000-000000000008', 'en', 'Operations',         'Supply chain, process optimisation, quality control and logistics.',  'Operations Guides',        'Optimise business operations with guides on supply chain, process and quality management.'),
  ('s0000002-0000-0000-0000-000000000009', 'en', 'Human Resources',    'Hiring, employee engagement, compensation and workplace culture.',    'HR Guides',                'Master hiring, employee engagement, compensation strategies and workplace culture.'),
  ('s0000002-0000-0000-0000-000000000010', 'en', 'Customer Service',   'Support systems, customer satisfaction, retention and loyalty.',      'Customer Service Guides',  'Improve customer satisfaction, retention and loyalty with effective support strategies.'),
  ('s0000002-0000-0000-0000-000000000011', 'en', 'Business Strategy',  'Competitive analysis, growth planning, mergers and market positioning.','Business Strategy Guides','Plan business growth with guides on competitive analysis, positioning and strategy.'),
  ('s0000002-0000-0000-0000-000000000012', 'en', 'Project Management', 'Agile, Scrum, Kanban, timelines, budgets and team coordination.',     'Project Management Guides','Master Agile, Scrum, Kanban and project planning with practical guides.');

-- ═══════════════════════════════════════════════════════════════════
-- 4. Subcategories — Personal Finance (12)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO subcategories (id, slug, category_id, sort_order) VALUES
  ('s0000003-0000-0000-0000-000000000001', 'personal-finance-basics','c0000001-0000-0000-0000-000000000003', 1),
  ('s0000003-0000-0000-0000-000000000002', 'investing',             'c0000001-0000-0000-0000-000000000003', 2),
  ('s0000003-0000-0000-0000-000000000003', 'stock-market',          'c0000001-0000-0000-0000-000000000003', 3),
  ('s0000003-0000-0000-0000-000000000004', 'mutual-funds',          'c0000001-0000-0000-0000-000000000003', 4),
  ('s0000003-0000-0000-0000-000000000005', 'etfs',                  'c0000001-0000-0000-0000-000000000003', 5),
  ('s0000003-0000-0000-0000-000000000006', 'banking',               'c0000001-0000-0000-0000-000000000003', 6),
  ('s0000003-0000-0000-0000-000000000007', 'credit-cards',          'c0000001-0000-0000-0000-000000000003', 7),
  ('s0000003-0000-0000-0000-000000000008', 'loans-mortgages',       'c0000001-0000-0000-0000-000000000003', 8),
  ('s0000003-0000-0000-0000-000000000009', 'insurance',             'c0000001-0000-0000-0000-000000000003', 9),
  ('s0000003-0000-0000-0000-000000000010', 'taxes',                 'c0000001-0000-0000-0000-000000000003', 10),
  ('s0000003-0000-0000-0000-000000000011', 'retirement-planning',   'c0000001-0000-0000-0000-000000000003', 11),
  ('s0000003-0000-0000-0000-000000000012', 'cryptocurrency',        'c0000001-0000-0000-0000-000000000003', 12);

INSERT INTO subcategory_translations (subcategory_id, language_code, name, description, meta_title, meta_description) VALUES
  ('s0000003-0000-0000-0000-000000000001', 'en', 'Personal Finance Basics','Budgeting, saving, emergency funds and financial literacy.',         'Personal Finance Basics',       'Build a strong financial foundation with guides on budgeting, saving and financial literacy.'),
  ('s0000003-0000-0000-0000-000000000002', 'en', 'Investing',              'Investment strategies, portfolio building and asset allocation.',      'Investing Guides',              'Learn investment strategies, portfolio building and smart asset allocation.'),
  ('s0000003-0000-0000-0000-000000000003', 'en', 'Stock Market',           'Stock trading, analysis, IPOs, dividends and market fundamentals.',   'Stock Market Guides',           'Understand stock trading, technical analysis, IPOs and dividend investing.'),
  ('s0000003-0000-0000-0000-000000000004', 'en', 'Mutual Funds',           'Fund selection, SIPs, NAV, expense ratios and fund categories.',      'Mutual Fund Guides',            'Learn mutual fund selection, SIP investing, NAV analysis and fund categories.'),
  ('s0000003-0000-0000-0000-000000000005', 'en', 'ETFs',                   'Exchange-traded funds, index tracking, sector ETFs and trading.',      'ETF Guides',                    'Understand ETFs, index tracking, sector funds and ETF trading strategies.'),
  ('s0000003-0000-0000-0000-000000000006', 'en', 'Banking',                'Savings accounts, fixed deposits, digital banking and bank services.','Banking Guides',                'Compare savings accounts, fixed deposits, digital banking and bank services.'),
  ('s0000003-0000-0000-0000-000000000007', 'en', 'Credit Cards',           'Card selection, rewards, credit score, interest and responsible use.','Credit Card Guides',            'Choose the right credit card, maximise rewards and manage your credit score.'),
  ('s0000003-0000-0000-0000-000000000008', 'en', 'Loans & Mortgages',      'Home loans, personal loans, EMI, interest rates and refinancing.',    'Loan & Mortgage Guides',        'Compare home loans, personal loans, understand EMI calculations and refinancing.'),
  ('s0000003-0000-0000-0000-000000000009', 'en', 'Insurance',              'Life, health, auto, home insurance and policy comparison.',           'Insurance Guides',              'Compare life, health, auto and home insurance policies with expert guides.'),
  ('s0000003-0000-0000-0000-000000000010', 'en', 'Taxes',                  'Income tax, deductions, filing, tax planning and compliance.',        'Tax Guides',                    'Simplify income tax filing, deductions, tax planning and compliance.'),
  ('s0000003-0000-0000-0000-000000000011', 'en', 'Retirement Planning',    '401k, IRA, pension, Social Security and retirement strategies.',      'Retirement Planning Guides',    'Plan your retirement with guides on 401k, IRA, pension and Social Security.'),
  ('s0000003-0000-0000-0000-000000000012', 'en', 'Cryptocurrency',         'Bitcoin, Ethereum, DeFi, wallets, exchanges and blockchain.',         'Cryptocurrency Guides',         'Learn about Bitcoin, Ethereum, DeFi, crypto wallets and blockchain technology.');

-- ═══════════════════════════════════════════════════════════════════
-- 5. Subcategories — Health & Wellness (12)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO subcategories (id, slug, category_id, sort_order) VALUES
  ('s0000004-0000-0000-0000-000000000001', 'nutrition',           'c0000001-0000-0000-0000-000000000004', 1),
  ('s0000004-0000-0000-0000-000000000002', 'fitness',             'c0000001-0000-0000-0000-000000000004', 2),
  ('s0000004-0000-0000-0000-000000000003', 'mental-health',       'c0000001-0000-0000-0000-000000000004', 3),
  ('s0000004-0000-0000-0000-000000000004', 'diseases-conditions', 'c0000001-0000-0000-0000-000000000004', 4),
  ('s0000004-0000-0000-0000-000000000005', 'medications',         'c0000001-0000-0000-0000-000000000004', 5),
  ('s0000004-0000-0000-0000-000000000006', 'womens-health',       'c0000001-0000-0000-0000-000000000004', 6),
  ('s0000004-0000-0000-0000-000000000007', 'mens-health',         'c0000001-0000-0000-0000-000000000004', 7),
  ('s0000004-0000-0000-0000-000000000008', 'childrens-health',    'c0000001-0000-0000-0000-000000000004', 8),
  ('s0000004-0000-0000-0000-000000000009', 'preventive-care',     'c0000001-0000-0000-0000-000000000004', 9),
  ('s0000004-0000-0000-0000-000000000010', 'healthy-lifestyle',   'c0000001-0000-0000-0000-000000000004', 10),
  ('s0000004-0000-0000-0000-000000000011', 'medical-tests',       'c0000001-0000-0000-0000-000000000004', 11),
  ('s0000004-0000-0000-0000-000000000012', 'alternative-medicine','c0000001-0000-0000-0000-000000000004', 12);

INSERT INTO subcategory_translations (subcategory_id, language_code, name, description, meta_title, meta_description) VALUES
  ('s0000004-0000-0000-0000-000000000001', 'en', 'Nutrition',            'Diet plans, vitamins, minerals, macros and healthy eating.',            'Nutrition Guides',            'Learn about diet plans, vitamins, minerals and healthy eating habits.'),
  ('s0000004-0000-0000-0000-000000000002', 'en', 'Fitness',              'Workouts, strength training, cardio, flexibility and exercise plans.', 'Fitness Guides',              'Build your fitness with guides on workouts, strength training and exercise plans.'),
  ('s0000004-0000-0000-0000-000000000003', 'en', 'Mental Health',        'Anxiety, depression, stress management, therapy and mindfulness.',     'Mental Health Guides',        'Understand anxiety, depression, stress management and mindfulness techniques.'),
  ('s0000004-0000-0000-0000-000000000004', 'en', 'Diseases & Conditions','Symptoms, diagnosis, treatment options and disease management.',       'Disease & Condition Guides',  'Learn about symptoms, diagnosis, treatment options and disease management.'),
  ('s0000004-0000-0000-0000-000000000005', 'en', 'Medications',          'Drug information, side effects, interactions and usage guidelines.',   'Medication Guides',           'Understand medications, side effects, drug interactions and proper usage.'),
  ('s0000004-0000-0000-0000-000000000006', 'en', 'Women''s Health',       'Reproductive health, pregnancy, menopause and women-specific care.',   'Women''s Health Guides',       'Expert guides on reproductive health, pregnancy, menopause and women''s wellness.'),
  ('s0000004-0000-0000-0000-000000000007', 'en', 'Men''s Health',         'Prostate health, testosterone, fitness and men-specific conditions.',  'Men''s Health Guides',         'Guides on prostate health, testosterone, fitness and men-specific health topics.'),
  ('s0000004-0000-0000-0000-000000000008', 'en', 'Children''s Health',    'Paediatric care, vaccinations, growth and childhood conditions.',      'Children''s Health Guides',    'Learn about paediatric care, vaccinations, growth milestones and childhood health.'),
  ('s0000004-0000-0000-0000-000000000009', 'en', 'Preventive Care',      'Screenings, check-ups, vaccinations and early detection.',             'Preventive Care Guides',      'Stay healthy with guides on screenings, check-ups, vaccinations and early detection.'),
  ('s0000004-0000-0000-0000-000000000010', 'en', 'Healthy Lifestyle',    'Sleep, hydration, habits, work-life balance and wellness routines.',   'Healthy Lifestyle Guides',    'Build a healthy lifestyle with guides on sleep, hydration, habits and wellness.'),
  ('s0000004-0000-0000-0000-000000000011', 'en', 'Medical Tests',        'Blood tests, imaging, diagnostic procedures and test interpretation.','Medical Test Guides',         'Understand blood tests, imaging, diagnostic procedures and how to read results.'),
  ('s0000004-0000-0000-0000-000000000012', 'en', 'Alternative Medicine', 'Ayurveda, acupuncture, herbal remedies and complementary therapies.', 'Alternative Medicine Guides', 'Explore Ayurveda, acupuncture, herbal remedies and complementary health therapies.');

-- ═══════════════════════════════════════════════════════════════════
-- 6. Subcategories — Education & Learning (10)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO subcategories (id, slug, category_id, sort_order) VALUES
  ('s0000005-0000-0000-0000-000000000001', 'study-skills',          'c0000001-0000-0000-0000-000000000005', 1),
  ('s0000005-0000-0000-0000-000000000002', 'school-education',      'c0000001-0000-0000-0000-000000000005', 2),
  ('s0000005-0000-0000-0000-000000000003', 'higher-education',      'c0000001-0000-0000-0000-000000000005', 3),
  ('s0000005-0000-0000-0000-000000000004', 'online-learning',       'c0000001-0000-0000-0000-000000000005', 4),
  ('s0000005-0000-0000-0000-000000000005', 'career-development',    'c0000001-0000-0000-0000-000000000005', 5),
  ('s0000005-0000-0000-0000-000000000006', 'language-learning',     'c0000001-0000-0000-0000-000000000005', 6),
  ('s0000005-0000-0000-0000-000000000007', 'exams-certifications',  'c0000001-0000-0000-0000-000000000005', 7),
  ('s0000005-0000-0000-0000-000000000008', 'teaching',              'c0000001-0000-0000-0000-000000000005', 8),
  ('s0000005-0000-0000-0000-000000000009', 'research-skills',       'c0000001-0000-0000-0000-000000000005', 9),
  ('s0000005-0000-0000-0000-000000000010', 'personal-development',  'c0000001-0000-0000-0000-000000000005', 10);

INSERT INTO subcategory_translations (subcategory_id, language_code, name, description, meta_title, meta_description) VALUES
  ('s0000005-0000-0000-0000-000000000001', 'en', 'Study Skills',          'Note-taking, memory techniques, time management and exam prep.',       'Study Skills Guides',          'Improve your study skills with guides on note-taking, memory techniques and time management.'),
  ('s0000005-0000-0000-0000-000000000002', 'en', 'School Education',      'K-12 subjects, homework help, school selection and curriculum.',        'School Education Guides',      'Support school education with guides on subjects, homework strategies and curriculum.'),
  ('s0000005-0000-0000-0000-000000000003', 'en', 'Higher Education',      'College applications, degrees, graduate school and academic life.',     'Higher Education Guides',      'Navigate college applications, degree selection and graduate school with expert guides.'),
  ('s0000005-0000-0000-0000-000000000004', 'en', 'Online Learning',       'MOOCs, e-learning platforms, online degrees and self-paced courses.',  'Online Learning Guides',       'Find the best MOOCs, e-learning platforms and online degree programmes.'),
  ('s0000005-0000-0000-0000-000000000005', 'en', 'Career Development',    'Resume, interviews, networking, career change and professional growth.','Career Development Guides',   'Advance your career with guides on resumes, interviews, networking and growth.'),
  ('s0000005-0000-0000-0000-000000000006', 'en', 'Language Learning',     'English, Spanish, language apps, techniques and immersion methods.',   'Language Learning Guides',     'Learn new languages with guides on techniques, apps and immersion methods.'),
  ('s0000005-0000-0000-0000-000000000007', 'en', 'Exams & Certifications','Test preparation, professional certifications and exam strategies.',   'Exam & Certification Guides',  'Prepare for exams and professional certifications with proven strategies.'),
  ('s0000005-0000-0000-0000-000000000008', 'en', 'Teaching',              'Teaching methods, classroom management, EdTech and curriculum design.','Teaching Guides',              'Improve teaching with guides on methods, classroom management and EdTech tools.'),
  ('s0000005-0000-0000-0000-000000000009', 'en', 'Research Skills',       'Academic writing, citations, research methodology and publishing.',   'Research Skills Guides',       'Master academic writing, citations, research methodology and publishing.'),
  ('s0000005-0000-0000-0000-000000000010', 'en', 'Personal Development',  'Goal setting, productivity, habits, mindset and self-improvement.',   'Personal Development Guides',  'Grow personally with guides on goal setting, productivity, habits and mindset.');

-- ═══════════════════════════════════════════════════════════════════
-- 7. Subcategories — Home & Lifestyle (12)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO subcategories (id, slug, category_id, sort_order) VALUES
  ('s0000006-0000-0000-0000-000000000001', 'home-improvement',     'c0000001-0000-0000-0000-000000000006', 1),
  ('s0000006-0000-0000-0000-000000000002', 'interior-design',      'c0000001-0000-0000-0000-000000000006', 2),
  ('s0000006-0000-0000-0000-000000000003', 'home-organization',    'c0000001-0000-0000-0000-000000000006', 3),
  ('s0000006-0000-0000-0000-000000000004', 'gardening',            'c0000001-0000-0000-0000-000000000006', 4),
  ('s0000006-0000-0000-0000-000000000005', 'cooking',              'c0000001-0000-0000-0000-000000000006', 5),
  ('s0000006-0000-0000-0000-000000000006', 'cleaning',             'c0000001-0000-0000-0000-000000000006', 6),
  ('s0000006-0000-0000-0000-000000000007', 'diy-projects',         'c0000001-0000-0000-0000-000000000006', 7),
  ('s0000006-0000-0000-0000-000000000008', 'pets',                 'c0000001-0000-0000-0000-000000000006', 8),
  ('s0000006-0000-0000-0000-000000000009', 'relationships',        'c0000001-0000-0000-0000-000000000006', 9),
  ('s0000006-0000-0000-0000-000000000010', 'parenting',            'c0000001-0000-0000-0000-000000000006', 10),
  ('s0000006-0000-0000-0000-000000000011', 'fashion',              'c0000001-0000-0000-0000-000000000006', 11),
  ('s0000006-0000-0000-0000-000000000012', 'beauty',               'c0000001-0000-0000-0000-000000000006', 12);

INSERT INTO subcategory_translations (subcategory_id, language_code, name, description, meta_title, meta_description) VALUES
  ('s0000006-0000-0000-0000-000000000001', 'en', 'Home Improvement',    'Renovations, repairs, plumbing, electrical and home upgrades.',         'Home Improvement Guides',    'DIY home renovation, repair and upgrade guides for every skill level.'),
  ('s0000006-0000-0000-0000-000000000002', 'en', 'Interior Design',     'Room layouts, colour schemes, furniture and decoration ideas.',          'Interior Design Guides',     'Transform your space with guides on layouts, colour schemes and decoration.'),
  ('s0000006-0000-0000-0000-000000000003', 'en', 'Home Organization',   'Decluttering, storage solutions, closet systems and minimalism.',       'Home Organization Guides',   'Organise your home with guides on decluttering, storage and minimalist living.'),
  ('s0000006-0000-0000-0000-000000000004', 'en', 'Gardening',           'Plant care, landscaping, vegetable gardens and indoor plants.',          'Gardening Guides',           'Grow your garden with guides on plant care, landscaping and vegetable gardening.'),
  ('s0000006-0000-0000-0000-000000000005', 'en', 'Cooking',             'Recipes, meal prep, cooking techniques and kitchen tips.',               'Cooking Guides',             'Master cooking with recipes, meal prep strategies and kitchen techniques.'),
  ('s0000006-0000-0000-0000-000000000006', 'en', 'Cleaning',            'Cleaning routines, products, deep cleaning and stain removal.',          'Cleaning Guides',            'Keep your home spotless with guides on routines, products and stain removal.'),
  ('s0000006-0000-0000-0000-000000000007', 'en', 'DIY Projects',        'Crafts, woodworking, home hacks and creative projects.',                'DIY Project Guides',         'Get inspired with DIY crafts, woodworking and creative home project guides.'),
  ('s0000006-0000-0000-0000-000000000008', 'en', 'Pets',                'Dog care, cat care, pet health, training and pet products.',             'Pet Care Guides',            'Care for your pets with guides on health, training, nutrition and pet products.'),
  ('s0000006-0000-0000-0000-000000000009', 'en', 'Relationships',       'Communication, dating, marriage, conflict resolution and boundaries.',  'Relationship Guides',        'Build better relationships with guides on communication, dating and conflict resolution.'),
  ('s0000006-0000-0000-0000-000000000010', 'en', 'Parenting',           'Child development, discipline, education and family activities.',        'Parenting Guides',           'Navigate parenting with guides on child development, discipline and family life.'),
  ('s0000006-0000-0000-0000-000000000011', 'en', 'Fashion',             'Style tips, wardrobe essentials, trends and personal styling.',          'Fashion Guides',             'Elevate your style with guides on wardrobe essentials, trends and personal styling.'),
  ('s0000006-0000-0000-0000-000000000012', 'en', 'Beauty',              'Skincare, haircare, makeup, beauty routines and product reviews.',       'Beauty Guides',              'Master skincare, haircare and makeup with expert beauty guides and reviews.');

-- ═══════════════════════════════════════════════════════════════════
-- 8. Subcategories — Travel (11)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO subcategories (id, slug, category_id, sort_order) VALUES
  ('s0000007-0000-0000-0000-000000000001', 'destinations',         'c0000001-0000-0000-0000-000000000007', 1),
  ('s0000007-0000-0000-0000-000000000002', 'travel-planning',      'c0000001-0000-0000-0000-000000000007', 2),
  ('s0000007-0000-0000-0000-000000000003', 'hotels',               'c0000001-0000-0000-0000-000000000007', 3),
  ('s0000007-0000-0000-0000-000000000004', 'flights',              'c0000001-0000-0000-0000-000000000007', 4),
  ('s0000007-0000-0000-0000-000000000005', 'transportation',       'c0000001-0000-0000-0000-000000000007', 5),
  ('s0000007-0000-0000-0000-000000000006', 'budget-travel',        'c0000001-0000-0000-0000-000000000007', 6),
  ('s0000007-0000-0000-0000-000000000007', 'luxury-travel',        'c0000001-0000-0000-0000-000000000007', 7),
  ('s0000007-0000-0000-0000-000000000008', 'visa-immigration',     'c0000001-0000-0000-0000-000000000007', 8),
  ('s0000007-0000-0000-0000-000000000009', 'travel-safety',        'c0000001-0000-0000-0000-000000000007', 9),
  ('s0000007-0000-0000-0000-000000000010', 'adventure-travel',     'c0000001-0000-0000-0000-000000000007', 10),
  ('s0000007-0000-0000-0000-000000000011', 'food-culture',         'c0000001-0000-0000-0000-000000000007', 11);

INSERT INTO subcategory_translations (subcategory_id, language_code, name, description, meta_title, meta_description) VALUES
  ('s0000007-0000-0000-0000-000000000001', 'en', 'Destinations',       'City guides, country overviews, best places and travel itineraries.',   'Travel Destination Guides',   'Discover the best travel destinations with city guides, itineraries and insider tips.'),
  ('s0000007-0000-0000-0000-000000000002', 'en', 'Travel Planning',    'Trip planning, packing lists, travel apps and booking strategies.',     'Travel Planning Guides',      'Plan your perfect trip with guides on booking, packing and travel apps.'),
  ('s0000007-0000-0000-0000-000000000003', 'en', 'Hotels',             'Hotel reviews, booking tips, loyalty programmes and accommodation.',    'Hotel Guides',                'Find the best hotels with reviews, booking tips and loyalty programme guides.'),
  ('s0000007-0000-0000-0000-000000000004', 'en', 'Flights',            'Cheap flights, airline reviews, airport tips and flight booking.',      'Flight Guides',               'Find cheap flights and navigate airports with airline reviews and booking tips.'),
  ('s0000007-0000-0000-0000-000000000005', 'en', 'Transportation',     'Trains, buses, car rentals, ride-sharing and local transport.',         'Transportation Guides',       'Navigate local transport with guides on trains, buses, car rentals and ride-sharing.'),
  ('s0000007-0000-0000-0000-000000000006', 'en', 'Budget Travel',      'Backpacking, hostels, free activities and money-saving tips.',          'Budget Travel Guides',        'Travel on a budget with guides on backpacking, hostels and money-saving tips.'),
  ('s0000007-0000-0000-0000-000000000007', 'en', 'Luxury Travel',      'Five-star hotels, first class, exclusive experiences and resorts.',     'Luxury Travel Guides',        'Experience luxury travel with guides on five-star hotels, first class and exclusive resorts.'),
  ('s0000007-0000-0000-0000-000000000008', 'en', 'Visa & Immigration', 'Visa applications, passport renewal, immigration rules and documents.','Visa & Immigration Guides',   'Navigate visa applications, passport renewal and immigration requirements.'),
  ('s0000007-0000-0000-0000-000000000009', 'en', 'Travel Safety',      'Travel insurance, health precautions, scam awareness and emergency.',  'Travel Safety Guides',        'Stay safe while travelling with guides on insurance, health and scam awareness.'),
  ('s0000007-0000-0000-0000-000000000010', 'en', 'Adventure Travel',   'Hiking, diving, safaris, extreme sports and outdoor adventures.',      'Adventure Travel Guides',     'Find your next adventure with guides on hiking, diving, safaris and extreme sports.'),
  ('s0000007-0000-0000-0000-000000000011', 'en', 'Food & Culture',     'Local cuisine, food tours, cultural experiences and festivals.',       'Food & Culture Travel Guides','Experience local cuisine, food tours, cultural traditions and festivals.');
