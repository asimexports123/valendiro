import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveCloudComputingFundamentals() {
  console.log("Improving Cloud Computing Fundamentals knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "Cloud computing delivers computing services including servers, storage, databases, and software over the internet on a pay-as-you-go basis.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "infrastructure", "services"],
      },
      {
        statement: "Cloud computing eliminates the need for organizations to manage physical infrastructure and only pay for what they use.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "infrastructure", "cost"],
      },
      
      // Service Models
      {
        statement: "IaaS (Infrastructure as a Service) provides virtualized computing resources such as virtual machines and storage over the internet.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "iaas", "infrastructure"],
      },
      {
        statement: "PaaS (Platform as a Service) provides a managed environment for developers to build and deploy applications without managing servers.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "paas", "platform"],
      },
      {
        statement: "SaaS (Software as a Service) delivers fully managed applications over the internet accessible via a web browser.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "saas", "software"],
      },
      
      // Deployment Models
      {
        statement: "Public cloud provides cloud resources shared by multiple organizations and owned by third-party cloud providers.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "public-cloud", "deployment"],
      },
      {
        statement: "Private cloud provides cloud resources dedicated exclusively to a single organization.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "private-cloud", "deployment"],
      },
      {
        statement: "Hybrid cloud combines public and private cloud resources allowing data and applications to move between them.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["cloud-computing", "hybrid-cloud", "deployment"],
      },
      
      // Cloud Providers
      {
        statement: "Amazon Web Services (AWS) is the leading cloud provider offering over 200 services globally.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "aws", "providers"],
      },
      {
        statement: "Microsoft Azure provides cloud services integrated with Microsoft products and enterprise solutions.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "azure", "providers"],
      },
      {
        statement: "Google Cloud Platform (GCP) offers cloud services built on Google's infrastructure and data analytics capabilities.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "gcp", "providers"],
      },
      
      // Cloud Services
      {
        statement: "Cloud compute services provide on-demand virtual machines and container orchestration for running applications.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "compute", "services"],
      },
      {
        statement: "Cloud storage services provide scalable object storage, block storage, and file storage for data persistence.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "storage", "services"],
      },
      {
        statement: "Cloud database services provide managed relational and NoSQL databases with automated backups and scaling.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "databases", "services"],
      },
      {
        statement: "Cloud networking services provide virtual networks, load balancers, and content delivery networks.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "networking", "services"],
      },
      
      // Benefits
      {
        statement: "Cloud computing reduces capital expenses by eliminating the need for upfront hardware investments.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "benefits", "cost"],
      },
      {
        statement: "Cloud computing provides on-demand scalability to handle traffic spikes and growth.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "benefits", "scalability"],
      },
      {
        statement: "Cloud computing enables global deployment by providing data centers in multiple geographic regions.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "benefits", "global"],
      },
      {
        statement: "Cloud computing accelerates innovation by providing rapid access to new technologies and services.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "benefits", "innovation"],
      },
      
      // Shared Responsibility Model
      {
        statement: "The shared responsibility model defines security responsibilities between cloud providers and customers.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "security", "shared-responsibility"],
      },
      {
        statement: "Cloud providers are responsible for security of the cloud including physical infrastructure and network controls.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "security", "shared-responsibility"],
      },
      {
        statement: "Customers are responsible for security in the cloud including data encryption, access controls, and application security.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "security", "shared-responsibility"],
      },
      
      // Serverless Computing
      {
        statement: "Serverless computing allows developers to run code without managing servers, paying only for execution time.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "serverless", "computing"],
      },
      {
        statement: "Serverless functions automatically scale based on demand and have no idle costs when not running.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "serverless", "scaling"],
      },
      
      // Cloud Security
      {
        statement: "Identity and access management (IAM) controls who can access cloud resources and what actions they can perform.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "security", "iam"],
      },
      {
        statement: "Encryption protects data at rest in cloud storage and in transit between services.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "security", "encryption"],
      },
      {
        statement: "Cloud providers offer compliance certifications for various industry standards and regulations.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "security", "compliance"],
      },
      
      // Cost Management
      {
        statement: "Cloud cost management tools help monitor, analyze, and optimize cloud spending.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "cost", "management"],
      },
      {
        statement: "Reserved instances provide significant discounts for committing to use cloud resources for one or three years.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "cost", "pricing"],
      },
      {
        statement: "Auto-scaling automatically adjusts resource allocation based on demand to optimize costs.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "cost", "scaling"],
      },
      
      // Migration Strategies
      {
        statement: "Lift and shift migration moves applications to the cloud without significant modifications.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "migration", "strategy"],
      },
      {
        statement: "Replatforming makes minor optimizations to applications during cloud migration.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "migration", "strategy"],
      },
      {
        statement: "Refactoring rewrites applications to take full advantage of cloud-native capabilities.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "migration", "strategy"],
      },
      
      // Common Use Cases
      {
        statement: "Web hosting in the cloud provides scalable infrastructure for websites and web applications.",
        fact_type: "application",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "use-cases", "hosting"],
      },
      {
        statement: "Data analytics in the cloud provides tools for processing and analyzing large datasets.",
        fact_type: "application",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "use-cases", "analytics"],
      },
      {
        statement: "Disaster recovery in the cloud provides backup and recovery solutions for business continuity.",
        fact_type: "application",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["cloud-computing", "use-cases", "disaster-recovery"],
      },
    ],
  };

  try {
    const response = await fetch(`${BASE_URL}/api/admin/improve-knowledge-package`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
        topic_id: "070978fe-6f10-4452-ab65-832a0c850a05",
        improvements,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("=== IMPROVEMENT COMPLETE ===\n");
    console.log(`Facts added: ${data.facts_added}`);
    console.log(`Message: ${data.message}`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

improveCloudComputingFundamentals();
