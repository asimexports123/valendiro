require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const subjectModels = require('../config/subject-models.json');
const keywordFamilyRegistry = require('../config/keyword-family-registry.json');

/**
 * Comprehensive audit of Subject Model detection pipeline
 * For each article, traces:
 * 1. Category detected
 * 2. Subcategory detected
 * 3. Keyword Family detected
 * 4. Subject Model selected (current logic)
 * 5. Why that Subject Model was selected
 * 6. Confidence score
 * 7. Competing Subject Models
 * 8. Final selection reason
 */

function detectKeywordFamily(slug, title) {
  const slugLower = slug.toLowerCase();
  const titleLower = title.toLowerCase();
  const combinedText = `${slugLower} ${titleLower}`;

  for (const [familyKey, family] of Object.entries(keywordFamilyRegistry.families)) {
    for (const rule of family.detectionRules) {
      const ruleLower = rule.toLowerCase();
      
      if (ruleLower.includes('slug contains:')) {
        const keywords = ruleLower.replace('slug contains:', '').trim().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (slugLower.includes(keyword)) {
            return {
              familyKey,
              family,
              matchedRule: rule,
              categoryName: family.categoryName,
              subcategoryName: family.subcategoryName
            };
          }
        }
      } else if (ruleLower.includes('title contains:')) {
        const keywords = ruleLower.replace('title contains:', '').trim().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (titleLower.includes(keyword)) {
            return {
              familyKey,
              family,
              matchedRule: rule,
              categoryName: family.categoryName,
              subcategoryName: family.subcategoryName
            };
          }
        }
      } else if (combinedText.includes(ruleLower)) {
        return {
          familyKey,
          family,
          matchedRule: rule,
          categoryName: family.categoryName,
          subcategoryName: family.subcategoryName
        };
      }
    }
  }

  return null;
}

