import { pipelineOrchestrator, BusinessObjective } from '../services/orchestrator/pipelineOrchestrator';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

process.env.ALLOW_RENDER = "true";

async function testOrchestration() {
  console.log('========================================');
  console.log('Phase 20: Autonomous Pipeline Execution Test');
  console.log('========================================\n');

  // Test 1: Compress all content
  console.log('Test 1: Compress all content');
  console.log('---');
  const report1 = await pipelineOrchestrator.executeObjective('compress-all-content', { limit: 5 });
  console.log('Status:', report1.status);
  console.log('Tasks executed:', report1.tasks.length);
  console.log('Summary:', JSON.stringify(report1.summary, null, 2));
  if (report1.errors) {
    console.log('Errors:', report1.errors);
  }
  console.log('');

  // Test 2: Optimize for scanning
  console.log('Test 2: Optimize for scanning');
  console.log('---');
  const report2 = await pipelineOrchestrator.executeObjective('optimize-for-scanning', { limit: 3 });
  console.log('Status:', report2.status);
  console.log('Tasks executed:', report2.tasks.length);
  console.log('Summary:', JSON.stringify(report2.summary, null, 2));
  if (report2.errors) {
    console.log('Errors:', report2.errors);
  }
  console.log('');

  console.log('========================================');
  console.log('Phase 20 Test: COMPLETE');
  console.log('========================================');
}

testOrchestration().catch(console.error);
