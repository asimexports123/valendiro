require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Load domain configurations
const domainConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/domain-configurations.json'), 'utf8')
);

// ─── Domain Detection ───────────────────────────────────────────────────────

function detectDomain(slug, knowledgePackage) {
  const slugLower = slug.toLowerCase();
  const concepts = knowledgePackage.concepts || [];
  const conceptStrings = concepts.map(c => JSON.stringify(c).toLowerCase()).join(' ');
  
  // Calculate score for each domain
  const domainScores = {};
  
  for (const [domainName, domainConfigItem] of Object.entries(domainConfig.domains)) {
    let score = 0;
    
    // Check slug keywords
    for (const keyword of domainConfigItem.keywords) {
      if (slugLower.includes(keyword)) {
        score += 2;
      }
    }
    
    // Check concepts for expected entities
    for (const entity of domainConfigItem.expectedEntities) {
      if (conceptStrings.includes(entity.toLowerCase())) {
        score += 1;
      }
    }
    
    domainScores[domainName] = score;
  }
  
  // Find domain with highest score
  let bestDomain = null;
  let bestScore = 0;
  
  for (const [domainName, score] of Object.entries(domainScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domainName;
    }
  }
  
  return {
    domain: bestDomain || 'default',
    confidence: bestScore,
    scores: domainScores
  };
}

// ─── Intent Detection ───────────────────────────────────────────────────────

function detectIntent(slug, domain) {
  const slugLower = slug.toLowerCase();
  
  // Intent patterns
  const intents = {
    'tutorial': ['tutorial', 'guide', 'how-to', 'getting-started', 'introduction', 'basics'],
    'reference': ['api', 'reference', 'documentation', 'syntax', 'commands'],
    'comparison': ['vs', 'versus', 'comparison', 'difference', 'compare'],
    'troubleshooting': ['troubleshooting', 'error', 'fix', 'debug', 'solve'],
    'best-practices': ['best-practices', 'optimization', 'performance', 'security'],
    'overview': ['overview', 'introduction', 'what-is', 'fundamentals']
  };
  
  for (const [intent, patterns] of Object.entries(intents)) {
    for (const pattern of patterns) {
      if (slugLower.includes(pattern)) {
        return intent;
      }
    }
  }
  
  return 'overview';
}

// ─── Section Generation from Knowledge Package ─────────────────────────────

