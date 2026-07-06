'use client';

import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';

interface Category {
  name: string;
  subcategories: Record<string, Subcategory>;
}

interface Subcategory {
  name: string;
  families: Record<string, Family>;
}

interface Family {
  name: string;
  detectionRules: string[];
  intent: string;
  editorialBlueprint: {
    requiredSections: string[];
    optionalSections: string[];
    forbiddenSections: string[];
    entityRules: string[];
    validationRules: string[];
  };
}

interface Registry {
  categories: Record<string, Category>;
}

export default function KeywordFamilyRegistry() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistry();
  }, []);

  const loadRegistry = async () => {
    try {
      const response = await fetch('/api/keyword-family-registry');
      const data = await response.json();
      setRegistry(data);
      if (Object.keys(data.categories).length > 0) {
        const firstCategory = Object.keys(data.categories)[0];
        setSelectedCategory(firstCategory);
        const firstSubcategory = Object.keys(data.categories[firstCategory].subcategories)[0];
        setSelectedSubcategory(firstSubcategory);
        const firstFamily = Object.keys(data.categories[firstCategory].subcategories[firstSubcategory].families)[0];
        setSelectedFamily(firstFamily);
      }
    } catch (error) {
      console.error('Failed to load registry:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading Keyword Family Registry...</div>;
  }

  if (!registry) {
    return <div className="p-8">Failed to load Keyword Family Registry</div>;
  }

  const currentCategory = selectedCategory ? registry.categories[selectedCategory] : null;
  const currentSubcategory = currentCategory && selectedSubcategory ? currentCategory.subcategories[selectedSubcategory] : null;
  const currentFamily = currentSubcategory && selectedFamily ? currentSubcategory.families[selectedFamily] : null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Keyword Family Registry</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="space-y-2">
            {Object.entries(registry.categories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key);
                  const firstSubcategory = Object.keys(category.subcategories)[0];
                  setSelectedSubcategory(firstSubcategory);
                  const firstFamily = Object.keys(category.subcategories[firstSubcategory].families)[0];
                  setSelectedFamily(firstFamily);
                }}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedCategory === key ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Subcategories</h2>
          <div className="space-y-2">
            {currentCategory && Object.entries(currentCategory.subcategories).map(([key, subcategory]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedSubcategory(key);
                  const firstFamily = Object.keys(subcategory.families)[0];
                  setSelectedFamily(firstFamily);
                }}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedSubcategory === key ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {subcategory.name}
              </button>
            ))}
          </div>
        </div>

        {/* Family Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Families</h2>
          <div className="space-y-2">
            {currentSubcategory && Object.entries(currentSubcategory.families).map(([key, family]) => (
              <button
                key={key}
                onClick={() => setSelectedFamily(key)}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedFamily === key ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>
        </div>

        {/* Family Details */}
        <div className="bg-white rounded-lg shadow p-6">
          {currentFamily && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{currentFamily.name}</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-600">Intent</h3>
                  <p className="text-sm">{currentFamily.intent}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600">Detection Rules</h3>
                  <ul className="text-sm list-disc list-inside">
                    {currentFamily.detectionRules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600">Required Sections</h3>
                  <ul className="text-sm list-disc list-inside">
                    {currentFamily.editorialBlueprint.requiredSections.map((section, idx) => (
                      <li key={idx}>{section}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600">Forbidden Sections</h3>
                  <ul className="text-sm list-disc list-inside">
                    {currentFamily.editorialBlueprint.forbiddenSections.map((section, idx) => (
                      <li key={idx}>{section}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600">Validation Rules</h3>
                  <ul className="text-sm list-disc list-inside">
                    {currentFamily.editorialBlueprint.validationRules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Registry Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {Object.keys(registry.categories).length}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600">
              {Object.values(registry.categories).reduce(
                (sum, cat) => sum + Object.keys(cat.subcategories).length,
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Subcategories</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">
              {Object.values(registry.categories).reduce(
                (sum, cat) =>
                  sum +
                  Object.values(cat.subcategories).reduce(
                    (subSum, subcat) => subSum + Object.keys(subcat.families).length,
                    0
                  ),
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Keyword Families</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {Object.values(registry.categories).reduce(
                (sum, cat) =>
                  sum +
                  Object.values(cat.subcategories).reduce(
                    (subSum, subcat) =>
                      subSum +
                      Object.values(subcat.families).reduce(
                        (famSum, fam) => famSum + fam.editorialBlueprint.requiredSections.length,
                        0
                      ),
                    0
                  ),
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Required Sections</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">
              {Object.values(registry.categories).reduce(
                (sum, cat) =>
                  sum +
                  Object.values(cat.subcategories).reduce(
                    (subSum, subcat) =>
                      subSum +
                      Object.values(subcat.families).reduce(
                        (famSum, fam) => famSum + fam.editorialBlueprint.validationRules.length,
                        0
                      ),
                    0
                  ),
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Validation Rules</div>
          </div>
        </div>
      </div>
    </div>
  );
}
