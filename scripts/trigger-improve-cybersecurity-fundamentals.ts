import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveCybersecurityFundamentals() {
  console.log("Improving Cybersecurity Fundamentals knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks, damage, or unauthorized access.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "security", "protection"],
      },
      {
        statement: "The CIA triad — confidentiality, integrity, and availability — is the foundational model for information security.",
        fact_type: "property",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "cia-triad", "principles"],
      },
      {
        statement: "A threat is any potential danger to information or systems, while a vulnerability is a weakness that can be exploited.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "threats", "vulnerabilities"],
      },
      
      // NIST CSF Framework
      {
        statement: "NIST Cybersecurity Framework provides five functions: Identify, Protect, Detect, Respond, and Recover.",
        fact_type: "property",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "nist-csf", "framework"],
      },
      {
        statement: "Identify function involves understanding cybersecurity risks to systems, people, assets, and data.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "nist-csf", "identify"],
      },
      {
        statement: "Protect function implements safeguards to ensure delivery of critical services.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "nist-csf", "protect"],
      },
      {
        statement: "Detect function identifies the occurrence of a cybersecurity event.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "nist-csf", "detect"],
      },
      {
        statement: "Respond function takes action regarding a detected cybersecurity incident.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "nist-csf", "respond"],
      },
      {
        statement: "Recover function maintains plans for resilience and restores capabilities impaired by a cybersecurity incident.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "nist-csf", "recover"],
      },
      
      // Authentication and Authorization
      {
        statement: "Authentication verifies the identity of users or systems requesting access.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "authentication", "access-control"],
      },
      {
        statement: "Authorization determines what authenticated users are allowed to access or do.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "authorization", "access-control"],
      },
      {
        statement: "Multi-factor authentication requires multiple forms of verification to enhance security.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "mfa", "authentication"],
      },
      {
        statement: "Strong passwords use a combination of uppercase, lowercase, numbers, and special characters.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "passwords", "authentication"],
      },
      
      // Network Security
      {
        statement: "Firewalls monitor and control incoming and outgoing network traffic based on predetermined security rules.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "firewalls", "network-security"],
      },
      {
        statement: "VPNs (Virtual Private Networks) encrypt internet traffic and hide IP addresses for secure communication.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "vpn", "network-security"],
      },
      {
        statement: "Network segmentation divides networks into smaller segments to limit attack spread.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "network-segmentation", "security"],
      },
      
      // Data Protection
      {
        statement: "Encryption transforms data into an unreadable format that can only be deciphered with the correct key.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "encryption", "data-protection"],
      },
      {
        statement: "Data at rest encryption protects stored data on devices and databases.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "encryption", "data-protection"],
      },
      {
        statement: "Data in transit encryption protects data moving across networks.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "encryption", "data-protection"],
      },
      {
        statement: "Backups create copies of data that can be restored in case of data loss or corruption.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "backups", "data-protection"],
      },
      
      // Common Attacks
      {
        statement: "Social engineering manipulates people into revealing confidential information or performing security-compromising actions.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "social-engineering", "attacks"],
      },
      {
        statement: "Phishing uses fraudulent emails or messages to steal credentials or install malware.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "phishing", "attacks"],
      },
      {
        statement: "Malware is software designed to disrupt, damage, or gain unauthorized access to computer systems.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "malware", "attacks"],
      },
      {
        statement: "Ransomware encrypts data and demands payment for decryption keys.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "ransomware", "malware"],
      },
      {
        statement: "DDoS attacks overwhelm systems with traffic to make them unavailable.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "ddos", "attacks"],
      },
      
      // Incident Response
      {
        statement: "Incident response is the organized approach to addressing and managing security incidents.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "incident-response", "security"],
      },
      {
        statement: "Incident response plans should include preparation, detection, containment, eradication, and recovery steps.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "incident-response", "planning"],
      },
      
      // Security Awareness
      {
        statement: "Security awareness training educates employees about cybersecurity threats and best practices.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "training", "awareness"],
      },
      {
        statement: "Regular security training helps prevent human error-related security breaches.",
        fact_type: "property",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "training", "awareness"],
      },
      
      // Patch Management
      {
        statement: "Patch management applies software updates to fix vulnerabilities before attackers can exploit them.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "patching", "vulnerability-management"],
      },
      {
        statement: "Regular updates for operating systems and applications are essential for maintaining security.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "updates", "patching"],
      },
      
      // Zero Trust
      {
        statement: "Zero trust security assumes no user or device is trustworthy by default, requiring continuous verification.",
        fact_type: "definition",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "zero-trust", "architecture"],
      },
      {
        statement: "Zero trust principles include least privilege access, microsegmentation, and continuous monitoring.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "zero-trust", "principles"],
      },
      
      // Compliance
      {
        statement: "GDPR regulates data protection and privacy for individuals in the European Union.",
        fact_type: "property",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "gdpr", "compliance"],
      },
      {
        statement: "HIPAA protects sensitive health information in the United States.",
        fact_type: "property",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "hipaa", "compliance"],
      },
      {
        statement: "PCI DSS sets security standards for organizations that handle credit card information.",
        fact_type: "property",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "pci-dss", "compliance"],
      },
      
      // Security Best Practices
      {
        statement: "Principle of least privilege grants users only the minimum access necessary to perform their jobs.",
        fact_type: "rule",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "least-privilege", "access-control"],
      },
      {
        statement: "Defense in depth uses multiple layers of security controls to protect against threats.",
        fact_type: "rule",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "universal",
        tags: ["cybersecurity", "defense-in-depth", "strategy"],
      },
      {
        statement: "Regular security assessments and penetration testing identify vulnerabilities before attackers do.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Cybersecurity",
        scope: "contextual",
        tags: ["cybersecurity", "testing", "assessments"],
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
        topic_id: "cef45ee3-6563-4a8f-90af-6907ec10ecb8",
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

improveCybersecurityFundamentals();
