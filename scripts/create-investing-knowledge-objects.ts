/**
 * Create High-Quality Knowledge Objects for Investing Basics
 *
 * Finance Category Personality: Reduce financial mistakes, Increase confidence
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

  // High-quality facts for Investing Basics
  const facts = [
    // Definitions
    {
      id: uuidv4(),
      statement: "Investing is the act of allocating money or resources with the expectation of generating an income or profit over time. It's different from saving, which is setting money aside for future use.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["investing", "finance", "basics"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "A stock represents ownership in a company. When you buy a stock, you become a shareholder and own a small piece of that company. Your returns come from the company's growth and profits.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["stocks", "equity", "ownership"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "A bond is a loan you make to a government or corporation. In exchange, they promise to pay you back with interest over a fixed period. Bonds are generally considered safer than stocks.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["bonds", "fixed-income", "loans"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Diversification is the practice of spreading your investments across different types of assets to reduce risk. It's the financial equivalent of 'not putting all your eggs in one basket.'",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["diversification", "risk-management", "strategy"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Compound interest is interest earned on interest. It's the most powerful force in investing because your money grows exponentially over time, not just linearly.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["compound-interest", "growth", "time-value"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Risk tolerance is your ability to withstand losses in your investments. It depends on your financial situation, time horizon, and emotional comfort with market fluctuations.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["risk-tolerance", "psychology", "assessment"],
      domain: "finance",
    },

    // Procedural (How to invest)
    {
      id: uuidv4(),
      statement: "To start investing, first build an emergency fund of 3-6 months of expenses. This ensures you won't need to sell investments at a bad time if you face unexpected costs.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["emergency-fund", "preparation", "safety"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "To choose investments, understand your goals and timeline. Money you need in 1-3 years should be in safe investments like bonds or savings accounts. Money for 10+ years can be in stocks.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["asset-allocation", "goals", "timeline"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "To buy stocks, open a brokerage account with a reputable firm. Research companies you understand, or consider low-cost index funds that give you broad market exposure.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["brokerage", "execution", "stocks"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "To minimize risk, invest regularly through dollar-cost averaging. Instead of trying to time the market, invest a fixed amount at regular intervals regardless of price.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["dollar-cost-averaging", "risk-management", "timing"],
      domain: "finance",
    },

    // Causal (Why it works)
    {
      id: uuidv4(),
      statement: "Stocks historically provide higher returns than other investments because companies grow and innovate over time. However, this comes with higher volatility and risk of loss.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["stock-returns", "risk-reward", "history"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Bonds are safer than stocks because they promise fixed payments and have priority in bankruptcy. However, this safety comes with lower returns and risk from inflation and interest rate changes.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["bond-safety", "fixed-income", "risk-return"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Time is your greatest ally in investing because compound interest works exponentially. Starting early matters more than starting with a large amount.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["time-horizon", "compound-interest", "growth"],
      domain: "finance",
    },

    // Property (Characteristics)
    {
      id: uuidv4(),
      statement: "The stock market has historically returned about 10% annually before inflation. Past performance doesn't guarantee future results, but this long-term trend shows the power of investing.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["market-returns", "history", "performance"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Investing always involves risk - the possibility of losing money. Different investments have different risk levels, and higher potential returns almost always come with higher risk.",
      factType: "property",
      confidence: "high",
      scope: "universal",
      tags: ["risk", "uncertainty", "fundamental"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Inflation erodes the purchasing power of cash over time. Investing is necessary to preserve and grow your wealth because cash alone loses value in real terms.",
      factType: "property",
      confidence: "high",
      scope: "universal",
      tags: ["inflation", "purchasing-power", "necessity"],
      domain: "finance",
    },

    // Rule (Best practices)
    {
      id: uuidv4(),
      statement: "Never invest money you can't afford to lose. Only invest after you've built an emergency fund and paid off high-interest debt like credit cards.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["risk-management", "preparation", "safety"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Invest for the long term. Trying to time the market or chase hot tips usually leads to poor results. Stay invested through market ups and downs.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["long-term", "patience", "strategy"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Keep your investing costs low. High fees significantly reduce your returns over time. Choose low-cost index funds and avoid frequent trading.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["fees", "costs", "optimization"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Rebalance your portfolio periodically. As some investments grow faster than others, your original allocation shifts. Sell winners and buy underperformers to maintain your target mix.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["rebalancing", "maintenance", "discipline"],
      domain: "finance",
    },

    // Warning (Common mistakes)
    {
      id: uuidv4(),
      statement: "Don't panic sell during market downturns. Markets historically recover, and selling at the bottom locks in losses. Stay the course if your fundamentals haven't changed.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["panic-selling", "emotions", "mistakes"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Avoid putting all your money in a single stock or investment. Concentration risk can destroy your wealth if that investment fails. Diversify across different companies and sectors.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["concentration-risk", "diversification", "mistakes"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Don't chase past performance. Investments that did well recently may not do well in the future. Focus on fundamentals and your long-term goals instead.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["chasing-performance", "mistakes", "behavior"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Never borrow money to invest. Margin investing amplifies both gains and losses, and you can lose more than your initial investment. The risk is too high for most investors.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["margin", "borrowing", "dangerous"],
      domain: "finance",
    },

    // Comparison
    {
      id: uuidv4(),
      statement: "Stocks vs Bonds: Stocks offer higher growth potential but with higher risk and volatility. Bonds offer stability and regular income but with lower returns. A balanced portfolio typically includes both.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["stocks-vs-bonds", "comparison", "allocation"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Active vs Passive Investing: Active investing tries to beat the market through research and stock picking. Passive investing tracks market indices and accepts market returns. Passive investing typically outperforms active after fees.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["active-vs-passive", "comparison", "strategy"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "Investing vs Gambling: Investing involves informed decisions based on research and analysis with a positive expected return. Gambling relies on chance with a negative expected return. The mindset and approach are fundamentally different.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["investing-vs-gambling", "comparison", "mindset"],
      domain: "finance",
    },

    // Historical
    {
      id: uuidv4(),
      statement: "The stock market has experienced numerous crashes and bear markets throughout history, including 1929, 2000, and 2008. Despite these downturns, the market has always recovered and reached new highs.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["market-crashes", "history", "resilience"],
      domain: "finance",
    },
    {
      id: uuidv4(),
      statement: "The concept of compound interest has been called the eighth wonder of the world. Albert Einstein reportedly said, 'He who understands it, earns it; he who doesn't, pays it.'",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["compound-interest", "history", "wisdom"],
      domain: "finance",
    },
  ];

  console.log(`Creating ${facts.length} Knowledge Facts for Investing Basics...`);

  // Insert knowledge facts
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
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
