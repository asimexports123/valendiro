/**
 * Coverage Templates for Domains
 * 
 * Each domain has a coverage template defining:
 * - Expected topics for complete coverage
 * - Topic categories/modules
 * - Priority levels
 */

export interface CoverageTemplate {
  domainId: string;
  domainName: string;
  expectedTopics: number;
  modules: ModuleTemplate[];
}

export interface ModuleTemplate {
  moduleName: string;
  expectedTopics: number;
  topicPatterns: string[];
}

/**
 * Coverage Templates for Initial Domains
 * These will be expanded dynamically as domains are discovered
 */
export const COVERAGE_TEMPLATES: CoverageTemplate[] = [
  {
    domainId: "javascript-fundamentals",
    domainName: "JavaScript Fundamentals",
    expectedTopics: 15,
    modules: [
      {
        moduleName: "JS Basics",
        expectedTopics: 5,
        topicPatterns: ["javascript-variables", "javascript-functions", "javascript-scope", "javascript-types", "javascript-operators"]
      },
      {
        moduleName: "DOM",
        expectedTopics: 5,
        topicPatterns: ["dom-selectors", "dom-events", "dom-manipulation", "dom-traversal", "dom-attributes"]
      },
      {
        moduleName: "Advanced JS",
        expectedTopics: 5,
        topicPatterns: ["javascript-async", "javascript-classes", "javascript-promises", "javascript-fetch", "javascript-modules"]
      }
    ]
  },
  {
    domainId: "css-fundamentals",
    domainName: "CSS Fundamentals",
    expectedTopics: 15,
    modules: [
      {
        moduleName: "CSS Basics",
        expectedTopics: 5,
        topicPatterns: ["css-syntax", "css-selectors", "css-colors", "css-box-model", "css-typography"]
      },
      {
        moduleName: "Layout",
        expectedTopics: 5,
        topicPatterns: ["css-flexbox", "css-grid", "css-positioning", "css-responsive", "css-media-queries"]
      },
      {
        moduleName: "Advanced CSS",
        expectedTopics: 5,
        topicPatterns: ["css-animations", "css-transitions", "css-transforms", "css-variables", "css-pseudo-elements"]
      }
    ]
  },
  {
    domainId: "investing-basics",
    domainName: "Investing Basics",
    expectedTopics: 15,
    modules: [
      {
        moduleName: "Investment Fundamentals",
        expectedTopics: 5,
        topicPatterns: ["investing-basics", "compound-interest", "risk-return", "asset-classes", "diversification"]
      },
      {
        moduleName: "Investment Types",
        expectedTopics: 5,
        topicPatterns: ["stocks", "bonds", "mutual-funds", "etfs", "index-funds"]
      },
      {
        moduleName: "Portfolio Management",
        expectedTopics: 5,
        topicPatterns: ["asset-allocation", "portfolio-rebalancing", "dollar-cost-averaging", "tax-efficiency", "monitoring-performance"]
      }
    ]
  },
  {
    domainId: "nutrition-fundamentals",
    domainName: "Nutrition Fundamentals",
    expectedTopics: 15,
    modules: [
      {
        moduleName: "Nutrients",
        expectedTopics: 5,
        topicPatterns: ["macronutrients", "micronutrients", "vitamins", "minerals", "fiber"]
      },
      {
        moduleName: "Diet Types",
        expectedTopics: 5,
        topicPatterns: ["balanced-diet", "vegetarian-diet", "mediterranean-diet", "ketogenic-diet", "plant-based-diet"]
      },
      {
        moduleName: "Applied Nutrition",
        expectedTopics: 5,
        topicPatterns: ["meal-planning", "caloric-balance", "hydration", "food-labels", "healthy-cooking"]
      }
    ]
  },
  {
    domainId: "home-decorating",
    domainName: "Home Decorating",
    expectedTopics: 15,
    modules: [
      {
        moduleName: "Design Basics",
        expectedTopics: 5,
        topicPatterns: ["design-principles", "color-theory", "space-planning", "lighting", "textures"]
      },
      {
        moduleName: "Room Planning",
        expectedTopics: 5,
        topicPatterns: ["living-room-design", "bedroom-design", "kitchen-design", "bathroom-design", "home-office-design"]
      },
      {
        moduleName: "Styling",
        expectedTopics: 5,
        topicPatterns: ["decor-styles", "furniture-selection", "accessories", "budget-planning", "diy-projects"]
      }
    ]
  }
];

/**
 * Get coverage template by domain ID
 */
export function getCoverageTemplate(domainId: string): CoverageTemplate | undefined {
  return COVERAGE_TEMPLATES.find(t => t.domainId === domainId);
}

/**
 * Get all coverage templates
 */
export function getAllCoverageTemplates(): CoverageTemplate[] {
  return COVERAGE_TEMPLATES;
}
