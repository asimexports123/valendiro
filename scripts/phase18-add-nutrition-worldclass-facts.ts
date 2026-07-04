/**
 * Phase 18: Add World-Class Knowledge Facts for Nutrition Fundamentals
 *
 * Adding mental models, analogies, practical habits, safety warnings,
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
    .eq('slug', 'nutrition-fundamentals')
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
      statement: "Think of your body as a car that needs fuel. Food is the fuel. High-quality fuel (nutritious food) makes the car run smoothly and last longer. Low-quality fuel (junk food) causes the engine to sputter and wear out faster. This explains why nutrition matters for long-term health.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "body-as-machine", "fuel"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Think of macronutrients as building blocks. Carbohydrates are the energy foundation, proteins are the structural framework, and fats are the insulation and protective coating. You need all three in the right proportions to build a healthy body.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "macronutrients", "building-blocks"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Think of vitamins as spark plugs. They don't provide energy themselves, but they're essential for the chemical reactions that release energy from food. Without spark plugs, the engine won't start even with plenty of fuel. This explains why vitamins are crucial despite being needed in small amounts.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "vitamins", "essential"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Think of your digestive system as a processing plant. It breaks down raw materials (food) into usable components (nutrients), then distributes them where needed. The efficiency of this plant depends on what you feed it and how well you maintain it.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["mental-model", "digestion", "processing"],
      domain: "health",
    },

    // Practical Habits
    {
      id: uuidv4(),
      statement: "Habit: Drink water before meals. Drink a glass of water 20 minutes before eating. This helps you feel fuller, prevents overeating, and supports digestion. Aim for 8 glasses of water daily, more if you're active.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["habit", "hydration", "portion-control"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Habit: Fill half your plate with vegetables. When serving meals, make vegetables occupy half your plate. This ensures you get enough fiber, vitamins, and minerals while naturally limiting higher-calorie foods.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["habit", "vegetables", "portion-control"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Habit: Eat slowly and mindfully. Put your fork down between bites. Chew thoroughly. It takes 20 minutes for your brain to register fullness. Eating slowly prevents overeating and improves digestion.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["habit", "mindful-eating", "digestion"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Habit: Plan meals in advance. Spend 30 minutes weekly planning meals. This reduces impulse eating, ensures balanced nutrition, and saves time and money. Prep ingredients on weekends for busy weekdays.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["habit", "meal-planning", "preparation"],
      domain: "health",
    },

    // Safety and Evidence
    {
      id: uuidv4(),
      statement: "Safety: Consult healthcare professionals before major diet changes. Especially important if you have medical conditions, take medications, are pregnant or breastfeeding, or have a history of eating disorders. What works for others may not be safe for you.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["safety", "medical-disclaimer", "professional-advice"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Evidence: Be skeptical of miracle diets and superfoods. If a claim sounds too good to be true, it probably is. Scientific consensus changes slowly. Trust reputable health organizations like WHO, CDC, and registered dietitians over sensational headlines.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["evidence", "skepticism", "misinformation"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Safety: Avoid extreme restrictions. Eliminating entire food groups without medical necessity can lead to nutrient deficiencies. Unless you have allergies or intolerances, aim for balance rather than elimination. Moderation beats restriction for long-term health.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["safety", "elimination-diets", "balance"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Evidence: Individual variation matters. Genetics, microbiome, activity level, and health status affect nutritional needs. What works for one person may not work for another. Pay attention to how your body responds to different foods.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["evidence", "individualization", "bio-individuality"],
      domain: "health",
    },

    // FAQs
    {
      id: uuidv4(),
      statement: "Do I need supplements? Most people don't need supplements if they eat a balanced diet. Exceptions include vitamin D for many people, B12 for vegetarians/vegans, and prenatal vitamins during pregnancy. Always consult a healthcare provider before starting supplements.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "supplements", "dietary"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Is breakfast really the most important meal? Not necessarily. What matters is overall daily nutrition. If you're not hungry in the morning, that's fine. If you are, eat a balanced breakfast. Listen to your body's hunger signals.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "breakfast", "timing"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "How much protein do I need? Most adults need 0.8 grams per kilogram of body weight daily. Active people may need 1.2-1.6 grams per kilogram. You can get sufficient protein from both animal and plant sources without special powders.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "protein", "requirements"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Are carbs bad for you? No. Carbohydrates are your body's primary energy source. The quality matters: complex carbs from whole foods (vegetables, whole grains, legumes) are healthy. Refined carbs (sugar, white flour) should be limited.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["faq", "carbohydrates", "quality"],
      domain: "health",
    },

    // Continue Learning
    {
      id: uuidv4(),
      statement: "Advanced nutrition concepts to explore: Glycemic index and load, anti-inflammatory diets, gut microbiome health, intermittent fasting, nutrient timing around exercise, and personalized nutrition based on genetics.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "advanced", "concepts"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Cooking skills to develop: Learn basic knife skills, how to roast vegetables, proper cooking methods for different foods, how to read nutrition labels, and how to meal prep efficiently. Cooking at home gives you control over ingredients and portions.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "cooking", "skills"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Nutrition resources: Consult registered dietitians for personalized advice. Use USDA MyPlate as a guide. Read nutrition science blogs from reputable universities. Be cautious of nutrition influencers without credentials.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "resources", "authorities"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Special diets to understand: Mediterranean diet (heart health), DASH diet (blood pressure), plant-based diets (environmental and health benefits), and low-FODMAP diet (digestive issues). Each has evidence for specific health conditions.",
      factType: "definition",
      confidence: "high",
      scope: "contextual",
      tags: ["continue-learning", "diets", "conditions"],
      domain: "health",
    },

    // Decision Frameworks
    {
      id: uuidv4(),
      statement: "Whole foods vs supplements decision: Choose whole foods whenever possible. Whole foods contain nutrients in natural combinations that work together. Supplements are isolated compounds that may not be as effective. Use supplements only when deficiencies are confirmed.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "food-vs-supplements", "selection"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Organic vs conventional decision: Organic foods reduce pesticide exposure but are more expensive. If budget is limited, prioritize organic for the Dirty Dozen (strawberries, spinach, etc.) and buy conventional for the Clean Fifteen (avocados, sweet corn, etc.).",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "organic-vs-conventional", "selection"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Meal timing decision: Eat when hungry, not by the clock. Some people thrive with three meals, others with smaller frequent meals. What matters is total daily nutrition and energy balance. Experiment to find what works for your body and schedule.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["decision-framework", "meal-timing", "personalization"],
      domain: "health",
    },
  ];

  console.log(`Adding ${facts.length} world-class knowledge facts for Nutrition Fundamentals...`);

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
