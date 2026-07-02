# KNOWLEDGE BLUEPRINT REVIEW — PART 2
# Categories: Technology + Business
# Parent document: KNOWLEDGE_BLUEPRINT_REVIEW.md

---

## COVERAGE SCORING GUIDE
- **Beginner (B):** Topic accessible to someone with zero prior knowledge
- **Core (C):** Foundational concept; required before advanced topics
- **Application (A):** Practical use of the core concepts
- **Advanced (Adv):** Requires prior topics; expands depth
- **Best Practice (BP):** Professional-level judgment and nuance

---

## TECHNOLOGY

---

### artificial-intelligence
**Reader Objective:** Understand AI as a field — its methods, capabilities, limits, and ethics.
**Canonical Learning Goal:** A reader who completes this path can explain how AI systems are built, distinguish AI paradigms, understand how LLMs work, and reason about societal implications.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | AI Fundamentals | `artificial-intelligence-fundamentals` | What AI is, narrow vs general AI, key applications, hype vs reality | B | — | machine-learning-basics |
| 2 | Machine Learning Basics | `machine-learning-basics` | Supervised, unsupervised, reinforcement learning with concrete examples | C | artificial-intelligence-fundamentals | neural-networks-and-deep-learning |
| 3 | Neural Networks & Deep Learning | `neural-networks-and-deep-learning` | Layers, weights, backpropagation, why deep learning outperforms classical ML | C | machine-learning-basics | large-language-models |
| 4 | Natural Language Processing | `natural-language-processing` | Tokenization, word embeddings, sequence models, NLP use cases | A | neural-networks-and-deep-learning | large-language-models |
| 5 | Computer Vision | `computer-vision` | CNNs, object detection, image classification, real-world CV applications | A | neural-networks-and-deep-learning | — |
| 6 | Large Language Models | `large-language-models` | Transformer architecture, pre-training, fine-tuning, prompting, capability limits | Adv | natural-language-processing | ai-ethics-and-bias |
| 7 | AI Ethics & Bias | `ai-ethics-and-bias` | Bias sources, fairness metrics, responsible AI development, governance | BP | artificial-intelligence-fundamentals | large-language-models |

**Validation Findings:**
- ✅ Strong logical progression from concept to applications to advanced to ethics
- ✅ Beginner coverage: Topics 1–2 are fully accessible with no prerequisite knowledge
- ✅ Intermediate coverage: Topics 3–5 well covered
- ✅ Advanced coverage: Topics 6–7 are genuine advanced topics
- ⚠️ **Missing practical topic:** `using-ai-apis-and-tools` — how a developer or product person actually uses AI (OpenAI API, prompt engineering, RAG). Without this, the path remains academic.
- **Recommendation:** Add `using-ai-apis-and-tools` at position 6, shift AI Ethics to position 7

**Coverage Score: 87/100**

**Beginner Completeness:** ✅ A complete beginner follows topics 1→2→3→4 and gains solid foundational understanding before branching to NLP or Computer Vision.

---

### cloud-computing
**Reader Objective:** Understand cloud platforms, services, architecture, and security.
**Canonical Learning Goal:** Explain the cloud model, navigate AWS/GCP/Azure, architect basic solutions, manage cost, and secure cloud infrastructure.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Cloud Computing Fundamentals | `cloud-computing-fundamentals` | IaaS/PaaS/SaaS, public/private/hybrid cloud, pay-as-you-go model | B | — | aws-fundamentals |
| 2 | AWS Fundamentals | `aws-fundamentals` | EC2, S3, IAM, VPC, core AWS services, console navigation | C | cloud-computing-fundamentals | cloud-storage-and-databases |
| 3 | Google Cloud Fundamentals | `google-cloud-fundamentals` | GCP compute, Cloud Storage, BigQuery, when to choose GCP | C | cloud-computing-fundamentals | — |
| 4 | Azure Fundamentals | `azure-fundamentals` | Azure VMs, Active Directory, enterprise cloud architecture, AZ-900 scope | C | cloud-computing-fundamentals | — |
| 5 | Cloud Storage & Databases | `cloud-storage-and-databases` | Storage tiers (hot/cold/archive), managed databases (RDS, Cloud SQL), data lakes | A | aws-fundamentals | serverless-computing |
| 6 | Serverless Computing | `serverless-computing` | Lambda/Cloud Functions, event-driven architecture, cold-start trade-offs, cost model | Adv | cloud-storage-and-databases | — |
| 7 | Cloud Security | `cloud-security` | Shared responsibility model, IAM best practices, security groups, compliance frameworks | BP | aws-fundamentals | cybersecurity-fundamentals |

