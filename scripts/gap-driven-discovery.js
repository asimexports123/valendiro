require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Category Definitions ─────────────────────────────────────────────

const categoryDefinitions = {
  'aws': {
    name: 'AWS',
    keywords: ['aws', 'ec2', 's3', 'iam', 'lambda', 'cloudformation', 'cloudwatch', 'rds', 'vpc', 'eks', 'ecs'],
    expectedTopics: [
      'aws-ec2', 'aws-s3', 'aws-iam', 'aws-lambda', 'aws-cloudformation', 'aws-cloudwatch',
      'aws-rds', 'aws-vpc', 'aws-eks', 'aws-ecs', 'aws-api-gateway', 'aws-sns', 'aws-sqs',
      'aws-dynamodb', 'aws-elasticache', 'aws-route53', 'aws-cloudfront', 'aws-autoscaling',
      'aws-elb', 'aws-ses', 'aws-cloudtrail', 'aws-config', 'aws-athena', 'aws-glue'
    ]
  },
  'python': {
    name: 'Python',
    keywords: ['python', 'django', 'flask', 'pandas', 'numpy', 'fastapi', 'asyncio'],
    expectedTopics: [
      'python-fundamentals', 'python-variables', 'python-data-types', 'python-lists',
      'python-dictionaries', 'python-functions', 'python-classes', 'python-modules',
      'python-decorators', 'python-generators', 'python-async', 'python-exceptions',
      'python-file-handling', 'python-testing', 'python-packaging', 'python-virtualenv',
      'python-pip', 'python-requirements', 'python-environment-variables', 'python-logging'
    ]
  },
  'kubernetes': {
    name: 'Kubernetes',
    keywords: ['kubernetes', 'k8s', 'pod', 'deployment', 'service', 'ingress', 'namespace'],
    expectedTopics: [
      'kubernetes-fundamentals', 'kubernetes-pods', 'kubernetes-deployments',
      'kubernetes-services', 'kubernetes-ingress', 'kubernetes-namespaces',
      'kubernetes-configmaps', 'kubernetes-secrets', 'kubernetes-helm',
      'kubernetes-kubectl', 'kubernetes-scaling', 'kubernetes-security',
      'kubernetes-networking', 'kubernetes-storage', 'kubernetes-monitoring',
      'kubernetes-logging', 'kubernetes-troubleshooting', 'kubernetes-best-practices'
    ]
  },
  'javascript': {
    name: 'JavaScript',
    keywords: ['javascript', 'js', 'nodejs', 'react', 'vue', 'angular', 'typescript'],
    expectedTopics: [
      'javascript-fundamentals', 'javascript-variables', 'javascript-functions',
      'javascript-arrays', 'javascript-objects', 'javascript-promises',
      'javascript-async-await', 'javascript-es6', 'javascript-dom',
      'javascript-events', 'javascript-fetch', 'nodejs-fundamentals',
      'react-fundamentals', 'react-hooks', 'react-components', 'react-state',
      'typescript-fundamentals', 'vue-fundamentals', 'angular-fundamentals'
    ]
  },
  'docker': {
    name: 'Docker',
    keywords: ['docker', 'container', 'dockerfile', 'docker-compose'],
    expectedTopics: [
      'docker-fundamentals', 'docker-containers', 'docker-images',
      'dockerfile', 'docker-compose', 'docker-networks',
      'docker-volumes', 'docker-registry', 'docker-security',
      'docker-optimization', 'docker-troubleshooting', 'docker-best-practices'
    ]
  },
  'git': {
    name: 'Git',
    keywords: ['git', 'github', 'gitlab', 'version-control'],
    expectedTopics: [
      'git-fundamentals', 'git-branches', 'git-merge', 'git-rebase',
      'github-fundamentals', 'github-actions', 'git-workflows',
      'git-stash', 'git-reset', 'git-cherry-pick', 'git-best-practices'
    ]
  },
  'finance': {
    name: 'Finance',
    keywords: ['finance', 'investing', 'stock', 'bond', '401k', 'ira', 'budget'],
    expectedTopics: [
      'finance-fundamentals', 'investing-basics', 'stock-market-fundamentals',
      '401k-fundamentals', 'budgeting-fundamentals', 'debt-management',
      'mutual-funds', 'etf-fundamentals', 'retirement-planning', 'tax-fundamentals',
      'credit-scores', 'insurance-fundamentals', 'savings-accounts', 'emergency-fund'
    ]
  },
  'cloud-computing': {
    name: 'Cloud Computing',
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'saas', 'paas', 'iaas'],
    expectedTopics: [
      'cloud-computing-fundamentals', 'aws-fundamentals', 'azure-fundamentals',
      'gcp-fundamentals', 'serverless-fundamentals', 'saas-vs-paas-vs-iaas',
      'cloud-security', 'cloud-cost-management', 'cloud-migration',
      'cloud-architecture', 'multi-cloud', 'hybrid-cloud'
    ]
  }
};

// ─── Calculate Category Coverage ─────────────────────────────────────

