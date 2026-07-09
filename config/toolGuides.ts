export interface ToolGuideSection {
  heading: string;
  body: string[];
}

export interface ToolGuide {
  intro: string;
  sections: ToolGuideSection[];
  disclaimer?: string;
}

export const TOOL_GUIDES: Record<string, ToolGuide> = {
  "compound-interest-calculator": {
    intro:
      "Compound interest grows your money because you earn returns on both the original amount and on accumulated interest. Type your numbers above to see an estimate.",
    sections: [
      {
        heading: "The formula",
        body: [
          "A = P × (1 + r/n)^(n×t) where P is principal, r is annual rate, n is compounding frequency, and t is years.",
          "This calculator assumes monthly compounding (n = 12).",
        ],
      },
      {
        heading: "When it applies",
        body: [
          "One-time investments in index funds, retirement accounts, or savings products where earnings stay reinvested.",
          "Compare with dollar-cost averaging when you add money every month — use our DCA calculator for that pattern.",
        ],
      },
    ],
    disclaimer:
      "Illustrative only. Actual returns vary. Not financial advice.",
  },
  "stock-position-calculator": {
    intro:
      "Position sizing limits how much you lose if a trade hits your stop-loss. Type your portfolio value, risk percentage, entry price, and stop price above.",
    sections: [
      {
        heading: "How it works",
        body: [
          "Risk amount = portfolio × risk %.",
          "Risk per share = |entry − stop|.",
          "Shares = floor(risk amount ÷ risk per share).",
        ],
      },
      {
        heading: "Why it matters",
        body: [
          "Consistent position sizing prevents one bad trade from wiping out weeks of gains.",
          "Many experienced traders risk 0.5–2% of capital per idea.",
        ],
      },
    ],
    disclaimer: "Educational tool only. Not trading advice.",
  },
  "bmi-calculator": {
    intro:
      "Body Mass Index (BMI) is weight in kilograms divided by height in metres squared. Type your measurements above for an instant category.",
    sections: [
      {
        heading: "Categories (adults)",
        body: [
          "Under 18.5 — underweight",
          "18.5–24.9 — healthy weight range (typical)",
          "25–29.9 — overweight",
          "30+ — obese",
        ],
      },
    ],
    disclaimer:
      "BMI does not measure body fat directly and may misclassify muscular or elderly individuals. Not medical advice.",
  },
  "programming-quiz": {
    intro: "Five quick questions on core programming ideas. Pick an answer, read the explanation, then continue.",
    sections: [{ heading: "After the quiz", body: ["Review wrong answers and dive into our programming guides for deeper learning."] }],
  },
  "web-development-quiz": {
    intro: "Test your grasp of HTML, CSS, HTTP, and responsive design fundamentals.",
    sections: [{ heading: "Keep going", body: ["Strong web fundamentals make every framework easier to learn."] }],
  },
  "ai-basics-quiz": {
    intro: "Machine learning basics — training data, overfitting, neural networks, and LLMs.",
    sections: [{ heading: "Next steps", body: ["AI moves fast; solid fundamentals help you evaluate new tools critically."] }],
  },
  "stock-market-quiz": {
    intro: "Shares, indices, market cap, and order types — essential vocabulary for investors.",
    sections: [{ heading: "Learn more", body: ["Combine knowledge with disciplined position sizing and diversification."] }],
  },
  "fitness-basics-quiz": {
    intro: "Training principles every beginner should know before chasing advanced programs.",
    sections: [{ heading: "Apply it", body: ["Progressive overload plus recovery beats random workout hopping."] }],
  },
  "retirement-401k-calculator": {
    intro:
      "A 401(k) lets you defer part of your paycheck into a tax-advantaged retirement account, often with employer matching. Type your monthly contribution, match rate, and timeline above.",
    sections: [
      {
        heading: "How employer match works",
        body: [
          "Many US employers match a percentage of your contribution — e.g. 50% match on the first 6% of salary.",
          "This calculator applies your match % to your entered monthly deferral. Actual plan rules vary.",
        ],
      },
      {
        heading: "Assumptions",
        body: [
          "Contributions are invested monthly with compound growth at your expected return rate.",
          "Does not account for IRS contribution limits, vesting schedules, or loan withdrawals.",
        ],
      },
    ],
    disclaimer:
      "Illustrative only. Not tax or financial advice. Consult your plan documents and a qualified adviser.",
  },
  "inflation-adjusted-returns-calculator": {
    intro:
      "Nominal returns look impressive on paper, but inflation erodes purchasing power. See what your investment is really worth in today's dollars.",
    sections: [
      {
        heading: "Real vs nominal",
        body: [
          "Nominal return is the headline growth rate before inflation.",
          "Real return adjusts for inflation so you can compare purchasing power across time.",
        ],
      },
      {
        heading: "Why it matters",
        body: [
          "A 8% nominal return with 3% inflation yields roughly 5% real growth.",
          "Long-term US financial planning often assumes 2–3% inflation.",
        ],
      },
    ],
    disclaimer: "Educational estimates only. Not financial advice.",
  },
  "expense-ratio-calculator": {
    intro:
      "Expense ratios are annual fees charged by mutual funds and ETFs, expressed as a percentage of assets. Even small differences compound dramatically over decades.",
    sections: [
      {
        heading: "How fees work",
        body: [
          "A 0.03% index fund vs a 0.75% active fund on the same gross return leaves vastly different balances.",
          "Fees are deducted from fund assets daily, reducing your compounding base.",
        ],
      },
      {
        heading: "US context",
        body: [
          "Vanguard, Fidelity, and Schwab offer index funds with expense ratios under 0.10%.",
          "SEC rules require funds to disclose expense ratios in prospectuses.",
        ],
      },
    ],
    disclaimer: "Illustrative comparison. Actual fund performance varies. Not investment advice.",
  },
  "cagr-calculator": {
    intro:
      "Compound Annual Growth Rate (CAGR) smooths volatile returns into a single annualized figure — useful for comparing investments over different time periods.",
    sections: [
      {
        heading: "The formula",
        body: [
          "CAGR = (Ending Value ÷ Beginning Value)^(1 ÷ Years) − 1",
          "Unlike average annual return, CAGR accounts for compounding.",
        ],
      },
      {
        heading: "When to use it",
        body: [
          "Compare a stock, index fund, or portfolio against the S&P 500 over the same period.",
          "Evaluate whether an investment met your target return.",
        ],
      },
    ],
    disclaimer: "Past performance does not guarantee future results.",
  },
  "portfolio-allocation-calculator": {
    intro:
      "Asset allocation drives most long-term portfolio outcomes. Check how a single holding fits your target and how much to buy or sell to rebalance.",
    sections: [
      {
        heading: "Rebalancing basics",
        body: [
          "A 60/40 stocks-to-bonds portfolio drifts as markets move — periodic rebalancing keeps risk in check.",
          "This tool shows the dollar amount needed to move one position to your target %.",
        ],
      },
      {
        heading: "Common US targets",
        body: [
          "Young investors often target 80–100% stocks; near-retirement portfolios may shift toward 40–60% bonds.",
          "Consider tax implications in taxable brokerage vs IRA/401(k) accounts before selling.",
        ],
      },
    ],
    disclaimer: "Educational tool only. Not personalized investment advice.",
  },
  "calorie-tdee-calculator": {
    intro:
      "Total Daily Energy Expenditure (TDEE) is the calories you burn per day including activity. We use the Mifflin-St Jeor equation — widely used in US fitness and nutrition apps.",
    sections: [
      {
        heading: "BMR vs TDEE",
        body: [
          "BMR (Basal Metabolic Rate) is calories burned at complete rest.",
          "TDEE multiplies BMR by an activity factor to estimate maintenance calories.",
        ],
      },
      {
        heading: "Activity levels",
        body: [
          "Sedentary: desk job, little exercise (×1.2).",
          "Moderate: 3–5 workouts per week (×1.55).",
          "Very active: daily training or physical job (×1.725–1.9).",
        ],
      },
    ],
    disclaimer:
      "Estimates only. Individual metabolism varies. Not medical or dietary advice.",
  },
  "macro-calculator": {
    intro:
      "Macronutrients — protein, carbohydrates, and fat — make up your daily calories. This calculator uses a balanced 30/40/30 split adjusted for your goal.",
    sections: [
      {
        heading: "The split",
        body: [
          "30% protein, 40% carbohydrates, 30% fat — a common starting point for general fitness.",
          "Protein and carbs provide 4 calories per gram; fat provides 9 calories per gram.",
        ],
      },
      {
        heading: "Goal adjustments",
        body: [
          "Weight loss: ~500 calorie deficit below maintenance.",
          "Weight gain: ~300 calorie surplus above maintenance.",
          "Athletes and bodybuilders may need higher protein — consult a dietitian.",
        ],
      },
    ],
    disclaimer: "General guidance only. Not personalized nutrition advice.",
  },
  "calories-burned-calculator": {
    intro:
      "Calorie burn during exercise depends on activity intensity (MET), duration, and body weight. MET values come from the Compendium of Physical Activities.",
    sections: [
      {
        heading: "How MET works",
        body: [
          "Calories burned = MET × weight (kg) × duration (hours).",
          "Higher MET activities like running burn more calories per minute than walking.",
        ],
      },
      {
        heading: "Limitations",
        body: [
          "Estimates vary with fitness level, terrain, and effort.",
          "Wearable devices and gym machines may show different numbers.",
        ],
      },
    ],
    disclaimer: "Approximate values for planning. Not a medical assessment.",
  },
  "one-rep-max-calculator": {
    intro:
      "Your one-rep max (1RM) is the heaviest weight you can lift for one repetition with proper form. The Epley formula estimates it from a safer submaximal set.",
    sections: [
      {
        heading: "Epley formula",
        body: [
          "1RM = Weight × (1 + Reps ÷ 30)",
          "Most accurate with 1–10 reps. Higher rep counts are less reliable.",
        ],
      },
      {
        heading: "Training use",
        body: [
          "Program percentages (e.g. 5×5 at 80% 1RM) help structure progressive overload.",
          "Always use a spotter when testing near-maximal loads.",
        ],
      },
    ],
    disclaimer:
      "Estimates only. Attempting true 1RM lifts carries injury risk. Consult a trainer if unsure.",
  },
  "mental-wellness-quiz": {
    intro: "An educational wellness check-in — not a clinical screening tool.",
    sections: [
      {
        heading: "Important",
        body: [
          "If you have persistent low mood, anxiety, or thoughts of self-harm, please contact a qualified mental-health professional or local crisis line.",
        ],
      },
    ],
  },
};

export function getToolGuide(slug: string): ToolGuide | undefined {
  return TOOL_GUIDES[slug];
}
