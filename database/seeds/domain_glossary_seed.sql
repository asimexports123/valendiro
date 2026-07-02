-- Domain Glossary Seed Data
-- Used by Knowledge Assembler Step 1: Normalize
-- Maintained as data — not hardcoded in application code

INSERT INTO domain_glossary (abbreviation, canonical_form, domain) VALUES
-- Programming Languages
('JS', 'JavaScript', 'Web Development'),
('TS', 'TypeScript', 'Web Development'),
('Py', 'Python', 'Software Development'),
('Rb', 'Ruby', 'Software Development'),
('C#', 'C Sharp', 'Software Development'),
('VB', 'Visual Basic', 'Software Development'),

-- Paradigms & Concepts
('OOP', 'Object-Oriented Programming', 'Software Development'),
('FP', 'Functional Programming', 'Software Development'),
('TDD', 'Test-Driven Development', 'Software Engineering'),
('BDD', 'Behavior-Driven Development', 'Software Engineering'),
('DDD', 'Domain-Driven Design', 'Software Architecture'),
('SOLID', 'SOLID Principles', 'Software Design'),
('DRY', 'Don''t Repeat Yourself', 'Software Design'),
('KISS', 'Keep It Simple Stupid', 'Software Design'),
('YAGNI', 'You Aren''t Gonna Need It', 'Software Design'),

-- Infrastructure & DevOps
('k8s', 'Kubernetes', 'DevOps'),
('CI', 'Continuous Integration', 'DevOps'),
('CD', 'Continuous Deployment', 'DevOps'),
('CI/CD', 'Continuous Integration and Continuous Deployment', 'DevOps'),
('VM', 'Virtual Machine', 'Infrastructure'),
('VPS', 'Virtual Private Server', 'Infrastructure'),
('AWS', 'Amazon Web Services', 'Cloud Computing'),
('GCP', 'Google Cloud Platform', 'Cloud Computing'),
('IaC', 'Infrastructure as Code', 'DevOps'),

-- AI & Machine Learning
('ML', 'Machine Learning', 'Artificial Intelligence'),
('AI', 'Artificial Intelligence', 'Technology'),
('DL', 'Deep Learning', 'Artificial Intelligence'),
('NLP', 'Natural Language Processing', 'Artificial Intelligence'),
('LLM', 'Large Language Model', 'Artificial Intelligence'),
('NN', 'Neural Network', 'Artificial Intelligence'),
('CNN', 'Convolutional Neural Network', 'Artificial Intelligence'),
('RNN', 'Recurrent Neural Network', 'Artificial Intelligence'),
('GAN', 'Generative Adversarial Network', 'Artificial Intelligence'),
('RL', 'Reinforcement Learning', 'Artificial Intelligence'),

-- Web Development
('API', 'Application Programming Interface', 'Software Development'),
('REST', 'Representational State Transfer', 'Web Development'),
('HTTP', 'Hypertext Transfer Protocol', 'Web Development'),
('HTTPS', 'Hypertext Transfer Protocol Secure', 'Web Development'),
('HTML', 'HyperText Markup Language', 'Web Development'),
('CSS', 'Cascading Style Sheets', 'Web Development'),
('DOM', 'Document Object Model', 'Web Development'),
('SPA', 'Single Page Application', 'Web Development'),
('SSR', 'Server-Side Rendering', 'Web Development'),
('SSG', 'Static Site Generation', 'Web Development'),
('PWA', 'Progressive Web App', 'Web Development'),

-- Databases
('SQL', 'Structured Query Language', 'Databases'),
('NoSQL', 'Non-Relational Database', 'Databases'),
('DB', 'Database', 'Databases'),
('RDBMS', 'Relational Database Management System', 'Databases'),
('ORM', 'Object-Relational Mapping', 'Databases'),
('ACID', 'Atomicity Consistency Isolation Durability', 'Databases'),

-- Security
('SSL', 'Secure Sockets Layer', 'Security'),
('TLS', 'Transport Layer Security', 'Security'),
('JWT', 'JSON Web Token', 'Security'),
('OAuth', 'Open Authorization', 'Security'),
('CORS', 'Cross-Origin Resource Sharing', 'Security'),
('XSS', 'Cross-Site Scripting', 'Security'),
('CSRF', 'Cross-Site Request Forgery', 'Security'),
('MFA', 'Multi-Factor Authentication', 'Security'),
('2FA', 'Two-Factor Authentication', 'Security'),

-- Finance
('ROI', 'Return on Investment', 'Finance'),
('APR', 'Annual Percentage Rate', 'Finance'),
('APY', 'Annual Percentage Yield', 'Finance'),
('ETF', 'Exchange-Traded Fund', 'Finance'),
('IPO', 'Initial Public Offering', 'Finance'),
('P/E', 'Price-to-Earnings Ratio', 'Finance'),
('FICO', 'Fair Isaac Corporation Score', 'Personal Finance'),

-- General
('SEO', 'Search Engine Optimization', 'Digital Marketing'),
('SEM', 'Search Engine Marketing', 'Digital Marketing'),
('CMS', 'Content Management System', 'Web Development'),
('UI', 'User Interface', 'Design'),
('UX', 'User Experience', 'Design'),
('MVP', 'Minimum Viable Product', 'Product Development'),
('KPI', 'Key Performance Indicator', 'Business'),
('SaaS', 'Software as a Service', 'Business'),
('B2B', 'Business to Business', 'Business'),
('B2C', 'Business to Consumer', 'Business')
ON CONFLICT (abbreviation) DO NOTHING;
