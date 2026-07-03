/**
 * Enhance Cybersecurity Fundamentals Knowledge Package
 * Add missing educational components
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Enhancing Cybersecurity Fundamentals Knowledge Package");
  console.log("===================================================\n");

  // Get topic
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", "cybersecurity-fundamentals")
    .single();

  if (!topic) {
    console.log("❌ Topic not found");
    return;
  }

  // Get knowledge package
  const { data: pkg } = await supabase
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topic.id)
    .single();

  if (!pkg) {
    console.log("❌ No knowledge package");
    return;
  }

  // New facts to add
  const newFacts = [
    // Procedures (How to protect yourself)
    {
      fact_type: "procedural",
      statement: "Enable multi-factor authentication on all accounts to add an extra layer of security beyond passwords.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "procedural",
      statement: "Regularly update software and operating systems to patch security vulnerabilities that attackers exploit.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "procedural",
      statement: "Use a password manager to generate and store unique, complex passwords for each account.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    // Warnings (What happens if ignored)
    {
      fact_type: "warning",
      statement: "Reusing passwords across multiple accounts dramatically increases risk—if one account is breached, all accounts become vulnerable.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "warning",
      statement: "Clicking on unknown links or downloading attachments from suspicious emails is the primary way malware infects systems.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "warning",
      statement: "Public Wi-Fi networks without encryption can expose your data to attackers monitoring the network traffic.",
      confidence: "medium",
      domain: "cybersecurity",
      scope: "contextual"
    },
    // Causal (Why it works this way)
    {
      fact_type: "causal",
      statement: "Multi-factor authentication works because even if a password is stolen, the attacker still needs the second factor like a phone or token.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "causal",
      statement: "Software updates are critical because they fix known security vulnerabilities that attackers actively scan for and exploit.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    // Comparisons
    {
      fact_type: "comparison",
      statement: "Encryption differs from hashing in that encryption can be reversed with a key, while hashing is a one-way transformation.",
      confidence: "medium",
      domain: "cybersecurity",
      scope: "contextual"
    },
    {
      fact_type: "comparison",
      statement: "Antivirus software focuses on detecting and removing malware, while firewalls control network traffic to prevent unauthorized access.",
      confidence: "medium",
      domain: "cybersecurity",
      scope: "contextual"
    },
    // Measurements
    {
      fact_type: "measurement",
      statement: "A strong password should be at least 12 characters long and include a mix of uppercase, lowercase, numbers, and symbols.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "measurement",
      statement: "Multi-factor authentication can block 99.9% of automated account compromise attacks according to Microsoft studies.",
      confidence: "medium",
      domain: "cybersecurity",
      scope: "contextual"
    },
    // Domain-specific concepts (CIA Triad components)
    {
      fact_type: "definition",
      statement: "Confidentiality ensures that information is only accessible to authorized individuals and prevents unauthorized disclosure.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "definition",
      statement: "Integrity maintains the accuracy and completeness of data, preventing unauthorized modifications or deletions.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
    {
      fact_type: "definition",
      statement: "Availability ensures that systems and data are accessible when needed by authorized users.",
      confidence: "verified",
      domain: "cybersecurity",
      scope: "universal"
    },
  ];

  console.log(`Adding ${newFacts.length} new facts...`);

  for (const fact of newFacts) {
    const { error } = await supabase
      .from("knowledge_facts")
      .insert({
        package_id: pkg.id,
        fact_type: fact.fact_type,
        statement: fact.statement,
        confidence: fact.confidence,
        domain: fact.domain,
        scope: fact.scope
      });

    if (error) {
      console.log(`❌ Error adding fact: ${error.message}`);
    } else {
      console.log(`✅ Added ${fact.fact_type}: ${fact.statement.substring(0, 50)}...`);
    }
  }

  console.log("\nEnhancement complete for Cybersecurity Fundamentals");
}

main().catch(console.error);
