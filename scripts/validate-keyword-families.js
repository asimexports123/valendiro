require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Load Keyword Family Registry ─────────────────────────────────────────

const registry = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/keyword-family-registry.json'), 'utf8')
);

// ─── Keyword Family Detection ─────────────────────────────────────────────

function detectKeywordFamily(slug, title) {
  const slugLower = slug.toLowerCase();
  const titleLower = title.toLowerCase();
  const combinedText = `${slugLower} ${titleLower}`;
  const familyScores = {};
  
  for (const [categoryKey, category] of Object.entries(registry.categories)) {
    for (const [familyKey, family] of Object.entries(category.families)) {
      let score = 0;
      
      for (const rule of family.detectionRules) {
        const keywords = rule
          .replace('slug contains:', '')
          .replace('title contains:', '')
          .split(',')
          .map(k => k.trim().toLowerCase())
          .filter(k => k.length > 0);
        
        for (const keyword of keywords) {
          if (combinedText.includes(keyword)) {
            score += 2;
          }
        }
      }
      
      familyScores[familyKey] = {
        score,
        category: categoryKey,
        family: family,
        familyKey
      };
    }
  }
  
  // Find best match
  let bestFamily = null;
  let bestScore = 0;
  for (const [familyKey, data] of Object.entries(familyScores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestFamily = data;
    }
  }
  
  // Default to tutorial if no match
  return bestFamily || { familyKey: 'tutorial', category: 'technology', family: registry.categories.technology.families.tutorial };
}

// ─── Validate Article Against Blueprint ─────────────────────────────────

function validateArticleBlueprint(content, family) {
  const blueprint = family.family.editorialBlueprint;
  const contentLower = content.toLowerCase();
  const violations = [];
  const missingSections = [];
  
  // Check required sections
  for (const section of blueprint.requiredSections) {
    if (!contentLower.includes(section.toLowerCase())) {
      violations.push(`Missing required section: ${section}`);
      missingSections.push(section);
    }
  }
  
  // Check forbidden sections
  for (const section of blueprint.forbiddenSections) {
    if (contentLower.includes(section.toLowerCase())) {
      violations.push(`Contains forbidden section: ${section}`);
    }
  }
  
  // Check entity rules
  for (const rule of blueprint.entityRules) {
    if (rule.includes('Must include')) {
      const keyword = rule.replace('Must include', '').trim().toLowerCase();
      if (!contentLower.includes(keyword)) {
        violations.push(`Entity rule violation: ${rule}`);
      }
    }
  }
  
  // Calculate score
  const totalRules = blueprint.requiredSections.length + blueprint.forbiddenSections.length + blueprint.entityRules.length;
  const passedRules = totalRules - violations.length;
  const score = Math.max(0, Math.min(100, (passedRules / totalRules) * 100));
  
  return {
    passed: violations.length === 0,
    score: Math.round(score),
    violations,
    missingSections,
    familyName: family.family.name,
    categoryName: registry.categories[family.category].name
  };
}

// ─── Validate Articles per Family ───────────────────────────────────────

