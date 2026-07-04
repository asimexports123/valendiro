import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveNutritionFundamentals() {
  console.log("Improving Nutrition Fundamentals knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "Nutrition is the science of how the body uses food to sustain life, grow, and repair tissue.",
        fact_type: "definition",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "health", "food"],
      },
      {
        statement: "Four core principles of healthy diets: adequacy, balance, moderation, and diversity.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "dietary-principles", "health"],
      },
      
      // Macronutrients
      {
        statement: "Macronutrients include carbohydrates, proteins, and fats, which the body requires in large amounts for energy.",
        fact_type: "definition",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "macronutrients", "energy"],
      },
      {
        statement: "Carbohydrates are the body's primary energy source, providing four calories per gram.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "carbohydrates", "energy"],
      },
      {
        statement: "Proteins provide four calories per gram and are essential for building and repairing tissues.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "proteins", "tissue-repair"],
      },
      {
        statement: "Dietary fats provide nine calories per gram and support brain function, hormone production, and vitamin absorption.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "fats", "energy"],
      },
      
      // WHO Recommendations
      {
        statement: "WHO recommends limiting free sugars to less than 10% of total daily energy intake.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "who", "sugar"],
      },
      {
        statement: "WHO recommends limiting total fat intake to 30% or less of total energy intake.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "who", "fat"],
      },
      {
        statement: "WHO recommends limiting saturated fat intake to 10% of total energy intake.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "who", "saturated-fat"],
      },
      {
        statement: "WHO recommends limiting trans fat intake to 1% of total energy intake.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "who", "trans-fat"],
      },
      {
        statement: "WHO recommends at least 400 grams of vegetables and fruits per day for adults.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "who", "fruits-vegetables"],
      },
      
      // USDA Guidelines
      {
        statement: "Dietary Guidelines for Americans prioritize whole, nutrient-dense foods and limit highly processed foods.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "usda", "dietary-guidelines"],
      },
      {
        statement: "USDA recommends eating a variety of protein foods from both animal and plant sources.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "usda", "protein"],
      },
      {
        statement: "USDA recommends consuming full-fat dairy with no added sugars when including dairy.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "usda", "dairy"],
      },
      
      // Fats
      {
        statement: "Unsaturated fats from plant sources like olive oil, nuts, and avocados are considered healthy fats.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "fats", "unsaturated"],
      },
      {
        statement: "Saturated fats from animal products and processed foods should be limited for heart health.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "fats", "saturated"],
      },
      {
        statement: "Trans fats from partially hydrogenated oils should be avoided completely.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "fats", "trans"],
      },
      
      // Vitamins and Minerals
      {
        statement: "Micronutrients include vitamins and minerals that regulate body processes despite being required in small quantities.",
        fact_type: "definition",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "micronutrients", "vitamins"],
      },
      {
        statement: "Fat-soluble vitamins (A, D, E, K) require dietary fat for proper absorption.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "vitamins", "absorption"],
      },
      {
        statement: "Water-soluble vitamins (B-complex, C) are not stored in the body and require regular intake.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "vitamins", "water-soluble"],
      },
      {
        statement: "Iron is essential for oxygen transport in the blood and is found in red meat, beans, and fortified cereals.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "minerals", "iron"],
      },
      {
        statement: "Calcium is crucial for bone health and is found in dairy products, leafy greens, and fortified foods.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "minerals", "calcium"],
      },
      
      // Fiber
      {
        statement: "Dietary fiber promotes digestive health, regulates blood sugar, and reduces cardiovascular disease risk.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "fiber", "digestive-health"],
      },
      {
        statement: "WHO recommends at least 25 grams of dietary fiber per day for adults.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "fiber", "who"],
      },
      {
        statement: "Whole grains, vegetables, fruits, legumes, nuts, and seeds are excellent sources of dietary fiber.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "fiber", "sources"],
      },
      
      // Hydration
      {
        statement: "Hydration is critical for every physiological process including digestion, circulation, and temperature regulation.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "hydration", "water"],
      },
      {
        statement: "Water is the best source of hydration, with sugary beverages limited due to added calories.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "hydration", "beverages"],
      },
      
      // Dietary Patterns
      {
        statement: "The Mediterranean diet emphasizes olive oil, vegetables, legumes, fish, and whole grains for longevity.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "mediterranean-diet", "dietary-patterns"],
      },
      {
        statement: "The DASH diet is designed to lower blood pressure through reduced sodium and increased potassium intake.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "dash-diet", "dietary-patterns"],
      },
      
      // Processed Foods
      {
        statement: "Processed foods often contain added sugars, sodium, and unhealthy fats that contribute to chronic conditions.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "processed-foods", "health-risks"],
      },
      {
        statement: "Highly processed foods should be minimized in favor of whole, nutrient-dense foods.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "processed-foods", "recommendations"],
      },
      
      // Caloric Balance
      {
        statement: "Caloric balance determines body weight, with sustained excess leading to fat storage and deficits causing fat loss.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "calories", "weight-management"],
      },
      {
        statement: "Basal metabolic rate is the number of calories the body needs at rest for basic physiological functions.",
        fact_type: "definition",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "metabolism", "calories"],
      },
      
      // Sodium
      {
        statement: "WHO recommends limiting sodium intake to less than 2 grams per day for adults.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "sodium", "who"],
      },
      {
        statement: "Excess sodium intake is associated with increased risk of hypertension and cardiovascular disease.",
        fact_type: "property",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "sodium", "health-risks"],
      },
      
      // Food Groups
      {
        statement: "A balanced diet includes foods from all major groups: grains, proteins, vegetables, fruits, dairy, and healthy fats.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "universal",
        tags: ["nutrition", "food-groups", "balanced-diet"],
      },
      {
        statement: "Colorful vegetables and fruits provide diverse vitamins, minerals, and phytochemicals.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "vegetables", "fruits"],
      },
      
      // Practical Tips
      {
        statement: "Reading nutrition labels helps make informed food choices and understand serving sizes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "labels", "food-choices"],
      },
      {
        statement: "Portion control helps manage calorie intake and prevent overeating.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "portions", "weight-management"],
      },
      {
        statement: "Meal planning and preparation at home supports healthier eating habits.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Health",
        scope: "contextual",
        tags: ["nutrition", "meal-planning", "habits"],
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
        topic_id: "2f756b44-d210-4186-b60e-ed8387aea23c",
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

improveNutritionFundamentals();
