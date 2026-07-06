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
    for (const [subcategoryKey, subcategory] of Object.entries(category.subcategories)) {
      for (const [familyKey, family] of Object.entries(subcategory.families)) {
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
          subcategory: subcategoryKey,
          family: family,
          familyKey
        };
      }
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
  
  // Default to framework-tutorial if no match
  return bestFamily || {
    familyKey: 'framework-tutorial',
    category: 'technology',
    subcategory: 'programming',
    family: registry.categories.technology.subcategories.programming.families['framework-tutorial']
  };
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
    categoryName: registry.categories[family.category].name,
    subcategoryName: registry.categories[family.category].subcategories[family.subcategory].name
  };
}

// ─── Build Migration Queue ───────────────────────────────────────────────

async function buildMigrationQueue() {
  console.log('=== Building Incremental Migration Queue ===\n');
  
  // Get all published topics
  const { data: allTopics } = await sb
    .from('topics')
    .select('id, slug')
    .eq('status', 'published')
    .limit(1000);
  
  console.log(`Found ${allTopics?.length || 0} published topics\n`);
  
  const migrationQueue = [];
  const compliantArticles = [];
  const familyStats = {};
  
  for (const topic of allTopics || []) {
    const family = detectKeywordFamily(topic.slug, topic.slug);
    
    // Get article content
    const { data: translation } = await sb
      .from('topic_translations')
      .select('content')
      .eq('topic_id', topic.id)
      .eq('language_code', 'en')
      .maybeSingle();
    
    if (translation && translation.content) {
      const validationResult = validateArticleBlueprint(translation.content, family);
      
      const articleData = {
        topicId: topic.id,
        slug: topic.slug,
        category: family.category,
        subcategory: family.subcategory,
        familyKey: family.familyKey,
        familyName: validationResult.familyName,
        categoryName: validationResult.categoryName,
        subcategoryName: validationResult.subcategoryName,
        currentScore: validationResult.score,
        violations: validationResult.violations,
        missingSections: validationResult.missingSections,
        needsMigration: !validationResult.passed
      };
      
      if (!validationResult.passed) {
        migrationQueue.push(articleData);
      } else {
        compliantArticles.push(articleData);
      }
      
      // Track family statistics
      const familyKey = `${family.category}-${family.subcategory}-${family.familyKey}`;
      if (!familyStats[familyKey]) {
        familyStats[familyKey] = {
          categoryName: validationResult.categoryName,
          subcategoryName: validationResult.subcategoryName,
          familyName: validationResult.familyName,
          total: 0,
          passed: 0,
          failed: 0
        };
      }
      familyStats[familyKey].total++;
      if (validationResult.passed) {
        familyStats[familyKey].passed++;
      } else {
        familyStats[familyKey].failed++;
      }
    }
  }
  
  // Calculate statistics
  const totalArticles = migrationQueue.length + compliantArticles.length;
  const complianceRate = totalArticles > 0 ? ((compliantArticles.length / totalArticles) * 100).toFixed(1) : 0;
  const avgScore = migrationQueue.length > 0 
    ? (migrationQueue.reduce((sum, a) => sum + a.currentScore, 0) / migrationQueue.length).toFixed(1)
    : 0;
  
  // Save migration queue
  const queueData = {
    generatedAt: new Date().toISOString(),
    statistics: {
      totalPublishedTopics: totalArticles,
      compliantArticles: compliantArticles.length,
      articlesNeedingMigration: migrationQueue.length,
      complianceRate: parseFloat(complianceRate),
      averageScore: parseFloat(avgScore)
    },
    familyStats,
    migrationQueue
  };
  
  const outputPath = path.join(__dirname, '../data/migration-queue.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(queueData, null, 2));
  
  console.log('=== Migration Queue Statistics ===');
  console.log(`Total Published Topics: ${totalArticles}`);
  console.log(`Compliant Articles: ${compliantArticles.length}`);
  console.log(`Articles Needing Migration: ${migrationQueue.length}`);
  console.log(`Compliance Rate: ${complianceRate}%`);
  console.log(`Average Score (Failed Articles): ${avgScore}`);
  console.log(`\nQueue saved to: ${outputPath}`);
  
  // Show family breakdown
  console.log('\n=== Family Breakdown ===');
  for (const [key, stats] of Object.entries(familyStats)) {
    const familyRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${stats.categoryName} > ${stats.subcategoryName} > ${stats.familyName}: ${stats.passed}/${stats.total} (${familyRate}%)`);
  }
  
  return queueData;
}

buildMigrationQueue().then(result => {
  console.log('\n✓ Migration queue built successfully');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