**Validation Findings:**
- ⚠️ **Structural issue:** Three parallel platform topics (AWS, GCP, Azure) at positions 2–4 create a branching path without guidance. A beginner has no basis for choosing.
- **Recommendation:** Add `choosing-a-cloud-platform` between positions 1 and 2 (AWS/GCP/Azure become parallel branches after the platform-selection topic)
- ⚠️ **Missing:** `cloud-cost-management` — cost surprises are the most common operational failure in cloud; essential practical topic
- ✅ Beginner to advanced arc is otherwise complete

**Coverage Score: 82/100**

**Beginner Completeness:** ⚠️ Partial. Beginners need `choosing-a-cloud-platform` before being told to study AWS, GCP, and Azure simultaneously.

---

### cybersecurity
**Reader Objective:** Understand how systems are attacked, how to defend them, and how to build a security career.
**Canonical Learning Goal:** Understand the threat landscape, core defensive technologies, secure development practices, incident response, and professional certification paths.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Cybersecurity Fundamentals | `cybersecurity-fundamentals` | CIA triad, threat actors, attack vectors, the security mindset | B | — | network-security |
| 2 | Network Security | `network-security` | Firewalls, IDS/IPS, VPNs, network segmentation, traffic analysis | C | cybersecurity-fundamentals | cryptography-basics |
| 3 | Cryptography Basics | `cryptography-basics` | Symmetric/asymmetric encryption, hashing, TLS, digital certificates | C | cybersecurity-fundamentals | web-application-security |
| 4 | Web Application Security | `web-application-security` | OWASP Top 10, injection attacks, XSS, CSRF, secure coding practices | A | cryptography-basics | identity-and-access-management |
| 5 | Identity & Access Management | `identity-and-access-management` | Authentication vs authorization, MFA, SSO, OAuth 2.0, zero-trust | A | cybersecurity-fundamentals | incident-response |
| 6 | Incident Response | `incident-response` | IR lifecycle: preparation, detection, containment, eradication, recovery, lessons learned | Adv | network-security | security-certifications |
| 7 | Security Certifications | `security-certifications` | CompTIA Security+, CISSP, CEH, AWS Security — which fits which career stage | BP | — | cybersecurity-fundamentals |

**Validation Findings:**
- ✅ Strong and well-structured progression
- ⚠️ **Missing:** `threat-modeling` — the foundational skill of systematically identifying attack surfaces; sits between fundamentals and specific attack categories
- ✅ Beginner to advanced fully covered
- ✅ Career path (certifications) at end is correct placement

**Coverage Score: 85/100**

**Beginner Completeness:** ✅ Topics 1→2→3 give a complete beginner solid grounding.

---

