import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveBudgetingFundamentals() {
  console.log("Improving Budgeting Fundamentals knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "A budget is a financial plan that estimates income and expenses over a specific period.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "finance", "planning"],
      },
      {
        statement: "Budgeting provides control over finances and helps achieve financial goals through intentional spending.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "control", "goals"],
      },
      {
        statement: "The 50/30/20 rule allocates 50% to needs, 30% to wants, and 20% to savings and debt repayment.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "50-30-20-rule", "allocation"],
      },
      {
        statement: "Zero-based budgeting requires every dollar of income to be assigned a specific purpose.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "zero-based", "allocation"],
      },
      
      // Getting Started
      {
        statement: "Calculating total income from all sources is the first step in creating a budget.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "income", "tracking"],
      },
      {
        statement: "Tracking expenses for at least one month provides accurate data for budget creation.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "expenses", "tracking"],
      },
      {
        statement: "Fixed expenses are regular, predictable costs like rent, insurance, and loan payments.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "fixed-expenses", "costs"],
      },
      {
        statement: "Variable expenses fluctuate month to month and include groceries, entertainment, and transportation.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "variable-expenses", "costs"],
      },
      
      // Budgeting Methods
      {
        statement: "Envelope budgeting allocates cash to different spending categories and stops spending when envelope is empty.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "envelope-method", "cash"],
      },
      {
        statement: "Pay yourself first means automatically transferring savings money before spending on other categories.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "savings", "automation"],
      },
      {
        statement: "Reverse budgeting focuses on savings goals first, then allocates remaining money to expenses.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "reverse-budgeting", "savings"],
      },
      
      // Expense Tracking
      {
        statement: "Budgeting apps automatically categorize bank transactions and provide spending insights.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "apps", "automation"],
      },
      {
        statement: "Manual expense tracking using spreadsheets provides detailed control and customization.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "spreadsheets", "tracking"],
      },
      {
        statement: "Receipt tracking helps capture cash expenses and provides accurate spending records.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "receipts", "tracking"],
      },
      
      // Budget Categories
      {
        statement: "Housing costs typically include rent or mortgage, utilities, insurance, and maintenance.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "housing", "expenses"],
      },
      {
        statement: "Transportation budget should include car payments, insurance, gas, maintenance, and public transit.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "transportation", "expenses"],
      },
      {
        statement: "Food budget includes groceries, dining out, and work lunches.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "food", "expenses"],
      },
      
      // Irregular Expenses
      {
        statement: "Sinking funds set aside money monthly for irregular expenses like car repairs or annual subscriptions.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "sinking-funds", "irregular-expenses"],
      },
      {
        statement: "Annual expenses should be divided by 12 and included in monthly budget to avoid cash flow problems.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "annual-expenses", "planning"],
      },
      
      // Budget Review and Adjustment
      {
        statement: "Monthly budget reviews identify spending patterns and opportunities for improvement.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "review", "adjustment"],
      },
      {
        statement: "Budget flexibility allows adjusting allocations when circumstances change without abandoning the plan.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "flexibility", "adaptation"],
      },
      {
        statement: "Comparing actual spending to budgeted amounts reveals areas where adjustments are needed.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "variance-analysis", "adjustment"],
      },
      
      // Emergency Fund Integration
      {
        statement: "Emergency funds should cover 3-6 months of essential expenses and be prioritized in budget.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "emergency-fund", "savings"],
      },
      {
        statement: "Emergency fund contributions should be automatic and treated as a fixed expense in the budget.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["budgeting", "emergency-fund", "automation"],
      },
      
      // Debt Repayment
      {
        statement: "Debt repayment should be included in budget using either avalanche or snowball methods.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "debt", "repayment"],
      },
      {
        statement: "Avalanche method pays highest interest debt first to minimize total interest paid.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "debt", "avalanche"],
      },
      {
        statement: "Snowball method pays smallest debt first for psychological momentum and motivation.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "debt", "snowball"],
      },
      
      // Behavioral Aspects
      {
        statement: "Budgeting reduces financial stress by providing clarity and control over spending.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "psychology", "stress-reduction"],
      },
      {
        statement: "Realistic budgets that allow for occasional fun are more sustainable than overly restrictive plans.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "sustainability", "balance"],
      },
      {
        statement: "Budgeting with a partner requires communication, shared goals, and regular financial check-ins.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "couples", "communication"],
      },
      
      // Common Mistakes
      {
        statement: "Overestimating income or underestimating expenses leads to budget failure and frustration.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "mistakes", "planning"],
      },
      {
        statement: "Not tracking actual spending prevents understanding of where money actually goes.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "mistakes", "tracking"],
      },
      {
        statement: "Abandoning budget after one overspent month prevents long-term financial progress.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "mistakes", "persistence"],
      },
      
      // Tools and Resources
      {
        statement: "Spreadsheets like Excel or Google Sheets provide free, customizable budgeting templates.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "tools", "spreadsheets"],
      },
      {
        statement: "Budgeting apps like YNAB, Mint, or PocketGuard automate tracking and provide spending insights.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "apps", "tools"],
      },
      {
        statement: "Bank account alerts can notify users when spending limits are approached or bills are due.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["budgeting", "tools", "alerts"],
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
        topic_id: "a514cd52-ea5d-48c5-9706-c87f47f6f5ba",
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

improveBudgetingFundamentals();