function generateSectionsFromKnowledgePackage(slug, knowledgePackage, domain, intent) {
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const domainConfig_obj = domainConfig.domains[domain] || domainConfig.defaultSectionTemplates;
  
  const concepts = knowledgePackage.concepts || [];
  const procedures = knowledgePackage.procedures || [];
  const definitions = knowledgePackage.definitions || [];
  const examples = knowledgePackage.examples || [];
  
  // Extract key concepts for section generation
  const keyConcepts = concepts.slice(0, 8).map(c => c.name || c.concept || JSON.stringify(c));
  
  let sections = '';
  const sectionTemplates = domainConfig_obj.sectionTemplates || domainConfig.defaultSectionTemplates;
  
  // Generate overview section
  sections += `## ${sectionTemplates.overview || 'Overview'}\n`;
  sections += `${title} is a comprehensive topic with significant practical applications. `;
  
  if (definitions.length > 0) {
    sections += `It is defined as: ${definitions[0].definition || definitions[0]}. `;
  }
  
  sections += `Understanding ${title} requires knowledge of key concepts including ${keyConcepts.slice(0, 3).join(', ')}. \n\n`;
  
  // Generate domain-specific sections based on available concepts
  if (domainConfig_obj.expectedEntities) {
    const matchedEntities = domainConfig_obj.expectedEntities.filter(entity => {
      const entityLower = entity.toLowerCase();
      return keyConcepts.some(concept => concept.toLowerCase().includes(entityLower));
    });
    
    for (const entity of matchedEntities.slice(0, 5)) {
      const sectionKey = entity.toLowerCase().replace(/\s+/g, '-');
      const sectionTitle = sectionTemplates[sectionKey] || entity.charAt(0).toUpperCase() + entity.slice(1);
      
      sections += `## ${sectionTitle}\n`;
      sections += `${entity} is a critical aspect of ${title}. `;
      
      // Find related concepts
      const relatedConcepts = concepts.filter(c => {
        const conceptStr = JSON.stringify(c).toLowerCase();
        return conceptStr.includes(entity.toLowerCase());
      });
      
      if (relatedConcepts.length > 0) {
        const conceptDesc = relatedConcepts[0].description || relatedConcepts[0].explanation || '';
        if (conceptDesc) {
          sections += `${conceptDesc} `;
        }
      }
      
      sections += `This component plays a vital role in the overall functionality and effectiveness of ${title}.\n\n`;
    }
  }
  
  // Generate procedure section if available
  if (procedures.length > 0) {
    sections += `## ${sectionTemplates.implementation || 'Implementation Guidelines'}\n`;
    sections += `To effectively work with ${title}, follow these key steps:\n\n`;
    
    procedures.slice(0, 5).forEach((proc, idx) => {
      const steps = proc.steps || proc.procedure || [];
      if (Array.isArray(steps)) {
        sections += `${idx + 1}. ${steps[0] || proc.name || 'Step ' + (idx + 1)}\n`;
      } else {
        sections += `${idx + 1}. ${steps || proc.name || 'Step ' + (idx + 1)}\n`;
      }
    });
    
    sections += `\n`;
  }
  
  // Generate examples section if available and domain requires code examples
  if (examples.length > 0 && domainConfig_obj.requiresCodeExamples) {
    sections += `## ${sectionTemplates.examples || 'Code Examples'}\n`;
    sections += `The following examples demonstrate practical applications of ${title}:\n\n`;
    
    examples.slice(0, 3).forEach((example, idx) => {
      const exampleCode = example.code || example.example || example;
      sections += `### Example ${idx + 1}\n`;
      sections += `\`\`\`\n${exampleCode}\n\`\`\`\n\n`;
    });
  }
  
  // Generate best practices section
  sections += `## ${sectionTemplates['best-practices'] || 'Best Practices'}\n`;
  sections += `Following best practices ensures optimal results with ${title}:\n\n`;
  
  // Generate best practices from concepts
  const bestPractices = concepts
    .filter(c => c.type === 'best-practice' || c.category === 'best-practice')
    .slice(0, 5);
  
  if (bestPractices.length > 0) {
    bestPractices.forEach(bp => {
      sections += `- ${bp.name || bp.concept || 'Best practice'}\n`;
    });
  } else {
    // Generate generic best practices based on domain
    const genericPractices = [
      'Start with fundamentals and build gradually',
      'Follow established patterns and conventions',
      'Test thoroughly before deployment',
      'Monitor performance and iterate',
      'Stay updated with latest developments'
    ];
    genericPractices.forEach(practice => {
      sections += `- ${practice}\n`;
    });
  }
  
  sections += `\n`;
  
  // Build complete content
  const content = `# ${title}

## Executive Summary
${title} is a comprehensive topic that requires understanding both theoretical foundations and practical applications. This guide provides in-depth coverage of essential concepts, real-world scenarios, and actionable insights.

${sections}

## Real-world Applications
${examples.length > 0 ? examples.slice(0, 2).map((ex, i) => `Example ${i + 1}: ${ex.description || ex.title || 'Practical application'}`).join('\n') : 'Practical applications demonstrate the value of ' + title + ' in real-world scenarios.'}

## FAQs
**Q: What is the best way to learn ${title}?**
A: Start with fundamentals and practice regularly with real-world examples.

**Q: How long does it take to master ${title}?**
A: Depends on background and dedication, but consistent practice yields results in 3-6 months.

## Key Takeaways
- Fundamentals are essential for mastery
- Practical application reinforces learning
- Following best practices ensures success

## References
Knowledge Package: ${knowledgePackage.knowledge_hash || 'Available'}
Sources: ${knowledgePackage.source_count || 'Multiple authoritative sources'}
Facts: ${knowledgePackage.fact_count || 'Numerous verified facts'}

## Related Topics
- Advanced concepts in ${title}
- Practical applications
- Industry best practices
`;

  return content;
}

// ─── Self-Validation ───────────────────────────────────────────────────────