### devops
**Reader Objective:** Understand DevOps philosophy, CI/CD, infrastructure automation, container orchestration, and reliability engineering.
**Canonical Learning Goal:** Design CI/CD pipelines, manage infrastructure as code, orchestrate containers with Kubernetes, and apply SRE principles.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | DevOps Fundamentals | `devops-fundamentals` | DevOps culture, SDLC, breaking down Dev/Ops silos, key practices | B | — | ci-cd-pipelines |
| 2 | CI/CD Pipelines | `ci-cd-pipelines` | Build/test/deploy stages, GitHub Actions/Jenkins/CircleCI, pipeline design | C | devops-fundamentals | containerization-with-docker |
| 3 | **[ADD — C6]** Containerization with Docker | `containerization-with-docker` | Docker images, containers, Dockerfile, Docker Compose, container registries | C | ci-cd-pipelines | kubernetes-fundamentals |
| 4 | Infrastructure as Code | `infrastructure-as-code` | Declarative infrastructure, Terraform HCL, state management, modules | C | ci-cd-pipelines | kubernetes-fundamentals |
| 5 | Kubernetes Fundamentals | `kubernetes-fundamentals` | Pods, services, deployments, namespaces, the control plane, kubectl | A | containerization-with-docker | monitoring-and-observability |
| 6 | Monitoring & Observability | `monitoring-and-observability` | The three pillars (metrics, logs, traces), Prometheus, Grafana, alerting strategy | BP | kubernetes-fundamentals | site-reliability-engineering |
| 7 | Site Reliability Engineering | `site-reliability-engineering` | SLIs, SLOs, error budgets, toil elimination, the SRE book principles | Adv | monitoring-and-observability | — |

**Validation Findings:**
- ✅ One of the strongest paths in the blueprint
- ⛔ **Critical C6 applied:** `containerization-with-docker` added at position 3 — required before Kubernetes
- ✅ Full beginner to advanced arc with 7 topics justified by the breadth of DevOps

**Coverage Score: 92/100**

**Beginner Completeness:** ✅ With Docker added, the path is fully accessible and sequenced correctly.

---

### hardware-iot
**Reader Objective:** Understand physical computing — from hardware components to IoT systems that sense and act in the world.
**Canonical Learning Goal:** Understand how computers are built from components, how IoT devices are architected, and how sensors and actuators function.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Computer Hardware Fundamentals | `computer-hardware-fundamentals` | CPU, RAM, storage hierarchy, motherboard, GPU, how components communicate | B | — | iot-fundamentals |
| 2 | IoT Fundamentals | `iot-fundamentals` | IoT architecture, edge vs cloud processing, MQTT/CoAP protocols, use cases | C | computer-hardware-fundamentals | embedded-systems |
| 3 | Embedded Systems | `embedded-systems` | Microcontrollers vs microprocessors, real-time OS constraints, firmware basics | C | iot-fundamentals | sensors-and-actuators |
| 4 | Networking Hardware | `networking-hardware` | Routers, switches, NICs, cabling, network topology, physical layer infrastructure | C | computer-hardware-fundamentals | networking-fundamentals |
| 5 | Sensors & Actuators | `sensors-and-actuators` | How sensors transduce physical phenomena, actuator types, signal conditioning | A | embedded-systems | iot-fundamentals |

**Validation Findings:**
- ✅ Compact but coherent for its audience
- ⚠️ **Missing:** `iot-security` — IoT devices are the most-compromised category of connected devices; security is non-optional
- ⚠️ **Missing:** IoT platforms and connectivity (AWS IoT, Azure IoT Hub, Home Assistant) — bridges theory to practice

**Coverage Score: 78/100**

**Beginner Completeness:** ✅ Topic 1 is complete and accessible for beginners.

---

### mobile-development
**Reader Objective:** Understand mobile app development across native and cross-platform approaches.
**Canonical Learning Goal:** Choose the right mobile development approach, understand the major platforms (iOS, Android), build cross-platform with React Native or Flutter, and optimize app performance.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Mobile Development Fundamentals | `mobile-development-fundamentals` | Native vs cross-platform trade-offs, app lifecycle, mobile UX principles | B | — | ios-development |
| 2a | iOS Development | `ios-development` | Swift basics, UIKit vs SwiftUI, Xcode toolchain, App Store submission | C — Native Path | mobile-development-fundamentals | android-development |
| 2b | Android Development | `android-development` | Kotlin basics, Jetpack Compose, Android Studio, Google Play submission | C — Native Path | mobile-development-fundamentals | react-native |
| 3a | React Native | `react-native` | React Native architecture, JS bridge, component system, cross-platform trade-offs | C — Cross-Platform | mobile-development-fundamentals | flutter |
| 3b | Flutter | `flutter` | Dart basics, Flutter widget tree, how Flutter achieves cross-platform parity | C — Cross-Platform | mobile-development-fundamentals | react-native |
| 4 | Mobile App Performance | `mobile-app-performance` | Rendering optimization, memory management, battery, network efficiency | BP | ios-development | — |

