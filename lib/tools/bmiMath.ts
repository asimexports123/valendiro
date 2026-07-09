export interface BmiInput {
  weightKg: number;
  heightCm: number;
}

export interface BmiResult {
  bmi: number;
  category: string;
  description: string;
}

export function calculateBmi(input: BmiInput): BmiResult {
  const weight = Math.max(0, input.weightKg);
  const heightM = Math.max(0, input.heightCm) / 100;

  if (weight === 0 || heightM === 0) {
    return { bmi: 0, category: "—", description: "Enter weight and height to calculate." };
  }

  const bmi = weight / (heightM * heightM);
  let category: string;
  let description: string;

  if (bmi < 18.5) {
    category = "Underweight";
    description = "Below the typical healthy range. Consider speaking with a healthcare provider about nutrition.";
  } else if (bmi < 25) {
    category = "Healthy weight";
    description = "Within the commonly cited healthy BMI range for adults.";
  } else if (bmi < 30) {
    category = "Overweight";
    description = "Above the typical healthy range. Lifestyle changes may help — seek professional advice if unsure.";
  } else {
    category = "Obese";
    description = "Well above the typical healthy range. A clinician can help with a personalised plan.";
  }

  return { bmi: Math.round(bmi * 10) / 10, category, description };
}

export function bmiCategoryColor(category: string): string {
  if (category === "Healthy weight") return "text-emerald-600 dark:text-emerald-400";
  if (category === "Underweight") return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}
