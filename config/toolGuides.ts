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
          "Compare with SIP investing when you add money every month — use our SIP calculator for that pattern.",
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
