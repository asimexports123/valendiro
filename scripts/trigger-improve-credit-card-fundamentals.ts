import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveCreditCardFundamentals() {
  console.log("Improving Credit Card Fundamentals knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "A credit card provides a revolving line of credit that allows purchases up to a set limit with repayment deferred.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["credit-cards", "finance", "credit"],
      },
      {
        statement: "APR (Annual Percentage Rate) is the yearly cost of borrowing expressed as a percentage of the balance.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["credit-cards", "apr", "interest"],
      },
      {
        statement: "The grace period is the time between statement closing date and payment due date during which no interest accrues on purchases.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["credit-cards", "grace-period", "interest"],
      },
      {
        statement: "Paying the full statement balance each month avoids all interest charges and makes credit cards free to use.",
        fact_type: "rule",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["credit-cards", "payments", "interest"],
      },
      
      // Credit Card Types
      {
        statement: "Secured credit cards require a cash deposit as collateral and help build credit for those with limited or poor credit history.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "secured-cards", "credit-building"],
      },
      {
        statement: "Student credit cards are designed for college students with limited income and often have lower credit limits.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "student-cards", "credit-building"],
      },
      {
        statement: "Rewards credit cards offer points, cash back, or miles on purchases but typically require good to excellent credit.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "rewards", "benefits"],
      },
      {
        statement: "Travel credit cards offer travel-specific rewards like airline miles, hotel points, and travel insurance benefits.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "travel", "rewards"],
      },
      
      // Credit Score Impact
      {
        statement: "Payment history accounts for 35% of FICO credit score and is the most important factor.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "credit-score", "payment-history"],
      },
      {
        statement: "Credit utilization is the percentage of available credit in use and significantly affects credit scores.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "credit-utilization", "credit-score"],
      },
      {
        statement: "Keeping credit utilization below 30% helps maintain good credit scores.",
        fact_type: "rule",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "credit-utilization", "credit-score"],
      },
      {
        statement: "Credit card age and account history contribute to 15% of credit score calculation.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "credit-age", "credit-score"],
      },
      
      // Fee Structures
      {
        statement: "Annual fees are charged yearly by some credit cards for premium benefits and rewards.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "fees", "annual-fee"],
      },
      {
        statement: "Late payment fees are charged when minimum payment is not received by the due date.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "fees", "late-payments"],
      },
      {
        statement: "Balance transfer fees are typically 3-5% of the transferred amount for moving debt between cards.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "fees", "balance-transfers"],
      },
      {
        statement: "Foreign transaction fees are charged on purchases made outside the card's home country.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "fees", "foreign-transactions"],
      },
      
      // Payment Strategies
      {
        statement: "Minimum payments are typically 2-3% of the balance and result in long repayment periods with significant interest.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "payments", "interest"],
      },
      {
        statement: "Paying more than the minimum reduces interest paid and shortens repayment time.",
        fact_type: "rule",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "payments", "interest"],
      },
      {
        statement: "Automatic payments ensure on-time payment and avoid late fees and credit score damage.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "payments", "automation"],
      },
      
      // Fraud Protection
      {
        statement: "Credit cards offer $0 fraud liability for unauthorized charges reported promptly.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "fraud-protection", "security"],
      },
      {
        statement: "Credit card dispute rights allow consumers to challenge unauthorized or incorrect charges.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "disputes", "consumer-protection"],
      },
      {
        statement: "EMV chip technology provides enhanced security for in-person transactions.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "security", "emv"],
      },
      
      // Application Process
      {
        statement: "Credit card applications require personal information, income details, and consent to credit check.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "application", "process"],
      },
      {
        statement: "Hard inquiries from credit card applications can temporarily lower credit scores by a few points.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "credit-inquiries", "credit-score"],
      },
      {
        statement: "Pre-qualification tools allow checking approval odds without affecting credit scores.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "pre-qualification", "application"],
      },
      
      // Responsible Usage
      {
        statement: "Using credit cards for budgeted expenses and paying in full builds credit without incurring debt.",
        fact_type: "rule",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "responsible-use", "credit-building"],
      },
      {
        statement: "Treating credit cards like debit cards and only spending what can be paid in full prevents debt accumulation.",
        fact_type: "rule",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "responsible-use", "debt-prevention"],
      },
      {
        statement: "Setting spending limits below the credit limit provides buffer for emergencies and prevents over-limit fees.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "spending-limits", "budgeting"],
      },
      {
        statement: "Regularly reviewing statements helps identify fraud and track spending patterns.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "monitoring", "fraud-prevention"],
      },
      
      // Interest Calculations
      {
        statement: "Credit card interest is typically calculated using the average daily balance method.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "interest", "calculations"],
      },
      {
        statement: "Different APRs may apply for purchases, balance transfers, and cash advances.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "apr", "interest"],
      },
      {
        statement: "Penalty APRs can be triggered by late payments and significantly increase interest rates.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "penalty-apr", "interest"],
      },
      
      // Common Mistakes
      {
        statement: "Making only minimum payments leads to years of debt repayment and thousands in interest.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "mistakes", "debt"],
      },
      {
        statement: "Maxing out credit cards hurts credit scores and increases financial vulnerability.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "mistakes", "credit-score"],
      },
      {
        statement: "Applying for multiple credit cards quickly can damage credit scores through multiple hard inquiries.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "mistakes", "credit-score"],
      },
      {
        statement: "Ignoring statements leads to missed payments, late fees, and potential fraud going undetected.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "mistakes", "monitoring"],
      },
      
      // Benefits of Responsible Use
      {
        statement: "Responsible credit card use builds positive credit history for future loan applications.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "benefits", "credit-building"],
      },
      {
        statement: "Credit card rewards can provide valuable cash back, travel benefits, or points when used responsibly.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "benefits", "rewards"],
      },
      {
        statement: "Credit cards offer purchase protection, extended warranties, and travel insurance benefits.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["credit-cards", "benefits", "protection"],
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
        topic_id: "6c8582f7-3fab-481d-9bc6-5f5f3c1cd5af",
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

improveCreditCardFundamentals();
