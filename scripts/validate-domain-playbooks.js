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

// ─── Generate Article with Domain Playbook ─────────────────────────

async function generateArticleWithPlaybook(topicId, slug) {
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const domain = detectDomain(slug);
  const playbook = domainPlaybooks.domains[domain] || domainPlaybooks.domains['cloud-computing'];
  
  // Build content from playbook
  let content = `# ${title}\n\n`;
  
  // Add required sections
  for (const section of playbook.requiredSections) {
    content += `## ${section}\n\n`;
    
    if (section === 'Overview') {
      content += `${title} is a fundamental concept in ${playbook.name}. This guide covers essential aspects including terminology, implementation, and best practices.\n\n`;
    } else if (section === 'Architecture') {
      content += `### Architecture Overview\n\`\`\`\n[Diagram: ${title} Architecture]\nComponents and data flow\n\`\`\`\n`;
    } else if (section === 'Configuration') {
      content += `### Configuration\n\`\`\`\n# Example configuration\nsetting1: value1\nsetting2: value2\n\`\`\`\n`;
    } else if (section === 'Pricing') {
      content += `### Pricing\n| Tier | Price | Features |\n|------|-------|----------|\n| Free | $0 | Basic |\n| Pro | $X | Advanced |\n`;
    } else if (section === 'Security') {
      content += `### Security\n⚠️ **Important:** Configure security properly for ${title}.\n\n`;
    } else if (section === 'Best Practices') {
      content += `### Best Practices\n✓ Practice 1\n✓ Practice 2\n✓ Practice 3\n\n`;
    } else {
      content += `Content for ${section}.\n\n`;
    }
  }
  
  // Add terminology section
  if (playbook.terminology.length > 0) {
    content += `## Key Terminology\n\n`;
    for (const term of playbook.terminology.slice(0, 10)) {
      content += `- **${term}**: Definition and context\n`;
    }
    content += `\n`;
  }
  
  // Add entities section
  if (playbook.entities.length > 0) {
    content += `## Key Entities\n\n`;
    for (const entity of playbook.entities.slice(0, 8)) {
      content += `- **${entity}**: Description and role\n`;
    }
    content += `\n`;
  }
  
  // Add examples section
  if (playbook.requiredExamples.length > 0) {
    content += `## Examples\n\n`;
    for (const example of playbook.requiredExamples.slice(0, 3)) {
      content += `${example}\n\n`;
    }
  }
  
  // Add warnings section
  if (playbook.requiredWarnings.length > 0) {
    content += `## Warnings\n\n`;
    for (const warning of playbook.requiredWarnings.slice(0, 3)) {
      content += `⚠️ **${warning}**\n\n`;
    }
  }
  
  // Add FAQ section
  if (playbook.requiredFAQs.length > 0) {
    content += `## FAQ\n\n`;
    for (const faq of playbook.requiredFAQs.slice(0, 3)) {
      content += `**Q:** ${faq}\n**A:** Answer to ${faq}\n\n`;
    }
  }
  
  // Add references section
  content += `## References\n\n`;
  for (const ref of playbook.requiredReferences.slice(0, 3)) {
    content += `- ${ref}\n`;
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
  
  // Check for generic content
  const isGeneric = content.includes('Content for') || content.includes('Description and role');
  
  return { 
    success: true, 
    domain,
    playbook: playbook.name,
    sections: playbook.requiredSections.length,
    terminology: playbook.terminology.length,
    entities: playbook.entities.length,
    isGeneric
  };
}

// ─── Validate Domain with 20 Articles ─────────────────────────────

async function validateDomain(domainKey, domainName) {
  console.log(`\n=== Validating ${domainName} ===`);
  
  // Get topics for this domain
  const { data: allTopics } = await sb
    .from('topics')
    .select('id, slug')
    .eq('status', 'published')
    .limit(100);
  
  // Filter topics by domain
  const domainTopics = [];
  for (const topic of allTopics || []) {
    const detectedDomain = detectDomain(topic.slug);
    if (detectedDomain === domainKey) {
      domainTopics.push(topic);
    }
  }
  
  // Select 20 random topics
  const shuffled = domainTopics.sort(() => 0.5 - Math.random());
  const selectedTopics = shuffled.slice(0, 20);
  
  console.log(`Found ${domainTopics.length} topics, validating ${selectedTopics.length}`);
  
  let generated = 0;
  let genericCount = 0;
  let totalSections = 0;
  let totalTerminology = 0;
  let totalEntities = 0;
  
  for (const topic of selectedTopics) {
    const result = await generateArticleWithPlaybook(topic.id, topic.slug);
    
    if (result.success) {
      generated++;
      totalSections += result.sections;
      totalTerminology += result.terminology;
      totalEntities += result.entities;
      
      if (result.isGeneric) {
        genericCount++;
      }
      
      console.log(`  ✓ ${topic.slug}: ${result.playbook}, ${result.sections} sections`);
    }
  }
  
  const genericPercent = generated > 0 ? ((genericCount / generated) * 100).toFixed(1) : '0';
  const isApproved = genericCount === 0 && generated >= 20;
  
  return {
    domain: domainName,
    topicsFound: domainTopics.length,
    validated: generated,
    genericCount,
    genericPercent,
    avgSections: generated > 0 ? (totalSections / generated).toFixed(1) : 0,
    avgTerminology: generated > 0 ? (totalTerminology / generated).toFixed(1) : 0,
    avgEntities: generated > 0 ? (totalEntities / generated).toFixed(1) : 0,
    approved: isApproved
  };
}

// ─── Main Validation ───────────────────────────────────────────────

async function main() {
  console.log('=== Domain Playbook Validation ===\n');
  
  const startTime = Date.now();
  
  const validationResults = [];
  let domainsCompleted = 0;
  
  for (const [domainKey, domainDef] of Object.entries(domainPlaybooks.domains)) {
    const result = await validateDomain(domainKey, domainDef.name);
    validationResults.push(result);
    
    if (result.approved) {
      domainsCompleted++;
    }
  }
  
  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n=== Validation Results ===');
  for (const result of validationResults) {
    console.log(`${result.domain}:`);
    console.log(`  Validated: ${result.validated}/20`);
    console.log(`  Generic: ${result.genericCount} (${result.genericPercent}%)`);
    console.log(`  Approved: ${result.approved ? '✓' : '✗'}`);
  }
  
  const allApproved = validationResults.every(r => r.approved);
  
  console.log(`\nDomains Completed: ${domainsCompleted}/${validationResults.length}`);
  console.log(`Ready For Resume: ${allApproved ? 'Yes' : 'No'}`);
  console.log(`Execution Time: ${executionTime}s`);
  
  return {
    domainsCompleted,
    validationResults,
    readyForResume: allApproved
  };
}

main().then(results => {
  console.log('\n✓ Domain validation complete');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
