#!/usr/bin/env tsx
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { readFileSync } from "fs";
import { writeFileSync } from "fs";

type TopicModelConcept = {
  id?: string;
  label?: string;
  canonicalAssertion?: string;
  supportingFacts?: string[];
  mentalModel?: string;
  importanceScore?: number;
};

type TopicModelFile = {
  slug?: string;
  title?: string;
  concepts?: TopicModelConcept[];
};

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\[/g, " [")
    .replace(/\[(\d+)\]/g, "")
    .trim();
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = cleanText(item).toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(cleanText(item));
  }
  return out;
}

function renderBulletList(items: string[]): string {
  return items.map((item) => `- ${cleanText(item)}`).join("\n");
}

function section(title: string, body: string): string {
  return `## ${title}\n\n${body.trim()}\n`;
}

function paragraph(...parts: string[]): string {
  return cleanText(parts.filter(Boolean).join(" "));
}

function sentenceList(items: string[]): string {
  return items
    .map((item) => cleanText(item))
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}

function buildArticle(model: TopicModelFile): string {
  const concepts = (model.concepts ?? [])
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));

  const byAssertion = (pattern: RegExp) =>
    concepts.find((c) => pattern.test(`${c.label ?? ""} ${c.canonicalAssertion ?? ""}`));

  const has = (pattern: RegExp) => Boolean(byAssertion(pattern));
  const claim = (pattern: RegExp, fallback: string) =>
    cleanText(byAssertion(pattern)?.canonicalAssertion ?? fallback);

  const def = claim(
    /type of insurance that covers/i,
    "Health insurance or medical insurance is a type of insurance that helps cover medical expenses."
  );
  const policy = claim(
    /insurance contract between an insurance provider/i,
    "A health insurance policy is the contract between you and the insurer."
  );
  const pool = claim(
    /risk is shared among many individuals/i,
    "The basic mechanism is risk pooling: many people contribute, and the pool helps pay for the people who need care."
  );
  const premium = claim(/premium: the amount/i, "Premium is the amount you pay to keep the policy active.");
  const deductible = claim(
    /deductible/i,
    "Deductible is the amount you usually pay before the insurer starts paying its share."
  );
  const copay = claim(/co-payment/i, "Copay is a fixed amount you pay for a covered service.");
  const coinsurance = claim(
    /co-?insurance/i,
    "Coinsurance is the percentage of the bill you share with the insurer."
  );
  const outOfPocketMax = claim(
    /out-of-pocket maximum/i,
    "Out-of-pocket maximum is the annual cap on what you pay for covered care."
  );
  const inNetwork = claim(
    /in-network provider/i,
    "In-network providers have a contract with the plan, so your cost-sharing is usually lower."
  );
  const outOfNetwork = claim(
    /out-of-network provider/i,
    "Out-of-network providers have no contract with the plan, so the same visit can cost more."
  );
  const title = model.title ?? "Health Insurance";
  const opening = paragraph(
    def,
    "The easiest way to understand it is to imagine a group of people putting money into one shared system so that nobody has to carry a huge medical bill alone.",
    `That is why ${title.toLowerCase()} feels like paperwork on the surface, but behaves like a risk-sharing system underneath.`
  );

  const whatItMeans = paragraph(
    policy,
    "In plain language, the policy is the rulebook. It tells you what the plan will pay for, what you still owe, and where the limits are."
  );

  const mechanism = paragraph(
    pool,
    "The insurer is not simply paying random bills. It is collecting money from many people, applying rules, and then using that pool when someone needs care."
  );

  const costFlow = paragraph(
    "Premium is the price of staying covered. Deductible is the first real chunk you often pay before the insurer starts paying its share. Copay is a fixed amount you pay for a visit or prescription, and coinsurance is the percentage split after that. Out-of-pocket maximum is the ceiling: once you hit it for covered care, the plan pays the rest of the covered bill."
  );

  const costSense = paragraph(
    "The point is not to memorize the words separately. The point is to see how they work together. A low premium can hide a high deductible. A strong network can matter more than a tiny premium discount. And a high out-of-pocket maximum can turn a plan that looks cheap into one that feels expensive once you actually use care."
  );

  const policyControlsIntro = paragraph(
    "The policy is the rulebook for the plan.",
    "It decides what counts as covered care, how much the plan pays, what you still owe, and what happens if a claim gets denied."
  );

  const policyControlsPoints = [
    "What care is covered and what is not",
    "How much the plan pays for a covered service",
    "How much you pay through deductibles, copays, and coinsurance",
    "Which doctors and hospitals count as in-network",
    "How to appeal if a claim is denied",
  ];

  const summary = paragraph(
    "Health insurance spreads medical risk across many people instead of leaving one person to absorb the full cost.",
    "The policy defines coverage, the network affects cost, and the cost-sharing terms decide what you pay at each step.",
    "When you compare plans, look at the full picture: premium, deductible, copay, coinsurance, network status, and out-of-pocket maximum together."
  );

  const beginnerExample = paragraph(
    "Here is the simple version with real numbers:",
    "- Premium: $200/month",
    "- Hospital bill: $20,000",
    "- Deductible: $1,000, so you pay the first $1,000",
    "- That leaves $19,000",
    "- If the plan pays 80% after the deductible, insurance pays $15,200",
    "- You pay $3,800 on the remaining bill",
    "- Add the $1,000 deductible, and your total out-of-pocket cost becomes $4,800"
  );

  const claimJourney = paragraph(
    "Here is the full claim journey:",
    "1. You buy the policy.",
    "2. You pay the premium every month.",
    "3. You get sick or need hospital care.",
    "4. The hospital sends the claim to the insurance company.",
    "5. The insurer checks whether the claim is covered.",
    "6. You pay the deductible first.",
    "7. Insurance pays the rest of the covered balance according to the plan rules."
  );

  const analogyBox = paragraph(
    "A useful mental model is a shared jar. Everyone contributes a little, and when someone needs care, the money comes from that jar instead of from one person alone."
  );

  return [
    "# Health Insurance",
    "",
    opening,
    "",
    section(
      "The big idea",
      `${whatItMeans}\n\n${analogyBox}`
    ),
    section(
      "How the system works",
      `${mechanism}\n\n${paragraph(
        "Once you see it that way, the rest becomes easier: the plan is not just paying bills, it is deciding when the shared pool pays and how much of the bill still belongs to you."
      )}\n\n${paragraph(
        "That is why health insurance feels less like a single product and more like a rule system for handling uncertainty."
      )}`
    ),
    section(
      "What you actually pay",
      `${costFlow}\n\n${costSense}`
    ),
    section(
      "A beginner example",
      `${beginnerExample}\n\n${paragraph(
        "This is the part beginners should picture first. The monthly premium keeps you covered, and the deductible plus coinsurance decide how much of a real hospital bill you still carry."
      )}`
    ),
    section(
      "Hospital claim journey",
      `${claimJourney}\n\n${paragraph(
        "If you can picture this sequence, most of the confusion disappears. The plan is not a single payment; it is a chain of steps from coverage to claim to final split of the bill."
      )}`
    ),
    section(
      "Why network choice matters",
      `${paragraph(
        "Network choice matters because the same doctor visit can land in a different cost bucket depending on whether the provider is in the plan network."
      )}\n\n${paragraph(inNetwork)}\n\n${paragraph(outOfNetwork)}\n\n${paragraph(
        "That is why two people with the same plan can still walk away with very different bills."
      )}`
    ),
    section(
      "What the policy controls",
      `${policyControlsIntro}\n\n${sentenceList(policyControlsPoints)}\n\n${paragraph(
        "If you ever feel lost, go back to the policy booklet. That is the source of truth, not the marketing page."
      )}\n\n${paragraph(
        "For a beginner, the key idea is simple: the policy does not just name benefits. It sets the boundaries of the entire deal."
      )}`
    ),
    section(
      "Where people get stuck",
      `${paragraph(
        "People usually get stuck because they compare plans by premium alone. That is the quickest way to miss the real cost."
      )}\n\n${paragraph(
        "The shortcut is simple: compare the whole cost picture, not just the premium."
      )}\n\n${paragraph(
        "If a plan looks cheap but hides a high deductible or weak network, the bill shows up later."
      )}`
    ),
    section(
      "Bottom line",
      `${summary}\n\n${paragraph(
        "In one line: health insurance spreads risk, defines coverage, and makes medical costs more predictable."
      )}`
    ),
  ].join("\n");
}

async function main() {
  const sb = createAdminClient();
  const slug = "health-insurance";
  const modelPath = resolve(process.cwd(), "temp", "topicmodel-health-insurance.json");
  const model = JSON.parse(readFileSync(modelPath, "utf8")) as TopicModelFile;
  const md = buildArticle(model);
  writeFileSync(resolve(process.cwd(), "temp", "health-insurance-article.md"), md, "utf8");

  const { data: topic } = await sb
    .from("topics")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!topic) {
    console.error("topic not found:", slug);
    process.exit(1);
  }
  const topicId = topic.id;

  const { data: existing } = await sb
    .from("topic_translations")
    .select("id")
    .eq("topic_id", topicId)
    .eq("language_code", "en")
    .maybeSingle();

  if (existing) {
    await sb
      .from("topic_translations")
      .update({ content: md })
      .eq("id", existing.id);
    console.log("Updated topic_translations for", slug);
  } else {
    await sb.from("topic_translations").insert([
      {
        topic_id: topicId,
        language_code: "en",
        title: "Health Insurance",
        content: md,
      },
    ]);
    console.log("Inserted topic_translations for", slug);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
