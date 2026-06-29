import { createClient } from "@/lib/supabase/server";
import { IntentType, Question } from "@/lib/types";

const COMMERCIAL_KEYWORDS = [
  "best", "top", "review", "compare", "vs", "versus", "alternative", "cheapest",
  "recommended", "rating", "pros and cons",
];

const TRANSACTIONAL_KEYWORDS = [
  "buy", "purchase", "order", "price", "cost", "deal", "discount", "sale",
  "free trial", "subscribe", "download", "book", "hire", "get",
];

const NAVIGATIONAL_KEYWORDS = [
  "login", "sign in", "official", "website", "app", "download page", "contact",
  "support", "customer service", "phone number",
];

export function classifyIntentFromText(text: string): IntentType {
  const lower = text.toLowerCase();

  const transactional = TRANSACTIONAL_KEYWORDS.filter((k) => lower.includes(k)).length;
  const commercial = COMMERCIAL_KEYWORDS.filter((k) => lower.includes(k)).length;
  const navigational = NAVIGATIONAL_KEYWORDS.filter((k) => lower.includes(k)).length;

  if (transactional > 0) return "transactional";
  if (commercial > 0) return "commercial";
  if (navigational > 0) return "navigational";
  return "informational";
}

export async function classifyQuestionIntent(questionId: string) {
  const supabase = await createClient();

  const { data: question, error: fetchError } = await supabase
    .from("questions")
    .select("id, intent_type, question_translations(question_text)")
    .eq("id", questionId)
    .single();

  if (fetchError || !question) {
    return { intent: null, error: fetchError?.message ?? "Question not found" };
  }

  const translations = (question.question_translations as { question_text: string }[]) || [];
  const primaryText = translations[0]?.question_text ?? "";
  const intent = classifyIntentFromText(primaryText);

  const { error: updateError } = await supabase
    .from("questions")
    .update({ intent_type: intent })
    .eq("id", questionId);

  return { intent, error: updateError?.message ?? null };
}

export async function batchClassifyQuestionIntents(limit = 100) {
  const supabase = await createClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question_translations(question_text)")
    .is("intent_type", null)
    .limit(limit);

  if (error || !questions) {
    return { classified: 0, error: error?.message ?? null };
  }

  let classified = 0;
  for (const question of questions) {
    const translations = (question.question_translations as { question_text: string }[]) || [];
    const text = translations[0]?.question_text ?? "";
    const intent = classifyIntentFromText(text);

    const { error: updateError } = await supabase
      .from("questions")
      .update({ intent_type: intent })
      .eq("id", question.id);

    if (!updateError) classified++;
  }

  return { classified, error: null };
}

export async function getIntentDistribution() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("intent_type")
    .not("intent_type", "is", null);

  if (error || !data) {
    return { data: [] as { intent_type: IntentType; count: number }[], error: error?.message ?? null };
  }

  const counts = data.reduce((acc, row) => {
    const intent = (row.intent_type as IntentType) ?? "informational";
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {} as Record<IntentType, number>);

  const result = Object.entries(counts).map(([intent_type, count]) => ({
    intent_type: intent_type as IntentType,
    count,
  }));

  return { data: result, error: null };
}
