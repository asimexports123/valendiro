/**
 * Phase 18: Add World-Class Knowledge Facts for Investing Basics
 *
 * Adding mental models, analogies, practical scenarios, calculations,
 * FAQs, continue learning paths, and decision frameworks
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the topic
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id')
    .eq('slug', 'investing-basics')
    .single();

  if (topicError || !topic) {
    console.error('Error: Topic not found');
    process.exit(1);
  }

  // Get the knowledge package
  const { data: packageData, error: packageError } = await supabase
    .from('knowledge_packages')
    .select('id')
    .eq('topic_id', topic.id)
    .single();

  if (packageError || !packageData) {
    console.error('Error: Knowledge Package not found');
    process.exit(1);
  }

  // World-class additional facts
  const facts = [
    // Mental Models
    {
      id: uuidv4(),
      statement: "Think of compound interest as a snowball rolling down a hill. As it rolls, it picks up more snow (interest) which makes it larger, which then picks up even more snow. Over time, a small snowball becomes massive. This is why starting early is so powerful.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "compound-interest", "growth"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Think of diversification as not putting all your eggs in one basket. If you drop the basket, you lose everything. If you spread eggs across multiple baskets, dropping one doesn't ruin you. This explains why spreading investments reduces risk.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "diversification", "risk"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Think of stocks as owning a slice of a company. When you buy a stock, you become a partial owner. If the company succeeds, you benefit. If it fails, you share the loss. This explains why stock prices fluctuate with company performance.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "stocks", "ownership"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Think of bonds as lending money. When you buy a bond, you're lending money to a government or company. They promise to pay you back with interest. This explains why bonds are generally safer than stocks but offer lower returns.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "bonds", "lending"],
      domain: "finance",
    },

    // Practical Scenarios
    {
      id: uuidv4(),
      statement: "Scenario: Starting at age 25, investing $200 monthly at 7% annual return. By age 65, you'll have approximately $525,000. Starting at age 35 with the same contribution yields only $243,000. This demonstrates the power of starting early.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["scenario", "compound-interest", "time-value"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Scenario: During a market downturn, your $10,000 investment drops to $8,000. If you panic sell, you lock in the loss. If you hold and the market recovers to $12,000 over time, you gain $2,000. This shows why emotional selling destroys wealth.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["scenario", "market-volatility", "psychology"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Scenario: You have $10,000 to invest. Putting it all in one stock is risky. If that company fails, you lose everything. Spreading it across 10 different stocks means one company's failure only costs you $1,000. This illustrates diversification benefits.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["scenario", "diversification", "risk"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Scenario: Inflation is 3% per year. If your money earns 2% interest, you're actually losing 1% of purchasing power annually. Over 20 years, $10,000 would only buy what $8,200 buys today. This explains why investing is necessary to beat inflation.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["scenario", "inflation", "purchasing-power"],
      domain: "finance",
    },

    // Calculations
    {
      id: uuidv4(),
      statement: "Compound interest formula: A = P(1 + r/n)^(nt). Where A = final amount, P = principal, r = annual interest rate, n = times compounded per year, t = years. This formula shows how money grows over time with compound interest.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["calculation", "compound-interest", "formula"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Rule of 72: Divide 72 by your annual return rate to estimate years to double your money. At 7% return, 72/7 = 10.3 years to double. At 10% return, 72/10 = 7.2 years. This quick mental math helps understand investment growth.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["calculation", "rule-of-72", "growth"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Emergency fund calculation: Multiply monthly expenses by 6. If you spend $3,000 monthly, your emergency fund should be $18,000. This provides 6 months of security if you lose income. Keep this in a high-yield savings account.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["calculation", "emergency-fund", "planning"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Dollar-cost averaging calculation: Investing $500 monthly means $6,000 annually regardless of market conditions. When prices are high, you buy fewer shares. When prices are low, you buy more shares. This reduces the risk of investing at the wrong time.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["calculation", "dollar-cost-averaging", "timing"],
      domain: "finance",
    },

    // Risk Awareness
    {
      id: uuidv4(),
      statement: "Market risk: The entire stock market can decline due to economic factors, recessions, or global events. During the 2008 financial crisis, the S&P 500 lost about 50%. This is why you should only invest money you won't need for 5+ years.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["risk", "market-risk", "volatility"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Inflation risk: The risk that your money loses purchasing power over time. If inflation is 3% and your investment returns 2%, you're actually losing 1% annually in real terms. This is why conservative investments like cash can be risky long-term.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["risk", "inflation-risk", "purchasing-power"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Concentration risk: The risk of having too much money in one investment or sector. If that investment fails or sector declines, your portfolio suffers. Diversification across different assets and sectors reduces this risk.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["risk", "concentration-risk", "diversification"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Liquidity risk: The risk of not being able to sell an investment quickly without losing value. Real estate and private equity have high liquidity risk. Stocks and bonds generally have low liquidity risk because they trade daily on exchanges.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["risk", "liquidity-risk", "access"],
      domain: "finance",
    },

    // FAQs
    {
      id: uuidv4(),
      statement: "How much money do I need to start investing? You can start with as little as $50-100. Many brokerages have no minimum account requirements. The key is consistency - investing small amounts regularly is more effective than waiting for a large sum.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "getting-started", "minimum"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "What's the difference between stocks and bonds? Stocks represent ownership in a company with potential for high returns but higher risk. Bonds are loans to governments or companies with fixed interest payments and lower risk. Stocks grow wealth, bonds preserve it.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "stocks-vs-bonds", "comparison"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Should I pay off debt or invest? Generally, pay off high-interest debt (credit cards, personal loans) before investing. For low-interest debt like mortgages, you might invest instead if your expected returns exceed the interest rate.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "debt-vs-investing", "decision"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Is my money safe in the stock market? In the short term, no - stocks can lose value. In the long term (10+ years), yes - the stock market has historically always recovered and grown. Never invest money you'll need within 5 years.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "safety", "risk"],
      domain: "finance",
    },

    // Continue Learning
    {
      id: uuidv4(),
      statement: "Advanced investing concepts to learn next: Asset allocation, tax-efficient investing, retirement accounts (401k, IRA), index funds vs ETFs, REITs for real estate exposure, and options trading. These concepts help optimize your investment strategy.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "advanced", "concepts"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Retirement accounts to explore: 401(k) with employer matching (free money), Roth IRA for tax-free growth, Traditional IRA for tax deductions, and HSA for healthcare savings. Each has different tax advantages and contribution limits.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "retirement", "accounts"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Building an investment portfolio: Start with broad market index funds like the S&P 500. Add international exposure with global index funds. Include bonds for stability. Rebalance annually to maintain your target allocation. This simple approach beats most active investors.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "portfolio", "strategy"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Investment resources: Read 'The Intelligent Investor' by Benjamin Graham, follow financial news from reputable sources, use investment calculators from brokerages, and consider fee-only financial advisors for personalized advice. Continuous learning improves investment decisions.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "resources", "education"],
      domain: "finance",
    },

    // Decision Frameworks
    {
      id: uuidv4(),
      statement: "Stocks vs ETFs decision: Choose individual stocks if you want to research and pick specific companies. Choose ETFs (Exchange Traded Funds) for instant diversification and lower risk. Most beginners should start with ETFs for safety and simplicity.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "stocks-vs-etfs", "selection"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Active vs passive investing decision: Passive investing (index funds) matches market returns with low fees. Active investing (stock picking) aims to beat the market but rarely succeeds long-term. Choose passive for most of your portfolio, active only if you have expertise and time.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "active-vs-passive", "strategy"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Asset allocation decision: Subtract your age from 110 to determine stock percentage. Age 30 = 80% stocks, 20% bonds. Age 60 = 50% stocks, 50% bonds. This formula adjusts risk based on your time horizon and risk tolerance.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "asset-allocation", "risk"],
      domain: "finance",
    },
  ];

  console.log(`Adding ${facts.length} world-class knowledge facts for Investing Basics...`);

  let created = 0;
  let errors = 0;

  for (const fact of facts) {
    const { error: insertError } = await supabase
      .from('knowledge_facts')
      .insert({
        id: fact.id,
        package_id: packageData.id,
        statement: fact.statement,
        fact_type: fact.factType,
        confidence: fact.confidence,
        domain: fact.domain,
        scope: fact.scope,
        tags: fact.tags,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`Error inserting fact: ${insertError.message}`);
      errors++;
    } else {
      created++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Created: ${created}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${facts.length}`);
  console.log(`\nPrevious total facts: 29`);
  console.log(`New total facts: ${29 + created}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