function detectSubjectModelCurrent(slug, title) {
  const slugLower = slug.toLowerCase();
  const titleLower = title.toLowerCase();
  const combinedText = `${slugLower} ${titleLower}`;

  const candidates = [];

  for (const [subjectKey, model] of Object.entries(subjectModels.subjects)) {
    const matchedRules = [];
    let matchCount = 0;

    for (const rule of model.detectionRules) {
      const ruleLower = rule.toLowerCase();
      
      if (ruleLower.includes('slug contains:')) {
        const keywords = ruleLower.replace('slug contains:', '').trim().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (slugLower.includes(keyword)) {
            matchCount++;
            matchedRules.push(rule);
            break;
          }
        }
      } else if (ruleLower.includes('title contains:')) {
        const keywords = ruleLower.replace('title contains:', '').trim().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (titleLower.includes(keyword)) {
            matchCount++;
            matchedRules.push(rule);
            break;
          }
        }
      } else if (combinedText.includes(ruleLower)) {
        matchCount++;
        matchedRules.push(rule);
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(matchCount / model.detectionRules.length, 1.0);
      candidates.push({
        subjectKey,
        model,
        confidence,
        matchedRules,
        matchCount
      });
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  return {
    selected: candidates.length > 0 ? candidates[0] : null,
    competing: candidates.slice(1, 5) // Top 4 competing models
  };
}

function detectSubjectModelCorrect(slug, title, keywordFamily) {
  if (!keywordFamily) {
    return {
      selected: null,
      competing: [],
      reason: 'No keyword family detected - cannot determine Subject Model'
    };
  }

  const category = keywordFamily.categoryName;
  const subcategory = keywordFamily.subcategoryName;

  const candidates = [];

  for (const [subjectKey, model] of Object.entries(subjectModels.subjects)) {
    // First filter by category/subcategory match
    const categoryMatch = model.category === category;
    
    if (!categoryMatch) {
      continue; // Skip if category doesn't match
    }

    const slugLower = slug.toLowerCase();
    const titleLower = title.toLowerCase();
    const combinedText = `${slugLower} ${titleLower}`;

    const matchedRules = [];
    let matchCount = 0;

    for (const rule of model.detectionRules) {
      const ruleLower = rule.toLowerCase();
      
      if (ruleLower.includes('slug contains:')) {
        const keywords = ruleLower.replace('slug contains:', '').trim().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (slugLower.includes(keyword)) {
            matchCount++;
            matchedRules.push(rule);
            break;
          }
        }
      } else if (ruleLower.includes('title contains:')) {
        const keywords = ruleLower.replace('title contains:', '').trim().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (titleLower.includes(keyword)) {
            matchCount++;
            matchedRules.push(rule);
            break;
          }
        }
      } else if (combinedText.includes(ruleLower)) {
        matchCount++;
        matchedRules.push(rule);
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(matchCount / model.detectionRules.length, 1.0);
      candidates.push({
        subjectKey,
        model,
        confidence,
        matchedRules,
        matchCount,
        categoryMatch: true
      });
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  const selected = candidates.length > 0 ? candidates[0] : null;
  const competing = candidates.slice(1, 5);

  // Only select if confidence is high enough
  const MIN_CONFIDENCE = 0.3;
  if (selected && selected.confidence >= MIN_CONFIDENCE) {
    return {
      selected,
      competing,
      reason: `Category '${category}' and subcategory '${subcategory}' matched. Subject Model '${selected.model.name}' selected with ${Math.round(selected.confidence * 100)}% confidence based on ${selected.matchCount} matching rules.`
    };
  } else if (selected) {
    return {
      selected: null,
      competing,
      reason: `Category '${category}' and subcategory '${subcategory}' matched, but confidence too low (${Math.round(selected.confidence * 100)}%). Requires better mapping.`
    };
  } else {
    return {
      selected: null,
      competing,
      reason: `Category '${category}' and subcategory '${subcategory}' matched, but no Subject Model detection rules matched. Requires better mapping.`
    };
  }
}

async function auditAllTopics() {
  console.log('Fetching all published topics...');
  
  const { data: topics, error } = await sb
    .from('topics')
    .select(`
      id,
      slug,
      topic_translations!inner (title)
    `)
    .eq('status', 'published')
    .eq('topic_translations.language_code', 'en');

  if (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }

  // Flatten the nested topic_translations data
  const flattenedTopics = topics.map(t => ({
    id: t.id,
    slug: t.slug,
    title: t.topic_translations?.[0]?.title || ''
  }));

  console.log(`Found ${flattenedTopics.length} published topics`);
  console.log('Running detection audit...');

  const auditResults = [];

  for (const topic of flattenedTopics) {
    const keywordFamily = detectKeywordFamily(topic.slug, topic.title);
    const currentDetection = detectSubjectModelCurrent(topic.slug, topic.title);
    const correctDetection = detectSubjectModelCorrect(topic.slug, topic.title, keywordFamily);

    const auditEntry = {
      topicId: topic.id,
      slug: topic.slug,
      title: topic.title,
      url: `https://knowledge-os.com/topics/${topic.slug}`,
      keywordFamily: keywordFamily ? {
        key: keywordFamily.familyKey,
        name: keywordFamily.family.name,
        category: keywordFamily.categoryName,
        subcategory: keywordFamily.subcategoryName,
        matchedRule: keywordFamily.matchedRule
      } : null,
      currentDetection: {
        subjectKey: currentDetection.selected?.subjectKey || null,
        subjectModelName: currentDetection.selected?.model?.name || null,
        confidence: currentDetection.selected ? Math.round(currentDetection.selected.confidence * 100) : 0,
        matchedRules: currentDetection.selected?.matchedRules || [],
        matchCount: currentDetection.selected?.matchCount || 0,
        competingModels: currentDetection.competing.map(c => ({
          subjectKey: c.subjectKey,
          name: c.model.name,
          confidence: Math.round(c.confidence * 100)
        }))
      },
      correctDetection: {
        subjectKey: correctDetection.selected?.subjectKey || null,
        subjectModelName: correctDetection.selected?.model?.name || null,
        confidence: correctDetection.selected ? Math.round(correctDetection.selected.confidence * 100) : 0,
        matchedRules: correctDetection.selected?.matchedRules || [],
        matchCount: correctDetection.selected?.matchCount || 0,
        competingModels: correctDetection.competing.map(c => ({
          subjectKey: c.subjectKey,
          name: c.model.name,
          confidence: Math.round(c.confidence * 100)
        })),
        reason: correctDetection.reason
      },
      isCorrect: currentDetection.selected?.subjectKey === correctDetection.selected?.subjectKey,
      issue: !currentDetection.selected ? 'No Subject Model detected by current logic' :
              !correctDetection.selected ? 'No valid Subject Model (low confidence)' :
              currentDetection.selected?.subjectKey !== correctDetection.selected?.subjectKey ? 'Wrong Subject Model selected' :
              null
    };

    auditResults.push(auditEntry);

    if (auditEntry.issue) {
      console.log(`  ⚠ ${topic.slug}: ${auditEntry.issue}`);
    }
  }

  // Calculate statistics
  const total = auditResults.length;
  const correct = auditResults.filter(r => r.isCorrect).length;
  const incorrect = auditResults.filter(r => r.issue && !r.issue.includes('No valid Subject Model')).length;
  const unmapped = auditResults.filter(r => !r.correctDetection.selected).length;
  const noKeywordFamily = auditResults.filter(r => !r.keywordFamily).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const statistics = {
    totalArticlesAudited: total,
    correctMappings: correct,
    incorrectMappings: incorrect,
    unmappedArticles: unmapped,
    articlesWithoutKeywordFamily: noKeywordFamily,
    mappingAccuracy: accuracy,
    timestamp: new Date().toISOString()
  };

  // Save detailed audit results
  const outputPath = path.join(__dirname, '../data/subject-model-detection-audit.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    statistics,
    results: auditResults
  }, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('AUDIT RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Articles Audited: ${total}`);
  console.log(`Correct Mappings: ${correct}`);
  console.log(`Incorrect Mappings: ${incorrect}`);
  console.log(`Unmapped Articles: ${unmapped}`);
  console.log(`Articles Without Keyword Family: ${noKeywordFamily}`);
  console.log(`Mapping Accuracy: ${accuracy}%`);
  console.log(`\nDetailed audit saved to: ${outputPath}`);

  // Show root cause analysis
  console.log('\n' + '='.repeat(80));
  console.log('ROOT CAUSE ANALYSIS');
  console.log('='.repeat(80));

  const incorrectEntries = auditResults.filter(r => r.issue && !r.issue.includes('No valid Subject Model'));
  if (incorrectEntries.length > 0) {
    console.log(`\nIncorrect Mappings (${incorrectEntries.length}):`);
    incorrectEntries.slice(0, 10).forEach(entry => {
      console.log(`\n  ${entry.slug}`);
      console.log(`    Keyword Family: ${entry.keywordFamily?.name || 'None'} (${entry.keywordFamily?.category || 'N/A'})`);
      console.log(`    Current (WRONG): ${entry.currentDetection.subjectModelName} (${entry.currentDetection.confidence}%)`);
      console.log(`    Correct: ${entry.correctDetection.subjectModelName || 'None'}`);
      console.log(`    Reason: ${entry.correctDetection.reason}`);
    });
    if (incorrectEntries.length > 10) {
      console.log(`  ... and ${incorrectEntries.length - 10} more`);
    }
  }

  const unmappedEntries = auditResults.filter(r => !r.correctDetection.selected);
  if (unmappedEntries.length > 0) {
    console.log(`\nUnmapped Articles (${unmappedEntries.length}):`);
    unmappedEntries.slice(0, 10).forEach(entry => {
      console.log(`\n  ${entry.slug}`);
      console.log(`    Keyword Family: ${entry.keywordFamily?.name || 'None'} (${entry.keywordFamily?.category || 'N/A'})`);
      console.log(`    Reason: ${entry.correctDetection.reason}`);
    });
    if (unmappedEntries.length > 10) {
      console.log(`  ... and ${unmappedEntries.length - 10} more`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('ROOT CAUSE');
  console.log('='.repeat(80));
  console.log('The current Subject Model detection logic:');
  console.log('1. Only checks slug and title against detection rules');
  console.log('2. Does NOT consider Category, Subcategory, or Keyword Family');
  console.log('3. Uses simple keyword matching that can match wrong models');
  console.log('4. No minimum confidence threshold');
  console.log('5. Returns best match regardless of how weak');
  console.log('\nThis leads to incorrect mappings when:');
  console.log('- Detection rules contain overlapping keywords');
  console.log('- Articles have generic keywords that match multiple models');
  console.log('- Category/subcategory context is ignored');

  return statistics;
}

auditAllTopics().catch(console.error);