async function calculateCategoryCoverage() {
  const { data: allTopics } = await sb
    .from('topics')
    .select('slug')
    .eq('status', 'published');
  
  const existingTopics = new Set(allTopics?.map(t => t.slug) || []);
  const coverageData = [];
  
  for (const [categoryKey, categoryDef] of Object.entries(categoryDefinitions)) {
    let existingCount = 0;
    const missingTopics = [];
    
    for (const expectedTopic of categoryDef.expectedTopics) {
      if (existingTopics.has(expectedTopic)) {
        existingCount++;
      } else {
        missingTopics.push(expectedTopic);
      }
    }
    
    const completionPercent = (existingCount / categoryDef.expectedTopics.length) * 100;
    
    coverageData.push({
      key: categoryKey,
      name: categoryDef.name,
      existing: existingCount,
      expected: categoryDef.expectedTopics.length,
      missingTopics: missingTopics,
      missingCount: missingTopics.length,
      coverage: completionPercent.toFixed(1)
    });
  }
  
  // Sort by coverage (lowest first)
  coverageData.sort((a, b) => parseFloat(a.coverage) - parseFloat(b.coverage));
  
  return coverageData;
}

// ─── Queue Missing Topics by Priority ───────────────────────────────

async function queueMissingTopics(coverageData) {
  console.log('=== Queueing Missing Topics by Priority ===\n');
  
  const priorityThresholds = [30, 50, 70, 90];
  let totalQueued = 0;
  const categoriesExpanded = [];
  
  for (const threshold of priorityThresholds) {
    console.log(`\nPriority: Categories below ${threshold}% coverage`);
    
    for (const category of coverageData) {
      const coverage = parseFloat(category.coverage);
      
      if (coverage < threshold && category.missingCount > 0) {
        // Queue missing topics for this category
        for (const missingTopic of category.missingTopics) {
          const canonicalPath = `/${missingTopic}`;
          
          const { error } = await sb
            .from('topics')
            .insert({
              slug: missingTopic,
              canonical_path: canonicalPath,
              status: 'published',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (!error) {
            totalQueued++;
            console.log(`  ✓ Queued: ${missingTopic} (${category.name})`);
          }
        }
        
        if (category.missingCount > 0 && !categoriesExpanded.includes(category.name)) {
          categoriesExpanded.push(category.name);
        }
      }
    }
  }
  
  return { totalQueued, categoriesExpanded };
}

// ─── Get Queue Size ───────────────────────────────────────────────

async function getQueueSize() {
  const { data: topics } = await sb
    .from('topics')
    .select('id')
    .eq('status', 'published');
  
  if (!topics) return 0;
  
  let queueSize = 0;
  for (const topic of topics) {
    const { data: kp } = await sb
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topic.id)
      .maybeSingle();
    
    if (!kp) {
      queueSize++;
    }
  }
  
  return queueSize;
}

// ─── Main Gap-Driven Discovery ─────────────────────────────────────

async function main() {
  console.log('=== Gap-Driven Discovery ===\n');
  
  const startTime = Date.now();
  
  // Step 1: Calculate category coverage
  console.log('Calculating category coverage...\n');
  const coverageData = await calculateCategoryCoverage();
  
  console.log('Category Coverage:');
  for (const category of coverageData) {
    console.log(`${category.name}:`);
    console.log(`  Existing: ${category.existing}/${category.expected}`);
    console.log(`  Coverage: ${category.coverage}%`);
    console.log(`  Missing: ${category.missingCount} topics`);
    console.log();
  }
  
  // Step 2: Queue missing topics by priority
  const queueResult = await queueMissingTopics(coverageData);
  
  // Step 3: Get final queue size
  const finalQueueSize = await getQueueSize();
  
  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n=== Gap-Driven Discovery Results ===');
  console.log(`Categories Expanded: ${queueResult.categoriesExpanded.length}`);
  console.log(`Missing Topics Queued: ${queueResult.totalQueued}`);
  console.log(`Queue Size: ${finalQueueSize}`);
  console.log(`Execution Time: ${executionTime}s`);
  
  console.log('\nCoverage Improvements:');
  for (const category of coverageData) {
    if (queueResult.categoriesExpanded.includes(category.name)) {
      console.log(`  ${category.name}: ${category.coverage}% → ${((category.existing + category.missingCount) / category.expected * 100).toFixed(1)}% (queued ${category.missingCount} topics)`);
    }
  }
  
  return {
    categoriesExpanded: queueResult.categoriesExpanded.length,
    missingTopicsQueued: queueResult.totalQueued,
    coverageImprovements: coverageData.filter(c => queueResult.categoriesExpanded.includes(c.name)).map(c => ({
      category: c.name,
      from: c.coverage,
      to: ((c.existing + c.missingCount) / c.expected * 100).toFixed(1),
      topicsQueued: c.missingCount
    })),
    queueSize: finalQueueSize
  };
}

main().then(results => {
  console.log('\n✓ Gap-driven discovery complete');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