**Note on Path Structure:** This subcategory has a deliberate Y-fork after topic 1. The learning path UI should present two streams: Native (iOS + Android) and Cross-Platform (React Native + Flutter). Both streams converge at Performance (topic 4).

**Validation Findings:**
- ✅ Good coverage of all major platforms
- ⚠️ Fork structure must be documented in the learning path UI — presented as a linear sequence it would be confusing
- ⚠️ **Missing:** Mobile app security (auth, secure storage, certificate pinning)
- ⚠️ **Missing:** App store optimization and deployment (practical end-point)

**Coverage Score: 80/100**

**Beginner Completeness:** ✅ Topic 1 clearly frames the choice before the path branches.

---

### networking
**Reader Objective:** Understand how networks are built, how data moves, and how protocols enable internet communication.
**Canonical Learning Goal:** Understand the OSI model, TCP/IP, DNS, HTTP, common protocols, and network architecture patterns.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Networking Fundamentals | `networking-fundamentals` | OSI 7 layers, TCP/IP stack, packets, routing, NAT, how the internet works | B | — | dns-and-http |
| 2 | DNS & HTTP | `dns-and-http` | Domain resolution, DNS records, HTTP methods, headers, status codes, HTTPS/TLS | C | networking-fundamentals | network-protocols |
| 3 | Network Protocols | `network-protocols` | TCP vs UDP, ICMP, DHCP, ARP, common application-layer protocols | C | networking-fundamentals | network-architecture |
| 4 | Wireless Networking | `wireless-networking` | Wi-Fi 802.11 standards (a/b/g/n/ac/ax), cellular (4G/5G), Bluetooth, interference | A | networking-fundamentals | — |
| 5 | Network Architecture | `network-architecture` | VLANs, subnetting (CIDR), DMZ design, WAN vs LAN, software-defined networking | Adv | network-protocols | — |

**Validation Findings:**
- ✅ Clean and logical — every topic builds directly on the previous
- ⚠️ **Missing:** `network-troubleshooting` — ping, traceroute, Wireshark, nslookup, common failure modes; this is the practical applied topic the path needs

**Coverage Score: 82/100**

**Beginner Completeness:** ✅ Topic 1 is appropriately scoped for beginners.

---

## BUSINESS

---

### business-strategy
**Reader Objective:** Analyze competitive landscapes, design business models, and execute strategy.
**Canonical Learning Goal:** Apply strategic frameworks to real situations, design a business model, and build a plan that connects vision to execution.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Business Strategy Fundamentals | `business-strategy-fundamentals` | What strategy is, competitive advantage, Porter's Generic Strategies, value chain | B | — | competitive-analysis |
| 2 | Competitive Analysis | `competitive-analysis` | SWOT analysis, Porter's Five Forces, competitive positioning, industry maps | C | business-strategy-fundamentals | business-model-design |
| 3 | Business Model Design | `business-model-design` | Business Model Canvas, revenue streams, value propositions, unit economics | A | business-strategy-fundamentals | growth-strategy |
| 4 | Growth Strategy | `growth-strategy` | Ansoff Matrix, organic vs inorganic growth, partnerships, international expansion | Adv | business-model-design | strategic-planning |
| 5 | Strategic Planning | `strategic-planning` | OKR framework, strategic roadmaps, cascading goals, team alignment | BP | growth-strategy | — |

**Validation Findings:**
- ✅ Textbook-quality sequence — directly mirrors MBA strategy curriculum
- ✅ Full beginner to advanced arc
- ⚠️ **Missing:** Strategy execution — the most common point of strategy failure; the gap between having a plan and following through

