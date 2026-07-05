require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Load Domain Playbooks ─────────────────────────────────────────────────

const domainPlaybooks = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/domain-playbooks.json'), 'utf8')
);

// ─── Calculate Section Similarity ───────────────────────────────────────

function calculateSimilarity(sections1, sections2) {
  const set1 = new Set(sections1.map(s => s.toLowerCase()));
  const set2 = new Set(sections2.map(s => s.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const similarity = (intersection.size / union.size) * 100;
  return similarity;
}

// ─── Validate Section Similarity Across Domains ───────────────────────

function validateSectionSimilarity() {
  const domains = Object.keys(domainPlaybooks.domains);
  const comparisons = [];
  let maxSimilarity = 0;
  let worstPair = null;
  
  console.log('=== Section Similarity Validation ===\n');
  
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const domain1 = domains[i];
      const domain2 = domains[j];
      
      const sections1 = domainPlaybooks.domains[domain1].requiredSections;
      const sections2 = domainPlaybooks.domains[domain2].requiredSections;
      
      const similarity = calculateSimilarity(sections1, sections2);
      
      comparisons.push({
        pair: `${domain1} vs ${domain2}`,
        similarity: similarity.toFixed(1),
        passed: similarity < 30
      });
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        worstPair = `${domain1} vs ${domain2}`;
      }
      
      if (similarity >= 30) {
        console.log(`✗ ${domain1} vs ${domain2}: ${similarity.toFixed(1)}% similarity (FAILED)`);
        console.log(`  ${domain1} sections: ${sections1.join(', ')}`);
        console.log(`  ${domain2} sections: ${sections2.join(', ')}`);
      } else {
        console.log(`✓ ${domain1} vs ${domain2}: ${similarity.toFixed(1)}% similarity (PASSED)`);
      }
    }
  }
  
  const passedCount = comparisons.filter(c => c.passed).length;
  const totalCount = comparisons.length;
  const passRate = ((passedCount / totalCount) * 100).toFixed(1);
  const averageSimilarity = (comparisons.reduce((sum, c) => sum + parseFloat(c.similarity), 0) / totalCount).toFixed(1);
  
  console.log(`\n=== Validation Summary ===`);
  console.log(`Total Comparisons: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`Average Similarity: ${averageSimilarity}%`);
  console.log(`Maximum Similarity: ${maxSimilarity.toFixed(1)}% (${worstPair})`);
  
  return {
    passed: parseFloat(passRate) === 100,
    averageSimilarity: parseFloat(averageSimilarity),
    maxSimilarity: maxSimilarity,
    worstPair,
    comparisons
  };
}

// ─── Main Validation ───────────────────────────────────────────────────

async function main() {
  const result = validateSectionSimilarity();
  
  if (result.passed) {
    console.log(`\n✓ Section similarity validation PASSED`);
    process.exit(0);
  } else {
    console.log(`\n✗ Section similarity validation FAILED`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
