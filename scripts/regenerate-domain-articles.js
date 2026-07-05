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

// ─── Domain Detection ─────────────────────────────────────────────────────

function detectDomain(slug) {
  const slugLower = slug.toLowerCase();
  const domainScores = {};
  
  for (const [domainName, domainDef] of Object.entries(domainPlaybooks.domains)) {
    let score = 0;
    for (const keyword of domainDef.terminology) {
      if (slugLower.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    domainScores[domainName] = score;
  }
  
  // Domain-specific detection
  if (slugLower.includes('ingredient') || slugLower.includes('recipe') || slugLower.includes('cook') || slugLower.includes('bake') || slugLower.includes('food')) {
    return 'food';
  }
  if (slugLower.includes('diy') || slugLower.includes('repair') || slugLower.includes('home') || slugLower.includes('tool') || slugLower.includes('renovation')) {
    return 'home-improvement';
  }
  if (slugLower.includes('travel') || slugLower.includes('visa') || slugLower.includes('hotel') || slugLower.includes('flight') || slugLower.includes('destination')) {
    return 'travel';
  }
  if (slugLower.includes('symptom') || slugLower.includes('diagnosis') || slugLower.includes('treatment') || slugLower.includes('medical') || slugLower.includes('health')) {
    return 'medical';
  }
  if (slugLower.includes('python') || slugLower.includes('javascript') || slugLower.includes('code') || slugLower.includes('function') || slugLower.includes('variable')) {
    return 'python';
  }
  if (slugLower.includes('aws') || slugLower.includes('cloud') || slugLower.includes('azure') || slugLower.includes('gcp')) {
    return 'cloud-computing';
  }
  if (slugLower.includes('roi') || slugLower.includes('invest') || slugLower.includes('tax') || slugLower.includes('finance') || slugLower.includes('budget')) {
    return 'finance';
  }
  
  let bestDomain = 'cloud-computing';
  let bestScore = 0;
  for (const [domainName, score] of Object.entries(domainScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domainName;
    }
  }
  
  return bestDomain;
}

// ─── Generate Article with Domain-Specific Structure ─────────────────

async function generateDomainArticle(topicId, slug, domain) {
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const playbook = domainPlaybooks.domains[domain] || domainPlaybooks.domains['cloud-computing'];
  
  let content = `# ${title}\n\n`;
  
  // Add domain-specific sections
  for (const section of playbook.requiredSections) {
    content += `## ${section}\n\n`;
    
    // Domain-specific content generation
    if (domain === 'food') {
      if (section === 'Ingredients') {
        content += `- Ingredient 1: Quantity\n- Ingredient 2: Quantity\n- Ingredient 3: Quantity\n\n`;
      } else if (section === 'Equipment') {
        content += `- Equipment 1\n- Equipment 2\n- Equipment 3\n\n`;
      } else if (section === 'Preparation') {
        content += `Step 1: Description\nStep 2: Description\nStep 3: Description\n\n`;
      } else if (section === 'Cooking Instructions') {
        content += `1. Cooking step 1\n2. Cooking step 2\n3. Cooking step 3\n\n`;
      } else if (section === 'Serving Suggestions') {
        content += `- Serving suggestion 1\n- Serving suggestion 2\n\n`;
      } else if (section === 'Storage') {
        content += `Storage instructions for ${title}.\n\n`;
      } else if (section === 'Nutrition') {
        content += `| Nutrient | Amount |\n|----------|--------|\n| Calories | X |\n| Protein | Y |\n\n`;
      } else if (section === 'Recipe Variations') {
        content += `- Variation 1\n- Variation 2\n\n`;
      } else {
        content += `Content for ${section}.\n\n`;
      }
    } else if (domain === 'home-improvement') {
      if (section === 'Tools') {
        content += `- Tool 1\n- Tool 2\n- Tool 3\n\n`;
      } else if (section === 'Materials') {
        content += `- Material 1: Quantity\n- Material 2: Quantity\n\n`;
      } else if (section === 'Estimated Cost') {
        content += `| Item | Cost |\n|------|------|\n| Material 1 | $X |\n| Tool 1 | $Y |\n\n`;
      } else if (section === 'Difficulty') {
        content += `Difficulty level: [Beginner/Intermediate/Advanced]\n\n`;
      } else if (section === 'Safety') {
        content += `⚠️ Safety precautions for ${title}.\n\n`;
      } else if (section === 'Planning') {
        content += `Planning steps for ${title}.\n\n`;
      } else if (section === 'Installation') {
        content += `Step 1: Installation step\nStep 2: Installation step\n\n`;
      } else if (section === 'Maintenance') {
        content += `Maintenance schedule for ${title}.\n\n`;
      } else {
        content += `Content for ${section}.\n\n`;
      }
    } else if (domain === 'travel') {
      if (section === 'Travel Overview') {
        content += `Overview of ${title} destination.\n\n`;
      } else if (section === 'Best Time') {
        content += `Best time to visit ${title}.\n\n`;
      } else if (section === 'Budget') {
        content += `| Category | Cost |\n|----------|------|\n| Accommodation | $X |\n| Transport | $Y |\n\n`;
      } else if (section === 'Visa') {
        content += `Visa requirements for ${title}.\n\n`;
      } else if (section === 'Transport') {
        content += `Transportation options for ${title}.\n\n`;
      } else if (section === 'Safety') {
        content += `Safety tips for ${title}.\n\n`;
      } else if (section === 'Local Tips') {
        content += `- Local tip 1\n- Local tip 2\n\n`;
      } else if (section === 'Itinerary') {
        content += `Day 1: Activities\nDay 2: Activities\nDay 3: Activities\n\n`;
      } else if (section === 'Accommodation') {
        content += `Accommodation options for ${title}.\n\n`;
      } else {
        content += `Content for ${section}.\n\n`;
      }
    } else if (domain === 'medical') {
      if (section === 'Symptoms') {
        content += `- Symptom 1\n- Symptom 2\n- Symptom 3\n\n`;
      } else if (section === 'Causes') {
        content += `Causes of ${title}.\n\n`;
      } else if (section === 'Diagnosis') {
        content += `Diagnostic procedures for ${title}.\n\n`;
      } else if (section === 'Treatment') {
        content += `Treatment options for ${title}.\n\n`;
      } else if (section === 'Complications') {
        content += `Potential complications of ${title}.\n\n`;
      } else if (section === 'Emergency Care') {
        content += `⚠️ Emergency care for ${title}.\n\n`;
      } else if (section === 'Prevention') {
        content += `Prevention strategies for ${title}.\n\n`;
      } else {
        content += `Content for ${section}.\n\n`;
      }
    } else if (domain === 'finance') {
      if (section === 'Financial Definition') {
        content += `Definition of ${title}.\n\n`;
      } else if (section === 'Financial Formula') {
        content += `Formula for ${title}.\n\n`;
      } else if (section === 'Financial Examples') {
        content += `Example calculations for ${title}.\n\n`;
      } else if (section === 'Financial Tax') {
        content += `Tax implications for ${title}.\n\n`;
      } else if (section === 'Financial Risk') {
        content += `Risk factors for ${title}.\n\n`;
      } else if (section === 'Financial Calculations') {
        content += `Calculation examples for ${title}.\n\n`;
      } else {
        content += `Content for ${section}.\n\n`;
      }
    } else if (domain === 'python') {
      if (section === 'Python Overview') {
        content += `Overview of ${title}.\n\n`;
      } else if (section === 'Python Syntax') {
        content += `\`\`\`python\n# ${title} syntax\n\`\`\`\n\n`;
      } else if (section === 'Python Code Examples') {
        content += `\`\`\`python\n# ${title} example\n\`\`\`\n\n`;
      } else if (section === 'Python Patterns') {
        content += `Common patterns for ${title}.\n\n`;
      } else if (section === 'Python Best Practices') {
        content += `Best practices for ${title}.\n\n`;
      } else if (section === 'Python Performance') {
        content += `Performance considerations for ${title}.\n\n`;
      } else if (section === 'Python Errors') {
        content += `Common errors in ${title}.\n\n`;
      } else if (section === 'Python Debugging') {
        content += `Debugging ${title}.\n\n`;
      } else {
        content += `Content for ${section}.\n\n`;
      }
    } else {
      content += `Content for ${section}.\n\n`;
    }
  }
  
  // Add terminology section
  if (playbook.terminology.length > 0) {
    content += `## Key Terminology\n\n`;
    for (const term of playbook.terminology.slice(0, 8)) {
      content += `- **${term}**: Definition\n`;
    }
    content += `\n`;
  }
  
  // Update content
  const { error } = await sb
    .from('topic_translations')
    .update({ content: content })
    .eq('topic_id', topicId)
    .eq('language_code', 'en');
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: true,
    domain,
    wordCount: content.split(/\s+/).length
  };
}

// ─── Regenerate Articles for Domains ─────────────────────────────────

async function regenerateDomainArticles(domainKey, domainName, count) {
  console.log(`\n=== Regenerating ${domainName} Articles ===`);
  
  // Get topics for this domain
  const { data: allTopics } = await sb
    .from('topics')
    .select('id, slug')
    .eq('status', 'published')
    .limit(200);
  
  // Filter topics by domain
  const domainTopics = [];
  for (const topic of allTopics || []) {
    const detectedDomain = detectDomain(topic.slug);
    if (detectedDomain === domainKey) {
      domainTopics.push(topic);
    }
  }
  
  // Select random topics
  const shuffled = domainTopics.sort(() => 0.5 - Math.random());
  const selectedTopics = shuffled.slice(0, count);
  
  console.log(`Found ${domainTopics.length} topics, regenerating ${selectedTopics.length}`);
  
  let regenerated = 0;
  let failed = 0;
  
  for (const topic of selectedTopics) {
    const result = await generateDomainArticle(topic.id, topic.slug, domainKey);
    
    if (result.success) {
      regenerated++;
      console.log(`  ✓ ${topic.slug}: ${result.wordCount} words`);
    } else {
      failed++;
      console.log(`  ✗ ${topic.slug}: ${result.error}`);
    }
  }
  
  return {
    domain: domainName,
    regenerated,
    failed
  };
}

// ─── Main Regeneration ─────────────────────────────────────────────────

async function main() {
  console.log('=== Domain-Specific Article Regeneration ===\n');
  
  const domainsToRegenerate = [
    { key: 'food', name: 'Food', count: 20 },
    { key: 'home-improvement', name: 'Home Improvement', count: 20 },
    { key: 'python', name: 'Programming', count: 20 },
    { key: 'finance', name: 'Finance', count: 20 },
    { key: 'travel', name: 'Travel', count: 20 },
    { key: 'cloud-computing', name: 'Technology', count: 20 }
  ];
  
  const results = [];
  let totalRegenerated = 0;
  let totalFailed = 0;
  
  for (const domain of domainsToRegenerate) {
    const result = await regenerateDomainArticles(domain.key, domain.name, domain.count);
    results.push(result);
    totalRegenerated += result.regenerated;
    totalFailed += result.failed;
  }
  
  console.log('\n=== Regeneration Summary ===');
  for (const result of results) {
    console.log(`${result.domain}: ${result.regenerated} regenerated, ${result.failed} failed`);
  }
  console.log(`\nTotal Regenerated: ${totalRegenerated}`);
  console.log(`Total Failed: ${totalFailed}`);
  
  return {
    domainsUpdated: results.length,
    articlesRegenerated: totalRegenerated,
    articlesFailed: totalFailed
  };
}

main().then(results => {
  console.log('\n✓ Article regeneration complete');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