**Coverage Score: 88/100**

**Beginner Completeness:** ✅ Topic 1 is genuinely foundational; anyone with no strategy background can start here.

---

### customer-service
**Reader Objective:** Design, deliver, and continuously improve customer service systems.
**Canonical Learning Goal:** Design multi-channel support, handle difficult situations effectively, build retention programs, and understand the CS function.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Customer Service Fundamentals | `customer-service-fundamentals` | Service principles, empathy map, customer journey, what excellent service looks like | B | — | customer-support-channels |
| 2 | Customer Support Channels | `customer-support-channels` | Evaluate and design support channels; phone, email, chat, help center, self-service | C | customer-service-fundamentals | service-recovery |
| 3 | Service Recovery | `service-recovery` | Complaint handling frameworks, de-escalation, converting detractors to promoters | A | customer-service-fundamentals | customer-retention |
| 4 | Customer Retention | `customer-retention` | Churn analysis, LTV, loyalty programs, proactive retention playbooks | Adv | service-recovery | customer-success |
| 5 | Customer Success | `customer-success` | CS function, customer health scores, QBRs, value realization, expansion | Adv | customer-retention | — |

**Validation Findings:**
- ✅ Well-structured and practical
- ⚠️ **Missing:** `customer-service-metrics` — CSAT, NPS, CES, FRT; without measurement there is no improvement loop

**Coverage Score: 83/100**

**Beginner Completeness:** ✅ Topics 1→2 give a complete foundation.

---

### e-commerce
**Reader Objective:** Build, operate, and grow an online store.
**Canonical Learning Goal:** Select a platform, optimize product listings, handle payments and fulfillment, acquire customers, and measure store performance.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | E-Commerce Fundamentals | `e-commerce-fundamentals` | Business models (DTC, marketplace, dropship), platform comparison (Shopify, WooCommerce, Amazon) | B | — | product-listings-and-seo |
| 2 | Product Listings & SEO | `product-listings-and-seo` | High-converting product copy, image requirements, marketplace search optimization | C | e-commerce-fundamentals | e-commerce-payments |
| 3 | E-Commerce Payments | `e-commerce-payments` | Payment gateways (Stripe, PayPal), checkout UX, fraud prevention, cart abandonment | C | e-commerce-fundamentals | fulfillment-and-logistics |
| 4 | Fulfillment & Logistics | `fulfillment-and-logistics` | Inventory management, 3PL partners, shipping carriers, returns and reverse logistics | A | e-commerce-fundamentals | e-commerce-analytics |
| 5 | E-Commerce Analytics | `e-commerce-analytics` | CVR, AOV, CAC, LTV, cohort analysis, making data-driven merchandising decisions | BP | fulfillment-and-logistics | — |

**Validation Findings:**
- ✅ Covers the full e-commerce operating model
- ⚠️ **Missing:** `e-commerce-marketing` — organic SEO, paid ads, email marketing; without traffic acquisition the store path is incomplete

**Coverage Score: 82/100**

**Beginner Completeness:** ✅ Topics 1→2 are immediately practical.

---

### human-resources
**Reader Objective:** Understand the HR function across the full employee lifecycle.
**Canonical Learning Goal:** Design a hiring process, build a performance management system, structure compensation, and create a high-performance culture.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | HR Fundamentals | `hr-fundamentals` | Employee lifecycle, HR's strategic vs administrative role, compliance basics | B | — | talent-acquisition |
| 2 | Talent Acquisition | `talent-acquisition` | Job design, sourcing channels, structured interviews, hiring decisions | C | hr-fundamentals | performance-management |
| 3 | Performance Management | `performance-management` | Review cycle design, SMART goals, performance improvement plans, feedback | A | talent-acquisition | compensation-and-benefits |
| 4 | Compensation & Benefits | `compensation-and-benefits` | Salary banding, equity vesting, benefits philosophy, total rewards statement | Adv | hr-fundamentals | workplace-culture |
| 5 | Workplace Culture | `workplace-culture` | Psychological safety, DEI foundations, culture design, culture-performance link | BP | hr-fundamentals | — |

