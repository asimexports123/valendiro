require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Load SME Profiles ─────────────────────────────────────────────────────

const smeProfiles = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/sme-profiles.json'), 'utf8')
);

// ─── Domain Detection ─────────────────────────────────────────────────────

function detectDomain(content, slug) {
  const contentLower = content.toLowerCase();
  const slugLower = slug.toLowerCase();
  const domainScores = {};
  
  for (const [domainKey, profile] of Object.entries(smeProfiles.domains)) {
    let score = 0;
    for (const term of profile.mandatoryTerminology) {
      if (contentLower.includes(term.toLowerCase()) || slugLower.includes(term.toLowerCase())) {
        score += 2;
      }
    }
    domainScores[domainKey] = score;
  }
  
  let bestDomain = 'cloud-computing';
  let bestScore = 0;
  for (const [domainKey, score] of Object.entries(domainScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domainKey;
    }
  }
  
  return bestDomain;
}

// ─── SME Validation Logic ───────────────────────────────────────────────

function validateSME(content, slug) {
  const domain = detectDomain(content, slug);
  const profile = smeProfiles.domains[domain];
  const contentLower = content.toLowerCase();
  
  const violations = [];
  const missingElements = [];
  
  // Check mandatory concepts
  let conceptScore = 0;
  for (const concept of profile.mandatoryConcepts) {
    if (contentLower.includes(concept.toLowerCase())) {
      conceptScore++;
    }
  }
  if (conceptScore < profile.mandatoryConcepts.length * 0.5) {
    violations.push(`Insufficient mandatory concepts (${conceptScore}/${profile.mandatoryConcepts.length})`);
    missingElements.push(...profile.mandatoryConcepts.slice(conceptScore));
  }
  
  // Check mandatory terminology
  let terminologyScore = 0;
  for (const term of profile.mandatoryTerminology) {
    if (contentLower.includes(term.toLowerCase())) {
      terminologyScore++;
    }
  }
  if (terminologyScore < profile.mandatoryTerminology.length * 0.5) {
    violations.push(`Insufficient mandatory terminology (${terminologyScore}/${profile.mandatoryTerminology.length})`);
  }
  
  // Check mandatory entities
  let entityScore = 0;
  for (const entity of profile.mandatoryEntities) {
    if (contentLower.includes(entity.toLowerCase())) {
      entityScore++;
    }
  }
  if (entityScore < profile.mandatoryEntities.length * 0.3) {
    violations.push(`Insufficient mandatory entities (${entityScore}/${profile.mandatoryEntities.length})`);
  }
  
  // Check rejection rules
  for (const rule of profile.rejectionRules) {
    if (rule.includes('Must contain')) {
      const requiredElement = rule.replace('Must contain ', '').toLowerCase();
      if (!contentLower.includes(requiredElement)) {
        violations.push(rule);
        missingElements.push(requiredElement);
      }
    }
  }
  
  // Check forbidden generic wording
  for (const forbidden of profile.forbiddenGenericWording) {
    if (contentLower.includes(forbidden.toLowerCase())) {
      violations.push(`Contains forbidden generic wording: ${forbidden}`);
    }
  }
  
  // Check forbidden generic sections
  for (const forbidden of profile.forbiddenGenericSections) {
    if (contentLower.includes(forbidden.toLowerCase())) {
      violations.push(`Contains forbidden generic section: ${forbidden}`);
    }
  }
  
  // Calculate score
  const totalChecks = profile.mandatoryConcepts.length + profile.mandatoryTerminology.length + profile.mandatoryEntities.length;
  const passedChecks = conceptScore + terminologyScore + entityScore - violations.length;
  const score = Math.max(0, Math.min(100, (passedChecks / totalChecks) * 100));
  
  const passed = violations.length === 0 && score >= 70;
  
  return {
    passed,
    score: Math.round(score),
    violations,
    missingElements,
    domain,
    expertProfile: profile.name
  };
}

// ─── Validate Random Articles ───────────────────────────────────────────

async function validateRandomArticles(count) {
  console.log('=== SME Layer Validation ===\n');
  
  // Get published topics
  const { data: allTopics } = await sb
    .from('topics')
    .select('id, slug')
    .eq('status', 'published')
    .limit(500);
  
  // Select random topics
  const shuffled = allTopics.sort(() => 0.5 - Math.random());
  const selectedTopics = shuffled.slice(0, count);
  
  console.log(`Validating ${selectedTopics.length} random articles...\n`);
  
  const results = [];
  const domainResults = {};
  
  for (const topic of selectedTopics) {
    // Get content
    const { data: translation } = await sb
      .from('topic_translations')
      .select('content')
      .eq('topic_id', topic.id)
      .eq('language_code', 'en')
      .maybeSingle();
    
    if (translation && translation.content) {
      const result = validateSME(translation.content, topic.slug);
      results.push({
        slug: topic.slug,
        ...result
      });
      
      // Track domain results
      if (!domainResults[result.domain]) {
        domainResults[result.domain] = { passed: 0, failed: 0, scores: [] };
      }
      if (result.passed) {
        domainResults[result.domain].passed++;
      } else {
        domainResults[result.domain].failed++;
      }
      domainResults[result.domain].scores.push(result.score);
    }
  }
  
  // Calculate domain statistics
  const domainStats = [];
  for (const [domain, stats] of Object.entries(domainResults)) {
    const avgScore = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length;
    domainStats.push({
      domain,
      passed: stats.passed,
      failed: stats.failed,
      avgScore: avgScore.toFixed(1),
      passRate: ((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(1)
    });
  }
  
  // Overall statistics
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const overallPassRate = ((totalPassed / results.length) * 100).toFixed(1);
  
  // Print results
  console.log('=== Domain Results ===');
  for (const stat of domainStats) {
    console.log(`${stat.domain}: ${stat.passed} passed, ${stat.failed} failed (${stat.passRate}% pass rate, avg score: ${stat.avgScore})`);
  }
  
  console.log(`\n=== Overall Results ===`);
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
      console.log(`${failure.slug} (${failure.domain}): ${failure.violations.length} violations`);
      for (const violation of failure.violations.slice(0, 3)) {
        console.log(`  - ${violation}`);
      }
    }
  }
  
  // Determine if domains feel generic
  const genericDomains = domainStats.filter(s => parseFloat(s.passRate) < 70 || parseFloat(s.avgScore) < 70);
  const validationScore = avgScore;
  const productionReady = parseFloat(overallPassRate) >= 80 && genericDomains.length === 0;
  
  return {
    domainsPassed: domainStats.filter(s => parseFloat(s.passRate) >= 80).length,
    domainsFailed: genericDomains.length,
    validationScore: validationScore.toFixed(1),
    productionReady,
    domainStats
  };
}

// ─── Main Validation ─────────────────────────────────────────────────────

async function main() {
  const result = await validateRandomArticles(100);
  
  console.log(`\n=== Validation Summary ===`);
  console.log(`Domains Passed: ${result.domainsPassed}`);
  console.log(`Domains Failed: ${result.domainsFailed}`);
  console.log(`Validation Score: ${result.validationScore}`);
  console.log(`Production Ready: ${result.productionReady ? 'YES' : 'NO'}`);
  
  if (result.productionReady) {
    console.log('\n✓ SME Layer validation PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ SME Layer validation FAILED');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