function validateArticle(content, domain) {
  const validationRules = domainConfig.validationRules;
  const errors = [];
  const warnings = [];
  
  // Check for forbidden patterns (generic filler sections)
  for (const pattern of validationRules.forbiddenPatterns) {
    if (content.includes(pattern)) {
      errors.push(`Found generic filler section: "${pattern}"`);
    }
  }
  
  // Check section count
  const sectionMatches = content.match(/^##\s+.+$/gm) || [];
  if (sectionMatches.length < validationRules.minSectionCount) {
    errors.push(`Insufficient sections: ${sectionMatches.length} (minimum: ${validationRules.minSectionCount})`);
  }
  if (sectionMatches.length > validationRules.maxSectionCount) {
    warnings.push(`Too many sections: ${sectionMatches.length} (maximum: ${validationRules.maxSectionCount})`);
  }
  
  // Check word count
  const wordCount = content.split(/\s+/).length;
  if (wordCount < validationRules.minWordCount) {
    errors.push(`Insufficient word count: ${wordCount} (minimum: ${validationRules.minWordCount})`);
  }
  
  // Check for required fields
  if (!content.includes('## References')) {
    errors.push('Missing References section');
  }
  if (!content.includes('## Related Topics')) {
    errors.push('Missing Related Topics section');
  }
  
  // Check for placeholder text
  if (content.includes('[TODO]') || content.includes('[PLACEHOLDER]') || content.includes('TBD')) {
    errors.push('Found placeholder text in content');
  }
  
  // Check if content is topic-specific
  const genericPhrases = [
    'This is an important topic',
    'Understanding this topic',
    'This comprehensive guide',
    'In this article we will'
  ];
  
  const genericPhraseCount = genericPhrases.filter(phrase => content.includes(phrase)).length;
  if (genericPhraseCount > 3) {
    warnings.push(`Content may be too generic (${genericPhraseCount} generic phrases found)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      sectionCount: sectionMatches.length,
      wordCount,
      genericPhraseCount
    }
  };
}

// ─── Autonomous Pipeline ───────────────────────────────────────────────────

async function getTopicsForProcessing() {
  // Get topics that have knowledge packages
  const { data: topicsWithPackages } = await sb
    .from('knowledge_packages')
    .select('topic_id, topics!inner(slug, category_id)')
    .limit(50);
  
  return topicsWithPackages?.map(item => ({
    id: item.topic_id,
    slug: item.topics.slug,
    category_id: item.topics.category_id
  })) || [];
}

async function getKnowledgePackage(topicId) {
  const { data: pkg } = await sb
    .from('knowledge_packages')
    .select('*')
    .eq('topic_id', topicId)
    .maybeSingle();
  return pkg;
}

async function updateArticleContent(topicId, content) {
  const { error } = await sb
    .from('topic_translations')
    .update({ content: content })
    .eq('topic_id', topicId)
    .eq('language_code', 'en');

  return { success: !error, error: error?.message };
}

async function addToRetryQueue(topicId, slug, reason) {
  try {
    const { error } = await sb
      .from('retry_queue')
      .insert({
        topic_id: topicId,
        slug: slug,
        reason: reason,
        created_at: new Date().toISOString(),
        retry_count: 0
      });
    
    if (error) {
      console.log(`  ⚠ Could not add to retry queue (table may not exist): ${error.message}`);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (e) {
    console.log(`  ⚠ Could not add to retry queue: ${e.message}`);
    return { success: false, error: e.message };
  }
}

async function processTopic(topic) {
  console.log(`\nProcessing: ${topic.slug}`);
  
  // Get Knowledge Package
  const pkg = await getKnowledgePackage(topic.id);
  if (!pkg) {
    console.log(`  ✗ No knowledge package found`);
    return { success: false, reason: 'No knowledge package' };
  }
  
  // Detect domain
  const domainDetection = detectDomain(topic.slug, pkg);
  console.log(`  Domain: ${domainDetection.domain} (confidence: ${domainDetection.confidence})`);
  
  // Detect intent
  const intent = detectIntent(topic.slug, domainDetection.domain);
  console.log(`  Intent: ${intent}`);
  
  // Generate sections
  const content = generateSectionsFromKnowledgePackage(topic.slug, pkg, domainDetection.domain, intent);
  console.log(`  Generated ${content.split(/\s+/).length} words`);
  
  // Validate
  const validation = validateArticle(content, domainDetection.domain);
  if (!validation.isValid) {
    console.log(`  ✗ Validation failed: ${validation.errors.join(', ')}`);
    
    // Add to retry queue
    await addToRetryQueue(topic.id, topic.slug, validation.errors.join('; '));
    
    return { 
      success: false, 
      reason: 'Validation failed', 
      errors: validation.errors,
      warnings: validation.warnings 
    };
  }
  
  if (validation.warnings.length > 0) {
    console.log(`  ⚠ Warnings: ${validation.warnings.join(', ')}`);
  }
  
  // Update article
  const updateResult = await updateArticleContent(topic.id, content);
  if (!updateResult.success) {
    console.log(`  ✗ Failed to update article: ${updateResult.error}`);
    return { success: false, reason: updateResult.error };
  }
  
  console.log(`  ✓ Success`);
  return { 
    success: true, 
    domain: domainDetection.domain,
    intent,
    metrics: validation.metrics 
  };
}

// ─── Main Execution ───────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log('=== Autonomous Knowledge Factory ===\n');
  
  const topics = await getTopicsForProcessing();
  console.log(`Topics to process: ${topics.length}\n`);
  
  let processedCount = 0;
  let publishedCount = 0;
  let failedCount = 0;
  let retryQueueCount = 0;
  const results = [];
  
  for (const topic of topics) {
    const result = await processTopic(topic);
    processedCount++;
    
    if (result.success) {
      publishedCount++;
    } else {
      failedCount++;
      if (result.reason === 'Validation failed') {
        retryQueueCount++;
      }
    }
    
    results.push({
      slug: topic.slug,
      ...result
    });
  }
  
  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n=== Autonomous Knowledge Factory Results ===');
  console.log(`Topics Processed: ${processedCount}`);
  console.log(`Articles Published: ${publishedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Retry Queue: ${retryQueueCount}`);
  console.log(`Execution Time: ${executionTime}s`);
  
  // Domain breakdown
  const domainBreakdown = {};
  results.forEach(r => {
    if (r.success && r.domain) {
      domainBreakdown[r.domain] = (domainBreakdown[r.domain] || 0) + 1;
    }
  });
  
  console.log('\n=== Domain Breakdown ===');
  for (const [domain, count] of Object.entries(domainBreakdown)) {
    console.log(`${domain}: ${count}`);
  }
}

main();