**Validation Findings:**
- ✅ Solid coverage of the HR function
- ⚠️ **Missing:** Employment law basics — termination, discrimination, FMLA, FLSA; a core compliance responsibility of HR

**Coverage Score: 80/100**

**Beginner Completeness:** ✅ Topics 1→2 accessible to anyone managing people.

---

### leadership
**Reader Objective:** Lead people effectively — build teams, make sound decisions, communicate with influence, and drive change.
**Canonical Learning Goal:** Articulate a leadership philosophy, apply situational leadership, communicate with impact, and manage organizational change.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Leadership Fundamentals | `leadership-fundamentals` | Leadership styles (transformational, servant, situational), traits, leader vs manager | B | — | team-leadership |
| 2 | Team Leadership | `team-leadership` | Build a team charter, set norms, motivate, handle underperformance | C | leadership-fundamentals | communication-for-leaders |
| 3 | Decision Making | `decision-making` | Decision frameworks (DACI, RACI), cognitive biases, decisions under uncertainty | C | leadership-fundamentals | communication-for-leaders |
| 4 | Communication for Leaders | `communication-for-leaders` | Communicate vision, give difficult feedback, influence without authority | A | team-leadership | change-management |
| 5 | Change Management | `change-management` | Kotter's 8-step model, ADKAR, resistance patterns, sustaining change | Adv | communication-for-leaders | — |

**Validation Findings:**
- ✅ Closely mirrors executive leadership development curricula
- ⚠️ **Missing:** `emotional-intelligence` — EQ underpins every other leadership topic; its absence is the most significant gap in this path

**Coverage Score: 85/100**

**Beginner Completeness:** ✅ Topics 1→2 give a new manager a strong, immediately applicable start.

---

### management
**Reader Objective:** Plan, organize, execute, and improve teams and projects.
**Canonical Learning Goal:** Manage a team or project using structured methodologies, adapt to agile contexts, and operate effectively in a distributed environment.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Management Fundamentals | `management-fundamentals` | Fayol's four functions: planning, organizing, directing, controlling | B | — | project-planning |
| 2 | Project Planning | `project-planning` | Project scope (WBS), schedule (Gantt/milestones), budget, stakeholder alignment | C | management-fundamentals | agile-management |
| 3 | Agile Management | `agile-management` | Scrum ceremonies, Kanban boards, sprint planning, retrospectives, when agile fits | A | project-planning | operations-management |
| 4 | Operations Management | `operations-management` | **[Narrowed per C1]** A manager's view of team throughput, process KPIs, bottleneck identification, and efficiency improvement — not the operations function itself | A | management-fundamentals | remote-team-management |
| 5 | Remote Team Management | `remote-team-management` | Async-first communication, documentation culture, accountability, distributed trust | BP | management-fundamentals | — |

**Validation Findings:**
- ✅ Well-structured for the practicing manager
- ⛔ **Critical C1 applied:** `operations-management` scope narrowed — must not cover supply chain, procurement, or the ops function

**Coverage Score: 83/100**

**Beginner Completeness:** ✅ Topics 1→2 are immediately practical for new managers.

---

### operations
**Reader Objective:** Design, improve, and automate operational systems.
**Canonical Learning Goal:** Understand supply chain fundamentals, apply lean thinking, implement quality systems, and identify automation opportunities.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Operations Fundamentals | `operations-fundamentals` | What operations is, supply chain overview, process design principles, efficiency metrics | B | — | supply-chain-management |
| 2 | Supply Chain Management | `supply-chain-management` | Sourcing, procurement, logistics networks, inventory models, supply chain risk | C | operations-fundamentals | lean-operations |
| 3 | Lean Operations | `lean-operations` | The 7 wastes (muda), value stream mapping, 5S, Kaizen events | A | operations-fundamentals | quality-management |
| 4 | Quality Management | `quality-management` | ISO 9001 structure, Six Sigma DMAIC, statistical process control, quality culture | Adv | lean-operations | business-process-automation |
| 5 | Business Process Automation | `business-process-automation` | Identifying automation opportunities, RPA tools, workflow automation, build vs buy | BP | quality-management | — |

