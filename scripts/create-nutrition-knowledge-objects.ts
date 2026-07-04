/**
 * Create High-Quality Knowledge Objects for Nutrition Fundamentals
 *
 * Health Category Personality: Promote healthier choices
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

  // High-quality facts for Nutrition Fundamentals
  const facts = [
    // Definitions
    {
      id: uuidv4(),
      statement: "Nutrition is the science of how food affects the body. It includes the study of nutrients, how the body uses them, and the relationship between diet, health, and disease.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["nutrition", "health", "science"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Macronutrients are nutrients your body needs in large amounts: carbohydrates for energy, proteins for building and repair, and fats for hormone production and nutrient absorption.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["macronutrients", "carbs", "protein", "fats"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Micronutrients are vitamins and minerals your body needs in small amounts but are essential for proper functioning. They support everything from immune function to bone health.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["micronutrients", "vitamins", "minerals"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Calories measure the energy content of food. Your body burns calories for fuel, and the balance between calories consumed and burned determines whether you gain, lose, or maintain weight.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["calories", "energy", "weight"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Metabolism is the process by which your body converts food and drink into energy. It includes all the chemical reactions that keep your body alive and functioning.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["metabolism", "energy", "process"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "A balanced diet includes a variety of foods in appropriate proportions to provide all essential nutrients. No single food provides everything you need, so diversity is key.",
      factType: "definition",
      confidence: "high",
      scope: "universal",
      tags: ["balanced-diet", "variety", "essentials"],
      domain: "health",
    },

    // Procedural (How to eat well)
    {
      id: uuidv4(),
      statement: "To build a healthy plate, fill half your plate with vegetables and fruits, one-quarter with lean protein, and one-quarter with whole grains. This simple visual guide ensures balanced nutrition.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["healthy-plate", "portions", "practical"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "To read nutrition labels, start with serving size, then check calories per serving. Look at nutrients to limit (saturated fat, sodium, added sugars) and nutrients to get more of (fiber, vitamins, minerals).",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["nutrition-labels", "reading", "skills"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "To stay hydrated, drink water throughout the day rather than waiting until you're thirsty. A good rule is 8 glasses daily, but needs vary by activity level and climate.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["hydration", "water", "habits"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "To reduce sugar intake, focus on whole foods instead of processed ones. Check labels for hidden sugars in sauces, dressings, and packaged foods. Choose naturally sweet fruits over added sugars.",
      factType: "procedural",
      confidence: "high",
      scope: "contextual",
      tags: ["sugar-reduction", "practical", "habits"],
      domain: "health",
    },

    // Causal (Why it matters)
    {
      id: uuidv4(),
      statement: "Poor nutrition contributes to chronic diseases like heart disease, diabetes, and obesity. What you eat affects your risk of these conditions more than genetics alone.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["chronic-disease", "prevention", "impact"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Protein is essential for muscle repair and growth because it provides amino acids, the building blocks of body tissues. Without adequate protein, your body can't maintain or build muscle.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["protein", "muscle", "building-blocks"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Fiber improves digestion and blood sugar control because it slows absorption and adds bulk to stool. High-fiber diets reduce risk of heart disease, diabetes, and certain cancers.",
      factType: "causal",
      confidence: "high",
      scope: "contextual",
      tags: ["fiber", "digestion", "health-benefits"],
      domain: "health",
    },

    // Property (Characteristics)
    {
      id: uuidv4(),
      statement: "Whole foods are minimally processed and retain their natural nutrients. They're generally more nutritious than processed foods, which often have added sugar, salt, and unhealthy fats.",
      factType: "property",
      confidence: "high",
      scope: "universal",
      tags: ["whole-foods", "processing", "nutrition"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Nutritional needs vary by age, gender, activity level, and health status. Children, pregnant women, athletes, and older adults have different requirements for optimal health.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["individual-needs", "variability", "personalization"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Supplements can help fill nutrient gaps but cannot replace a healthy diet. Whole foods provide nutrients in combinations that work together synergistically, which isolated supplements cannot replicate.",
      factType: "property",
      confidence: "high",
      scope: "contextual",
      tags: ["supplements", "whole-foods", "limitations"],
      domain: "health",
    },

    // Rule (Best practices)
    {
      id: uuidv4(),
      statement: "Eat a variety of colorful fruits and vegetables daily. Different colors indicate different beneficial compounds, so eating the rainbow ensures you get a wide range of nutrients.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["variety", "fruits", "vegetables"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Choose whole grains over refined grains. Whole grains retain the bran and germ, which contain fiber, vitamins, and minerals. Refined grains have these nutritious parts removed.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["whole-grains", "refined-grains", "choices"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Limit processed and ultra-processed foods. These often contain unhealthy amounts of added sugar, sodium, and unhealthy fats, while lacking essential nutrients.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["processed-foods", "limits", "health"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Plan your meals and snacks ahead of time. When you have healthy options readily available, you're less likely to make impulsive, less nutritious choices.",
      factType: "rule",
      confidence: "high",
      scope: "contextual",
      tags: ["meal-planning", "preparation", "habits"],
      domain: "health",
    },

    // Warning (Common mistakes)
    {
      id: uuidv4(),
      statement: "Don't eliminate entire food groups unless medically necessary. Each food group provides unique nutrients, and extreme restrictions can lead to deficiencies.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["elimination-diets", "restrictions", "deficiencies"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Avoid fad diets that promise quick results. Sustainable nutrition changes happen gradually. Rapid weight loss usually comes from water and muscle, not fat, and is rarely sustainable.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["fad-diets", "quick-fixes", "sustainability"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Don't ignore portion sizes. Even healthy foods can cause weight gain if consumed in excess. Pay attention to serving sizes, especially with calorie-dense foods like nuts, oils, and avocados.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["portions", "calories", "moderation"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Never skip breakfast or other meals regularly. Skipping meals often leads to overeating later and can disrupt your metabolism and energy levels throughout the day.",
      factType: "warning",
      confidence: "high",
      scope: "contextual",
      tags: ["skipping-meals", "metabolism", "energy"],
      domain: "health",
    },

    // Comparison
    {
      id: uuidv4(),
      statement: "Carbs vs Protein vs Fats: Carbs provide quick energy, protein builds and repairs tissues, fats support hormone production and nutrient absorption. You need all three in appropriate proportions for optimal health.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["macronutrients", "comparison", "balance"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Whole Foods vs Supplements: Whole foods provide nutrients in natural combinations with fiber and other beneficial compounds. Supplements provide isolated nutrients but lack the synergistic benefits of whole foods.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["whole-foods-vs-supplements", "comparison", "sources"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "Plant-based vs Animal-based Protein: Plant proteins often come with fiber and antioxidants but may lack some amino acids. Animal proteins are complete but may come with saturated fat. A mix of both is often optimal.",
      factType: "comparison",
      confidence: "high",
      scope: "contextual",
      tags: ["protein-sources", "comparison", "dietary-patterns"],
      domain: "health",
    },

    // Historical
    {
      id: uuidv4(),
      statement: "The discovery of vitamins began in the early 20th century when scientists found that certain diseases like scurvy and rickets were caused by specific nutrient deficiencies, not infections.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["vitamins", "history", "discovery"],
      domain: "health",
    },
    {
      id: uuidv4(),
      statement: "The food pyramid was introduced by the USDA in 1992 as a guide to healthy eating. It has evolved into MyPlate, which emphasizes portion control and food groups more clearly.",
      factType: "historical",
      confidence: "high",
      scope: "contextual",
      tags: ["food-pyramid", "history", "guidelines"],
      domain: "health",
    },
  ];

  console.log(`Creating ${facts.length} Knowledge Facts for Nutrition Fundamentals...`);

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
