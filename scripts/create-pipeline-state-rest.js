require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});

async function createPipelineStateTable() {
  console.log('Creating pipeline_state table via REST API...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS pipeline_state (
      id BIGINT PRIMARY KEY DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'maintenance')),
      paused_at TIMESTAMPTZ,
      resumed_at TIMESTAMPTZ,
      operator TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT single_row CHECK (id = 1)
    );
    
    INSERT INTO pipeline_state (id, status, paused_at, resumed_at, operator)
    VALUES (1, 'running', NULL, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;
    
    ALTER TABLE pipeline_state ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY IF NOT EXISTS "Service role can manage pipeline state"
      ON pipeline_state
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  `;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      console.log('  ✓ Table created successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('  ✗ Error:', error);
      return false;
    }
    
  } catch (error) {
    console.log('  ✗ Error:', error.message);
    return false;
  }
}

createPipelineStateTable().then(success => {
  if (success) {
    console.log('\n✓ Pipeline state table created via REST API');
    process.exit(0);
  } else {
    console.log('\n✗ Failed to create table');
    process.exit(1);
  }
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