**Validation Findings:**
- ✅ One of the strongest paths in the blueprint — rigorous and complete
- ✅ Full beginner-to-advanced arc

**Coverage Score: 88/100**

**Beginner Completeness:** ✅ Topics 1→2 are complete for any beginner.

---

### sales
**Reader Objective:** Build and execute a sales motion — from prospecting through close to account expansion.
**Canonical Learning Goal:** Manage a B2B or B2C pipeline, prospect effectively, negotiate, use CRM tools, and grow existing accounts.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Sales Fundamentals | `sales-fundamentals` | Buyer psychology, pipeline stages, consultative selling, the sales mindset | B | — | prospecting-and-outreach |
| 2 | Prospecting & Outreach | `prospecting-and-outreach` | ICP definition, lead lists, cold email frameworks, LinkedIn outreach | C | sales-fundamentals | sales-negotiation |
| 3 | Sales Negotiation | `sales-negotiation` | Anchoring, BATNA, concessions, objection handling, closing techniques | A | prospecting-and-outreach | crm-and-sales-tools |
| 4 | CRM & Sales Tools | `crm-and-sales-tools` | CRM pipeline setup, activity logging, reporting, sales automation, Salesforce/HubSpot | A | sales-fundamentals | account-management |
| 5 | Account Management | `account-management` | Renewal strategies, upsell/cross-sell, executive relationships, protecting revenue | BP | crm-and-sales-tools | — |

**Validation Findings:**
- ✅ Covers the complete sales motion end-to-end
- ⚠️ **Missing:** `sales-metrics-and-forecasting` — quota attainment, win rates, pipeline coverage, forecast accuracy

**Coverage Score: 84/100**

**Beginner Completeness:** ✅ Topics 1→2 give an entry-level SDR everything they need to start.

---

### startups
**Reader Objective:** Navigate the founding journey from idea to validated product to funded, scaling company.
**Canonical Learning Goal:** Validate an idea, find product-market fit, understand fundraising and equity, and systematize growth.

| # | Topic | Slug | Reader Outcome | Level | Parent Topic | Related Topics |
|---|---|---|---|---|---|---|
| 1 | Startup Fundamentals | `startup-fundamentals` | What a startup is, lean startup methodology, idea validation frameworks | B | — | product-market-fit |
| 2 | Product-Market Fit | `product-market-fit` | Defining PMF, measuring it (NPS, retention, Sean Ellis test), knowing when achieved | C | startup-fundamentals | fundraising-and-venture-capital |
| 3 | Fundraising & Venture Capital | `fundraising-and-venture-capital` | Venture ecosystem, fundraising stages, term sheet mechanics, dilution, investor dynamics | Adv | product-market-fit | startup-legal-and-equity |
| 4 | Startup Legal & Equity | `startup-legal-and-equity` | Incorporation, cap tables, vesting schedules, SAFEs vs priced rounds, founder agreements | Adv | startup-fundamentals | scaling-a-startup |
| 5 | Scaling a Startup | `scaling-a-startup` | When to scale, the hiring plan, systematizing operations, preserving culture at scale | BP | fundraising-and-venture-capital | — |

**Validation Findings:**
- ✅ Mirrors a real founding journey with logical sequencing
- ⚠️ **Missing:** `go-to-market-strategy` — how a startup finds its first paying customers and scalable channel

**Coverage Score: 86/100**

**Beginner Completeness:** ✅ Topics 1→2 are strong for a first-time founder with no background.

---

*Continued in BLUEPRINT_REVIEW_PART3.md — Personal Finance + Education*
