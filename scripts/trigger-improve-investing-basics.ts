import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveInvestingBasics() {
  console.log("Improving Investing Basics knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "Investing is allocating money into assets with expectation of generating returns over time.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "finance", "returns"],
      },
      {
        statement: "Risk and return are positively correlated: higher potential returns come with higher risk.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "risk", "returns"],
      },
      {
        statement: "Compound interest allows investment returns to generate additional returns over time.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "compound-interest", "growth"],
      },
      {
        statement: "Time horizon is the length of time an investor expects to hold an investment before needing the money.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "time-horizon", "planning"],
      },
      
      // Investment Types
      {
        statement: "Stocks represent ownership shares in companies and generate returns through price appreciation and dividends.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "stocks", "equity"],
      },
      {
        statement: "Bonds are debt instruments that pay fixed interest and return principal at maturity.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "bonds", "fixed-income"],
      },
      {
        statement: "Mutual funds pool money from many investors to buy diversified portfolios of stocks, bonds, or other securities.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "mutual-funds", "diversification"],
      },
      {
        statement: "ETFs (Exchange-Traded Funds) are investment funds traded on stock exchanges like individual stocks.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "etfs", "exchange-traded-funds"],
      },
      {
        statement: "Index funds track market indices like the S&P 500 and provide broad market exposure with low fees.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "index-funds", "passive-investing"],
      },
      {
        statement: "Real estate investing involves purchasing property for rental income or capital appreciation.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "real-estate", "property"],
      },
      
      // Investment Accounts
      {
        statement: "Taxable brokerage accounts offer flexibility but no tax advantages on investment gains.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "brokerage", "taxes"],
      },
      {
        statement: "401(k) plans are employer-sponsored retirement accounts with tax advantages and potential employer matching.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "401k", "retirement"],
      },
      {
        statement: "IRAs (Individual Retirement Accounts) provide tax advantages for retirement savings.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "ira", "retirement"],
      },
      {
        statement: "Roth IRAs offer tax-free withdrawals in retirement but contributions are made with after-tax dollars.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "roth-ira", "retirement"],
      },
      
      // Investment Strategies
      {
        statement: "Diversification reduces portfolio risk by spreading investments across different asset classes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "diversification", "risk-management"],
      },
      {
        statement: "Asset allocation involves dividing investments among different asset classes based on risk tolerance and goals.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "asset-allocation", "strategy"],
      },
      {
        statement: "Dollar-cost averaging involves investing fixed amounts regularly regardless of market conditions.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "dollar-cost-averaging", "strategy"],
      },
      {
        statement: "Portfolio rebalancing maintains target asset allocation by periodically adjusting holdings.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "rebalancing", "maintenance"],
      },
      
      // Risk Management
      {
        statement: "Risk tolerance is an investor's ability and willingness to endure declines in investment value.",
        fact_type: "definition",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "risk-tolerance", "assessment"],
      },
      {
        statement: "Emergency funds should be established before investing to cover unexpected expenses.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "emergency-fund", "planning"],
      },
      {
        statement: "High-yield savings accounts provide safe returns for short-term savings and emergency funds.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "savings", "cash"],
      },
      
      // Investment Process
      {
        statement: "Setting clear investment goals helps determine appropriate investment strategies and time horizons.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "universal",
        tags: ["investing", "goals", "planning"],
      },
      {
        statement: "Investment research involves analyzing company financials, market conditions, and economic factors.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "research", "analysis"],
      },
      {
        statement: "Broker selection should consider fees, investment options, research tools, and customer service.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "brokers", "selection"],
      },
      
      // Tax Considerations
      {
        statement: "Capital gains are profits from selling investments and are taxed at different rates based on holding period.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "capital-gains", "taxes"],
      },
      {
        statement: "Long-term capital gains (holdings over one year) are taxed at lower rates than short-term gains.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "capital-gains", "taxes"],
      },
      {
        statement: "Dividend income is generally taxed at lower rates than ordinary income.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "dividends", "taxes"],
      },
      
      // Investment Fraud Prevention
      {
        statement: "Investment fraud warning signs include guaranteed returns, pressure to act quickly, and unsolicited offers.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "fraud", "security"],
      },
      {
        statement: "SEC (Securities and Exchange Commission) regulates securities markets and protects investors.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "sec", "regulation"],
      },
      {
        statement: "FINRA (Financial Industry Regulatory Authority) oversees brokerage firms and protects investors.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "finra", "regulation"],
      },
      
      // Common Mistakes
      {
        statement: "Emotional investing decisions based on fear or greed often lead to poor investment outcomes.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "mistakes", "psychology"],
      },
      {
        statement: "Market timing attempts to predict market movements and consistently underperform long-term investing.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "market-timing", "mistakes"],
      },
      {
        statement: "Chasing past performance often leads to buying at market peaks and missing future opportunities.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "performance", "mistakes"],
      },
      {
        statement: "Ignoring investment fees can significantly reduce long-term returns through compounding.",
        fact_type: "property",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "fees", "mistakes"],
      },
      
      // Getting Started
      {
        statement: "Beginning investors should start with index funds for broad market exposure and low costs.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "beginners", "index-funds"],
      },
      {
        statement: "Automating regular investments through payroll deduction or automatic transfers builds consistent investing habits.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "automation", "habits"],
      },
      {
        statement: "Investment education through books, courses, and reputable financial websites improves decision-making.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Personal Finance",
        scope: "contextual",
        tags: ["investing", "education", "learning"],
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
        topic_id: "ba90aca1-36ee-40e0-8a7b-0d03361ef250",
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

improveInvestingBasics();