async function validateArticlesPerFamily(count) {
  console.log('=== Keyword Family Registry Validation ===\n');
  
  // Get published topics
  const { data: allTopics } = await sb
    .from('topics')
    .select('id, slug, title')
    .limit(500);
  
  console.log(`Found ${allTopics?.length || 0} published topics\n`);
  
  // Group topics by detected family
  const familyGroups = {};
  for (const topic of allTopics || []) {
    const family = detectKeywordFamily(topic.slug, topic.title || topic.slug);
    const key = `${family.category}-${family.familyKey}`;
    
    if (!familyGroups[key]) {
      familyGroups[key] = {
        category: family.category,
        familyKey: family.familyKey,
        familyName: family.family.name,
        categoryName: registry.categories[family.category].name,
        topics: []
      };
    }
    
    familyGroups[key].topics.push(topic);
  }
  
  console.log(`Found ${Object.keys(familyGroups).length} keyword families\n`);
  
  // Validate articles per family
  const results = [];
  const familyStats = {};
  
  for (const [key, group] of Object.entries(familyGroups)) {
    // Select random topics from this family
    const shuffled = group.topics.sort(() => 0.5 - Math.random());
    const selectedTopics = shuffled.slice(0, Math.min(count, group.topics.length));
    
    if (selectedTopics.length === 0) continue;
    
    console.log(`=== ${group.categoryName} - ${group.familyName} ===`);
    console.log(`Validating ${selectedTopics.length} articles...\n`);
    
    let passed = 0;
    let failed = 0;
    const scores = [];
    
    for (const topic of selectedTopics) {
      const { data: translation } = await sb
        .from('topic_translations')
        .select('content')
        .eq('topic_id', topic.id)
        .eq('language_code', 'en')
        .maybeSingle();
      
      if (translation && translation.content) {
        const result = validateArticleBlueprint(translation.content, {
          familyKey: group.familyKey,
          category: group.category,
          family: registry.categories[group.category].families[group.familyKey]
        });
        
        results.push({
          slug: topic.slug,
          ...result,
          familyKey: group.familyKey,
          categoryName: group.categoryName,
          familyName: group.familyName
        });
        
        if (result.passed) {
          passed++;
          console.log(`  ✓ ${topic.slug}: ${result.score}/100`);
        } else {
          failed++;
          console.log(`  ✗ ${topic.slug}: ${result.score}/100 (${result.violations.length} violations)`);
        }
        
        scores.push(result.score);
      }
    }
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const passRate = ((passed / (passed + failed)) * 100).toFixed(1);
    
    familyStats[key] = {
      categoryName: group.categoryName,
      familyName: group.familyName,
      passed,
      failed,
      avgScore: avgScore.toFixed(1),
      passRate
    };
    
    console.log(`  Pass Rate: ${passRate}%, Avg Score: ${avgScore.toFixed(1)}\n`);
  }
  
  // Overall statistics
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const overallPassRate = ((totalPassed / results.length) * 100).toFixed(1);
  
  console.log('=== Overall Results ===');
  console.log(`Total Validated: ${results.length}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Pass Rate: ${overallPassRate}%`);
  console.log(`Average Score: ${avgScore.toFixed(1)}`);
  
  // Show sample failures
  const failures = results.filter(r => !r.passed).slice(0, 5);
  if (failures.length > 0) {
    console.log(`\n=== Sample Failures ===`);
    for (const failure of failures) {
      console.log(`${failure.slug} (${failure.familyName}): ${failure.violations.length} violations`);
      for (const violation of failure.violations.slice(0, 3)) {
        console.log(`  - ${violation}`);
      }
    }
  }
  
  return {
    familiesValidated: Object.keys(familyStats).length,
    articlesValidated: results.length,
    articlesPassed: totalPassed,
    articlesFailed: totalFailed,
    validationScore: avgScore.toFixed(1),
    familyStats,
    failures
  };
}

// ─── Main Validation ─────────────────────────────────────────────────────

async function main() {
  const result = await validateArticlesPerFamily(10);
  
  console.log(`\n=== Validation Summary ===`);
  console.log(`Families Validated: ${result.familiesValidated}`);
  console.log(`Articles Validated: ${result.articlesValidated}`);
  console.log(`Articles Passed: ${result.articlesPassed}`);
  console.log(`Articles Failed: ${result.articlesFailed}`);
  console.log(`Validation Score: ${result.validationScore}`);
  
  const productionReady = parseFloat(result.validationScore) >= 80 && result.articlesFailed === 0;
  console.log(`Production Ready: ${productionReady ? 'YES' : 'NO'}`);
  
  if (productionReady) {
    console.log('\n✓ Keyword Family Registry validation PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ Keyword Family Registry validation FAILED');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
