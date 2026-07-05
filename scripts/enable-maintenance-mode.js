require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const fs = require('fs').promises;
const path = require('path');

const STATE_FILE = path.join(process.cwd(), '.pipeline-state.json');

async function enableMaintenanceMode() {
  console.log('=== Enabling Maintenance Mode ===\n');
  
  const state = {
    status: 'maintenance',
    pausedAt: new Date().toISOString(),
    resumedAt: null,
    operator: 'System'
  };
  
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  
  console.log('✓ Maintenance mode enabled');
  console.log('  - Topic processing: PAUSED');
  console.log('  - Knowledge Package processing: PAUSED');
  console.log('  - Authoring: PAUSED');
  console.log('  - Publishing: PAUSED');
  console.log('  - Website serving: ACTIVE');
  console.log('  - Article serving: ACTIVE');
  
  return state;
}

enableMaintenanceMode().then(state => {
  console.log('\n✓ Maintenance mode complete');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
