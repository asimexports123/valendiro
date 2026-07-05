/**
 * Production Readiness Validator
 * 
 * Read-only validation script to verify production deployment readiness.
 * Never modifies production data.
 */

import { createClient } from '@supabase/supabase-js';

interface ReadinessCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
}

interface ReadinessResult {
  overall: 'READY' | 'NOT READY';
  checks: ReadinessCheck[];
  missingItems: string[];
}

async function checkEnvironmentVariables(): Promise<ReadinessCheck> {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SITE_NAME',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    return {
      name: 'Environment Variables',
      status: 'PASS',
      message: 'All required environment variables are configured',
    };
  }

  return {
    name: 'Environment Variables',
    status: 'FAIL',
    message: `Missing variables: ${missingVars.join(', ')}`,
  };
}

async function checkDatabaseConnectivity(): Promise<ReadinessCheck> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'Database Connectivity',
        status: 'FAIL',
        message: 'Missing database credentials',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection with a simple query
    const { error } = await supabase.from('topics').select('id').limit(1);
    
    if (error) {
      return {
        name: 'Database Connectivity',
        status: 'FAIL',
        message: `Database connection failed: ${error.message}`,
      };
    }

    return {
      name: 'Database Connectivity',
      status: 'PASS',
      message: 'Database connection successful',
    };
  } catch (error: any) {
    return {
      name: 'Database Connectivity',
      status: 'FAIL',
      message: `Database connection error: ${error.message}`,
    };
  }
}

async function checkRequiredTables(): Promise<ReadinessCheck> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'Required Tables',
        status: 'SKIP',
        message: 'Cannot check tables without database credentials',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const requiredTables = [
      'topics',
      'topic_translations',
      'knowledge_packages',
      'rendered_outputs',
      'publication_logs',
      'categories',
      'subcategories',
      'tags',
      'topic_tags',
      'citations',
      'relationships',
    ];

    const missingTables: string[] = [];

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        missingTables.push(table);
      }
    }

    if (missingTables.length === 0) {
      return {
        name: 'Required Tables',
        status: 'PASS',
        message: 'All required tables exist',
      };
    }

    return {
      name: 'Required Tables',
      status: 'FAIL',
      message: `Missing tables: ${missingTables.join(', ')}`,
    };
  } catch (error: any) {
    return {
      name: 'Required Tables',
      status: 'FAIL',
      message: `Table check error: ${error.message}`,
    };
  }
}

async function checkRequiredSecrets(): Promise<ReadinessCheck> {
  const requiredSecrets = [
    'CACHE_REVALIDATION_SECRET',
    'SITEMAP_UPDATE_SECRET',
    'PUBLICATION_WEBHOOK_SECRET',
    'JOB_CRON_SECRET',
    'QUEUE_SECRET',
  ];

  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
  
  if (missingSecrets.length === 0) {
    return {
      name: 'Required Secrets',
      status: 'PASS',
      message: 'All required secrets are configured',
    };
  }

  return {
    name: 'Required Secrets',
    status: 'FAIL',
    message: `Missing secrets: ${missingSecrets.join(', ')}`,
  };
}

async function checkEndpoints(): Promise<ReadinessCheck> {
  const requiredEndpoints = [
    '/api/revalidate',
    '/sitemap.xml',
    '/api/publication',
  ];

  // Since we can't actually test endpoints from a script without a running server,
  // we'll just check if the endpoint files exist
  const fs = await import('fs');
  const path = await import('path');
  
  const missingEndpoints: string[] = [];

  for (const endpoint of requiredEndpoints) {
    const filePath = path.join(process.cwd(), 'app', endpoint.replace('/api/', 'api/').replace('.xml', '.ts'));
    
    if (!fs.existsSync(filePath)) {
      missingEndpoints.push(endpoint);
    }
  }

  if (missingEndpoints.length === 0) {
    return {
      name: 'Required Endpoints',
      status: 'PASS',
      message: 'All required endpoint files exist',
    };
  }

  return {
    name: 'Required Endpoints',
    status: 'FAIL',
    message: `Missing endpoint files: ${missingEndpoints.join(', ')}`,
  };
}

async function main() {
  console.log('========================================');
  console.log('Production Readiness Validator');
  console.log('========================================\n');

  const checks: ReadinessCheck[] = [];
  const missingItems: string[] = [];

  // Run all checks
  const envCheck = await checkEnvironmentVariables();
  checks.push(envCheck);
  if (envCheck.status === 'FAIL') {
    missingItems.push(envCheck.message);
  }

  const dbCheck = await checkDatabaseConnectivity();
  checks.push(dbCheck);
  if (dbCheck.status === 'FAIL') {
    missingItems.push(dbCheck.message);
  }

  const tablesCheck = await checkRequiredTables();
  checks.push(tablesCheck);
  if (tablesCheck.status === 'FAIL') {
    missingItems.push(tablesCheck.message);
  }

  const secretsCheck = await checkRequiredSecrets();
  checks.push(secretsCheck);
  if (secretsCheck.status === 'FAIL') {
    missingItems.push(secretsCheck.message);
  }

  const endpointsCheck = await checkEndpoints();
  checks.push(endpointsCheck);
  if (endpointsCheck.status === 'FAIL') {
    missingItems.push(endpointsCheck.message);
  }

  // Print results
  console.log('Readiness Checks:\n');
  
  for (const check of checks) {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.message}`);
  }

  console.log('\n' + '='.repeat(40));

  const overall = checks.every(check => check.status === 'PASS' || check.status === 'SKIP') ? 'READY' : 'NOT READY';
  
  console.log(`\nOverall Status: ${overall}`);

  if (missingItems.length > 0) {
    console.log('\nMissing Items:');
    for (const item of missingItems) {
      console.log(`  - ${item}`);
    }
  }

  console.log('\n' + '='.repeat(40));
  
  process.exit(overall === 'READY' ? 0 : 1);
}

main().catch(error => {
  console.error('Readiness validation failed:', error);
  process.exit(1);
});
